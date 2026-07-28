import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { verifyAttendanceAuth, getClientIp } from "@/lib/attendanceAuth";
import type { AuthMethodDb } from "@/lib/employees";

export type AttendanceEventType = "check_in" | "go_out_personal" | "go_out_business" | "return" | "check_out";

/**
 * "출근 안 했는데 퇴근하기", "외출 중인데 또 외출하기" 같은 오남용을 막는 최소한의
 * 순서 강제 — 그날의 마지막 이벤트 타입을 기준으로 다음에 허용되는 타입만 나열한다.
 * "none"은 그날 아직 이벤트가 하나도 없는 상태(레코드 자체가 없거나, 레코드는 있지만
 * 이벤트가 없는 경우 둘 다 포함).
 *
 * 순서 강제가 필요한 이유: 지금은 홈 화면이 실제 상태 기반으로 유효한 버튼만 보여주므로
 * UI만으로도 대부분 막히지만, 두 탭을 동시에 열어두거나 네트워크 지연으로 화면이 오래된
 * 상태를 보여줄 수 있어 서버 쪽 최종 방어선이 필요하다고 판단했다. 또한 이 검증이 없으면
 * attendance_records_with_times VIEW의 min(check_in)/max(check_out) 가정이 깨질 수 있는
 * 이상 데이터(예: check_out 없이 check_in이 두 번)가 그대로 쌓일 수 있다.
 */
const NEXT_ALLOWED: Record<AttendanceEventType | "none", AttendanceEventType[]> = {
  none: ["check_in"],
  check_in: ["go_out_personal", "go_out_business", "check_out"],
  return: ["go_out_personal", "go_out_business", "check_out"],
  go_out_personal: ["return"],
  go_out_business: ["return"],
  check_out: [],
};

const SEQUENCE_ERROR_MESSAGE: Record<AttendanceEventType, string> = {
  check_in: "이미 오늘 출근 처리가 완료됐습니다.",
  go_out_personal: "지금 상태에서는 외출을 시작할 수 없습니다.",
  go_out_business: "지금 상태에서는 외근을 시작할 수 없습니다.",
  return: "외출/외근 중이 아니라 복귀할 수 없습니다.",
  check_out: "출근 기록이 없어 퇴근 처리할 수 없습니다.",
};

export type RecordAttendanceEventResult =
  | { ok: true }
  | {
      ok: false;
      reason: "ip_mismatch" | "gps_out_of_range" | "no_coords" | "manual_approval_required" | "invalid_sequence";
      message: string;
    };

/** KST(Asia/Seoul) 기준 오늘 날짜 — attendance_records.work_date는 달력 날짜라 UTC 기준이면 자정 근처에 하루씩 어긋난다. */
export function todayWorkDateKST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export type TodayAttendanceState = {
  recordId: string | null;
  status: "present" | "remote" | "absent" | "on_leave" | null;
  /** 확정(review_status='confirmed')된 이벤트만 — 검토대기중 이벤트는 근태상태/시각
   * 표시에 영향을 주면 안 되므로 여기 섞이지 않는다. */
  events: { eventType: AttendanceEventType; occurredAt: string }[];
  /** 확정된 이벤트만으로 계산 — 검토대기중 제출이 있어도 순서검증/홈 상태는
   * 그 전 확정 상태를 그대로 유지해서, 확정 전까지 다른 버튼을 계속 쓸 수 있게 한다. */
  lastEventType: AttendanceEventType | "none";
  /** S04~S07 "검토대기중 N건" 마킹용 — 오늘자 검토대기 이벤트 개수. */
  pendingReviewCount: number;
};

/** 홈 화면(S03~S07) 렌더링과 이벤트 기록 검증이 공유하는 "오늘 상태" 조회. */
export async function getTodayAttendanceState(employeeId: string): Promise<TodayAttendanceState> {
  const supabase = createSupabaseAdminClient();
  const workDate = todayWorkDateKST();

  const { data: record, error: recordError } = await supabase
    .from("attendance_records")
    .select("id, status")
    .eq("employee_id", employeeId)
    .eq("work_date", workDate)
    .maybeSingle();

  if (recordError) throw new Error(`근태 상태를 불러오지 못했습니다: ${recordError.message}`);
  if (!record) {
    return { recordId: null, status: null, events: [], lastEventType: "none", pendingReviewCount: 0 };
  }

  const { data: events, error: eventsError } = await supabase
    .from("attendance_events")
    .select("event_type, occurred_at, review_status")
    .eq("attendance_record_id", record.id)
    .order("occurred_at", { ascending: true });

  if (eventsError) throw new Error(`근태 이벤트를 불러오지 못했습니다: ${eventsError.message}`);

  const all = events ?? [];
  const confirmed = all.filter((e) => e.review_status === "confirmed");
  const pendingReviewCount = all.filter((e) => e.review_status === "pending_review").length;

  const mapped = confirmed.map((e) => ({
    eventType: e.event_type as AttendanceEventType,
    occurredAt: e.occurred_at as string,
  }));

  return {
    recordId: record.id,
    status: record.status,
    events: mapped,
    lastEventType: mapped.length > 0 ? mapped[mapped.length - 1]!.eventType : "none",
    pendingReviewCount,
  };
}

/**
 * S03~S07의 5개 버튼이 공유하는 쓰기 로직 — B-1(verifyAttendanceAuth)로 인증 판정 후,
 * 통과하면 순서를 검증하고 attendance_events에 기록한다. 실패 사유별로 DB에 아무것도
 * 쓰지 않아야 하는 경로(인증 실패, 관리자 수동승인 필요, 순서 오류)를 전부 여기서
 * 한곳에서 관리한다.
 */
export async function recordAttendanceEvent(params: {
  employeeId: string;
  authMethod: AuthMethodDb;
  eventType: AttendanceEventType;
  coords: { lat: number; lng: number } | null;
}): Promise<RecordAttendanceEventResult> {
  const { employeeId, authMethod, eventType, coords } = params;

  const authResult = await verifyAttendanceAuth(authMethod, coords);
  if (!authResult.ok) {
    const messages: Record<typeof authResult.reason, string> = {
      // navigator.onLine으로 실제 네트워크 상태를 분기하려 했으나, iOS Safari는
      // 오프라인이어도 거의 항상 true만 반환하는 알려진 WebKit 버그가 있어(bugs.webkit.org
      // #171277, #225645 — 조사 후 확인) 신뢰할 수 없다고 판단, 감지 대신 문구 자체를
      // 완화했다. 기기가 사내 wifi로 완전히 전환되기 전(셀룰러 상태 등) 클릭했을 때도
      // 이 사유로 뜨는 걸 실제로 겪었기 때문(2026-07-22 CD 실사용 중 진단).
      ip_mismatch: "등록된 사내 IP에서만 처리할 수 있습니다. 일시적인 네트워크 문제일 수 있으니 잠시 후 다시 시도해주세요.",
      gps_out_of_range: "회사 위치 반경 밖에 있습니다.",
      no_coords: "위치 권한이 필요합니다.",
      manual_approval_required: "자동 인증에 실패했습니다. 관리자에게 문의하세요.",
    };
    return { ok: false, reason: authResult.reason, message: messages[authResult.reason] };
  }

  const supabase = createSupabaseAdminClient();
  const workDate = todayWorkDateKST();

  const { data: existingRecord, error: existingError } = await supabase
    .from("attendance_records")
    .select("id, status")
    .eq("employee_id", employeeId)
    .eq("work_date", workDate)
    .maybeSingle();

  if (existingError) throw new Error(`근태 레코드를 조회하지 못했습니다: ${existingError.message}`);

  const lastEventType = await getLastConfirmedEventType(supabase, existingRecord?.id);

  if (!NEXT_ALLOWED[lastEventType].includes(eventType)) {
    return { ok: false, reason: "invalid_sequence", message: SEQUENCE_ERROR_MESSAGE[eventType] };
  }

  const record =
    existingRecord ??
    (await getOrInsertAttendanceRecord(supabase, employeeId, workDate));

  const ip = await getClientIp();

  const { error: insertError } = await supabase.from("attendance_events").insert({
    attendance_record_id: record.id,
    employee_id: employeeId,
    event_type: eventType,
    check_in_method: authResult.method,
    ip,
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
  });

  if (insertError) throw new Error(`근태 이벤트 기록에 실패했습니다: ${insertError.message}`);

  // 외출/외근 시작 시 '외출/외근' 표기(NOTE_FALLBACK.remote, src/lib/attendance.ts)가
  // 뜨도록 status를 remote로 바꾼다 — 이미 remote거나 이 그룹 범위 밖 상태(on_leave/absent)면
  // 건드리지 않는다.
  if ((eventType === "go_out_personal" || eventType === "go_out_business") && record.status === "present") {
    const { error: statusError } = await supabase
      .from("attendance_records")
      .update({ status: "remote" })
      .eq("id", record.id);
    if (statusError) throw new Error(`근태 상태 갱신에 실패했습니다: ${statusError.message}`);
  }

  return { ok: true };
}

/**
 * 순서검증(NEXT_ALLOWED)이 봐야 하는 "마지막 이벤트"는 확정된 것만이어야 한다 — 검토대기중
 * 제출이 하나 있어도 그 전 확정 상태 기준으로 다음 버튼이 계속 열려 있어야 하기 때문
 * (recordAttendanceEvent/submitManualAttendanceEvent 둘 다 이 헬퍼를 공유).
 */
async function getLastConfirmedEventType(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  recordId: string | undefined,
): Promise<AttendanceEventType | "none"> {
  if (!recordId) return "none";

  const { data: lastEvent, error } = await supabase
    .from("attendance_events")
    .select("event_type")
    .eq("attendance_record_id", recordId)
    .eq("review_status", "confirmed")
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`최근 근태 이벤트를 조회하지 못했습니다: ${error.message}`);
  return (lastEvent?.event_type as AttendanceEventType | undefined) ?? "none";
}

export type SubmitManualAttendanceEventResult =
  | { ok: true }
  | { ok: false; reason: "reason_required" | "invalid_sequence"; message: string };

/**
 * M1(인증 실패 시 사유 입력 시트) 제출 — verifyAttendanceAuth를 다시 거치지 않는다(이미
 * 실패했다는 걸 알고 사용자가 명시적으로 우회하는 경로이므로). check_in_method='manual',
 * review_status='pending_review'로 기록만 남기고, attendance_records.status는 건드리지
 * 않는다 — 관리자가 A08에서 확인완료 처리하기 전까지는 근태상태 메인값에 반영되지 않는다.
 */
export async function submitManualAttendanceEvent(params: {
  employeeId: string;
  eventType: AttendanceEventType;
  reason: string;
  coords: { lat: number; lng: number } | null;
}): Promise<SubmitManualAttendanceEventResult> {
  const { employeeId, eventType, reason, coords } = params;

  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    return { ok: false, reason: "reason_required", message: "사유를 입력해주세요." };
  }

  const supabase = createSupabaseAdminClient();
  const workDate = todayWorkDateKST();

  const { data: existingRecord, error: existingError } = await supabase
    .from("attendance_records")
    .select("id, status")
    .eq("employee_id", employeeId)
    .eq("work_date", workDate)
    .maybeSingle();

  if (existingError) throw new Error(`근태 레코드를 조회하지 못했습니다: ${existingError.message}`);

  const lastEventType = await getLastConfirmedEventType(supabase, existingRecord?.id);

  if (!NEXT_ALLOWED[lastEventType].includes(eventType)) {
    return { ok: false, reason: "invalid_sequence", message: SEQUENCE_ERROR_MESSAGE[eventType] };
  }

  const record =
    existingRecord ??
    (await getOrInsertAttendanceRecord(supabase, employeeId, workDate));

  const ip = await getClientIp();

  const { error: insertError } = await supabase.from("attendance_events").insert({
    attendance_record_id: record.id,
    employee_id: employeeId,
    event_type: eventType,
    check_in_method: "manual",
    manual_reason: trimmedReason,
    review_status: "pending_review",
    ip,
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
  });

  if (insertError) throw new Error(`근태 이벤트 기록에 실패했습니다: ${insertError.message}`);

  return { ok: true };
}

async function getOrInsertAttendanceRecord(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  employeeId: string,
  workDate: string,
): Promise<{ id: string; status: "present" | "remote" | "absent" | "on_leave" }> {
  const { data: inserted, error } = await supabase
    .from("attendance_records")
    .insert({ employee_id: employeeId, work_date: workDate, status: "present" })
    .select("id, status")
    .single();

  if (!error) return inserted;

  // 두 탭에서 거의 동시에 첫 이벤트를 기록하려는 경쟁 상태 — unique(employee_id, work_date)
  // 위반이면 그사이 다른 요청이 이미 만든 행을 다시 조회해서 쓴다.
  if (error.code === "23505") {
    const { data: retried, error: retryError } = await supabase
      .from("attendance_records")
      .select("id, status")
      .eq("employee_id", employeeId)
      .eq("work_date", workDate)
      .single();
    if (retryError) throw new Error(`근태 레코드를 생성하지 못했습니다: ${retryError.message}`);
    return retried;
  }

  throw new Error(`근태 레코드를 생성하지 못했습니다: ${error.message}`);
}
