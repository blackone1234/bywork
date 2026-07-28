import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertAdminRequest } from "@/lib/admin-guard";
import { formatDateDot } from "@/lib/employees";
import { todayWorkDateKST } from "@/lib/attendanceEvents";

export type AttendanceStatusDb = "present" | "remote" | "absent" | "on_leave";

/**
 * "비고" 기본 문구 — status='present'는 퇴근시간(check_out_at) 유무로 "근무중"/"퇴근"을
 * 가른다. 예전엔 present면 무조건 "정상"이었는데(NOTE_FALLBACK 고정 매핑), 관리자
 * 강제수정 모달에서 "출근만 입력 vs 출근+퇴근 둘 다 입력"이 화면에 똑같이 보이는
 * 문제가 CD 지적으로 드러났다 — 실은 이 문제가 관리자 수정 기록뿐 아니라 기존
 * 실제 근태 기록(아직 퇴근 안 한, 지금 근무중인 직원의 오늘자 행)에도 원래 있던
 * 문제였다. A01 대시보드/모바일 홈이 이미 "마지막 확정 이벤트로 라이브 상태를
 * 가른다"는 동일한 원칙을 쓰고 있어서 그와 일관되게 맞춘다.
 */
function defaultNote(status: AttendanceStatusDb, hasCheckOut: boolean): string {
  switch (status) {
    case "present":
      return hasCheckOut ? "퇴근" : "근무중";
    case "remote":
      return "외출/외근";
    case "on_leave":
      return "승인된 연차";
    case "absent":
      return "-";
  }
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${pad2(month)}-01`;
}

/** month is 1-indexed, matching how the UI/URL params use it. */
function lastDayOfMonth(year: number, month: number): string {
  const nextMonthFirst =
    month === 12 ? `${year + 1}-01-01` : `${year}-${pad2(month + 1)}-01`;
  const d = new Date(`${nextMonthFirst}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Monday (as "YYYY-MM-DD") of the ISO week containing the given date. */
function getWeekStart(workDate: string): string {
  const d = new Date(`${workDate}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d.toISOString().slice(0, 10);
}

/** Sunday (as "YYYY-MM-DD") of the ISO week containing the given date. */
function getWeekEnd(workDate: string): string {
  const d = new Date(`${getWeekStart(workDate)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
}

function formatTimeKST(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function hoursBetween(checkInAt: string | null, checkOutAt: string | null): number {
  if (!checkInAt || !checkOutAt) return 0;
  return (new Date(checkOutAt).getTime() - new Date(checkInAt).getTime()) / 3_600_000;
}

export type MonthlyAttendanceRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  weeklyHours: string;
  /** A07 "상태" 컬럼 — 이 날짜/직원 레코드에 검토대기중 이벤트가 하나라도 있는지. */
  hasPendingReview: boolean;
};

type MonthlyQueryRow = {
  id: string;
  employee_id: string;
  work_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  employees: { name: string } | null;
};

/**
 * attendance_records_with_times VIEW는 review_status='confirmed'만 보므로, 검토대기중
 * 여부는 attendance_events를 직접 조회해서 알아내야 한다. A07/A08 둘 다 쓰는 공용 헬퍼.
 */
async function getPendingReviewRecordIds(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  recordIds: string[],
): Promise<Set<string>> {
  if (recordIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from("attendance_events")
    .select("attendance_record_id")
    .in("attendance_record_id", recordIds)
    .eq("review_status", "pending_review");
  if (error) throw new Error(`검토대기 상태를 불러오지 못했습니다: ${error.message}`);
  return new Set((data ?? []).map((row) => row.attendance_record_id as string));
}

/** A07 — 근태 데이터: 전체 직원의 선택된 월 기록. */
export async function listMonthlyAttendance(
  year: number,
  month: number,
): Promise<MonthlyAttendanceRow[]> {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const monthStart = firstDayOfMonth(year, month);
  const monthEnd = lastDayOfMonth(year, month);

  // 주52시간 초과 여부를 보여주는 지표라 근사치로 두면 안 된다. 월~일 기준으로 정확히
  // 합산하려면 그 달에 걸친 주의 인접 달 날짜까지 같이 가져와야 한다 — 예를 들어 1일이
  // 수요일이면 그 주의 월/화는 전달 날짜이므로, 전달 데이터를 안 가져오면 그 주가
  // 실제보다 적게 계산된다.
  const weekRangeStart = getWeekStart(monthStart);
  const weekRangeEnd = getWeekEnd(monthEnd);

  const { data, error } = await supabase
    .from("attendance_records_with_times")
    .select("id, employee_id, work_date, check_in_at, check_out_at, employees(name)")
    .gte("work_date", weekRangeStart)
    .lte("work_date", weekRangeEnd)
    .order("work_date", { ascending: false })
    .returns<MonthlyQueryRow[]>();

  if (error) throw new Error(`근태 데이터를 불러오지 못했습니다: ${error.message}`);

  const allRecords = data ?? [];

  // 주간 합계는 인접 달 날짜까지 포함한 전체 레코드로 계산해서 경계 주도 정확하게 만든다.
  const weeklyHoursByKey = new Map<string, number>();
  for (const row of allRecords) {
    const hours = hoursBetween(row.check_in_at, row.check_out_at);
    if (hours <= 0) continue;
    const key = `${row.employee_id}_${getWeekStart(row.work_date)}`;
    weeklyHoursByKey.set(key, (weeklyHoursByKey.get(key) ?? 0) + hours);
  }

  // 화면에 표시하는 행 자체는 선택된 달 안의 날짜로만 제한한다 — 인접 달 날짜는 주간
  // 합계 계산에만 쓰이고 목록에는 노출하지 않는다.
  const monthRecords = allRecords.filter(
    (row) => row.work_date >= monthStart && row.work_date <= monthEnd,
  );

  const pendingRecordIds = await getPendingReviewRecordIds(
    supabase,
    monthRecords.map((row) => row.id),
  );

  return monthRecords.map((row) => {
    const key = `${row.employee_id}_${getWeekStart(row.work_date)}`;
    return {
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employees?.name ?? "-",
      date: formatDateDot(row.work_date),
      checkIn: formatTimeKST(row.check_in_at),
      checkOut: formatTimeKST(row.check_out_at),
      weeklyHours: `${Math.round(weeklyHoursByKey.get(key) ?? 0)}h`,
      hasPendingReview: pendingRecordIds.has(row.id),
    };
  });
}

export type AttendanceDetailRow = {
  /** 기록 자체가 없는 날(관리자 근태 강제수정 — "기록 추가")은 null. */
  id: string | null;
  /** "YYYY-MM-DD" — 수정/추가 액션이 어느 날짜를 대상으로 하는지 식별하는 데 쓴다
   * (date는 "YYYY.MM.DD" 표시용이라 그대로 못 씀). */
  workDate: string;
  date: string;
  checkIn: string;
  checkOut: string;
  note: string;
  /** 관리자 근태 강제수정 폼의 "상태" select 기본값 — 기록이 없는 날은 "absent". */
  status: AttendanceStatusDb;
  /** "비고" 컬럼의 "검토필요" + "확인완료" 버튼 표시 여부. */
  hasPendingReview: boolean;
  /** 검토대기중 이벤트의 사유 — 호버 툴팁용. 같은 날짜에 여러 건이면 줄바꿈으로 이어붙인다. */
  pendingReason: string | null;
};

/**
 * A08 "확인완료" 버튼이 attendance_records.id로 그 날짜의 검토대기 이벤트 전부를 한 번에
 * 확정 처리하므로, pending 이벤트를 개별이 아니라 record_id 단위로 모아서 반환한다.
 */
async function getPendingReviewInfoByRecord(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  recordIds: string[],
): Promise<Map<string, string[]>> {
  if (recordIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("attendance_events")
    .select("attendance_record_id, manual_reason")
    .in("attendance_record_id", recordIds)
    .eq("review_status", "pending_review")
    .order("occurred_at", { ascending: true });
  if (error) throw new Error(`검토대기 사유를 불러오지 못했습니다: ${error.message}`);

  const map = new Map<string, string[]>();
  for (const row of data ?? []) {
    const recordId = row.attendance_record_id as string;
    const list = map.get(recordId) ?? [];
    if (row.manual_reason) list.push(row.manual_reason as string);
    map.set(recordId, list);
  }
  return map;
}

export type AttendanceStats = {
  totalWorkDays: string;
  totalWorkHours: string;
  usedLeaveDays: string;
  absentDays: string;
};

type DetailQueryRow = {
  id: string;
  work_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: AttendanceStatusDb;
  note: string | null;
};

/** A08 — 근태상세: 화면에 선택된 그 직원 1명의 선택된 월 기록 + 통계 카드 4개. */
export async function getEmployeeAttendanceDetail(
  employeeId: string,
  year: number,
  month: number,
): Promise<{ rows: AttendanceDetailRow[]; stats: AttendanceStats }> {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("attendance_records_with_times")
    .select("id, work_date, check_in_at, check_out_at, status, note")
    .eq("employee_id", employeeId)
    .gte("work_date", firstDayOfMonth(year, month))
    .lte("work_date", lastDayOfMonth(year, month))
    .order("work_date", { ascending: false })
    .returns<DetailQueryRow[]>();

  if (error) throw new Error(`근태 상세를 불러오지 못했습니다: ${error.message}`);

  const records = data ?? [];

  const totalWorkDays = records.filter((row) => row.check_in_at).length;
  const totalWorkHours = records.reduce(
    (sum, row) => sum + hoursBetween(row.check_in_at, row.check_out_at),
    0,
  );
  const usedLeaveDays = records.filter((row) => row.status === "on_leave").length;
  const absentDays = records.filter((row) => row.status === "absent").length;

  const pendingInfoByRecord = await getPendingReviewInfoByRecord(
    supabase,
    records.map((row) => row.id),
  );

  const recordsByDate = new Map(records.map((row) => [row.work_date, row]));

  return {
    // 관리자 근태 강제수정 — 기록이 아예 없는 날짜에도 "기록 추가"를 노출하려면 실제
    // attendance_records가 있는 날짜만이 아니라 그 달의 날짜 전부(단, 미래는 아직
    // 일어나지 않은 근무라 대상에서 뺀다 — 오늘까지만)를 순회해야 한다.
    rows: relevantDatesInMonth(year, month).map((workDate) => {
      const row = recordsByDate.get(workDate);
      if (!row) {
        return {
          id: null,
          workDate,
          date: formatDateDot(workDate),
          checkIn: "-",
          checkOut: "-",
          note: "기록 없음",
          status: "absent" as AttendanceStatusDb,
          hasPendingReview: false,
          pendingReason: null,
        };
      }
      const pendingReasons = pendingInfoByRecord.get(row.id) ?? [];
      return {
        id: row.id,
        workDate,
        date: formatDateDot(row.work_date),
        checkIn: formatTimeKST(row.check_in_at),
        checkOut: formatTimeKST(row.check_out_at),
        note: row.note?.trim() || defaultNote(row.status, Boolean(row.check_out_at)),
        status: row.status,
        hasPendingReview: pendingReasons.length > 0,
        pendingReason: pendingReasons.length > 0 ? pendingReasons.join("\n") : null,
      };
    }),
    stats: {
      totalWorkDays: `${totalWorkDays}일`,
      totalWorkHours: `${Math.round(totalWorkHours)}h`,
      usedLeaveDays: `${usedLeaveDays}일`,
      absentDays: `${absentDays}일`,
    },
  };
}

/** year/month의 1일부터, 오늘(KST)이 그 달에 속하면 오늘까지만, 아니면 말일까지 —
 * 내림차순(최신순, 기존 목록 정렬과 동일)으로 "YYYY-MM-DD" 배열을 만든다. 아직 오지
 * 않은 미래 날짜는 강제수정 대상에서 제외한다(그 날 근무 자체가 아직 없으므로). */
function relevantDatesInMonth(year: number, month: number): string[] {
  const monthStart = firstDayOfMonth(year, month);
  const monthEnd = lastDayOfMonth(year, month);
  const today = todayWorkDateKST();

  if (monthStart > today) return [];

  const end = monthEnd < today ? monthEnd : today;
  const dates: string[] = [];
  const cursor = new Date(`${monthStart}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  while (cursor <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates.reverse();
}
