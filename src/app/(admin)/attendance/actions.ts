"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertAdminRequest } from "@/lib/admin-guard";

/**
 * A08 "확인완료" — recordId(그 날짜의 attendance_records 행)에 속한 검토대기중 이벤트를
 * 전부 한 번에 확정 처리한다(개별 이벤트 단위가 아니라 "이 날짜를 확인했다"는 단위 —
 * Figma도 날짜 행 하나에 확인완료 버튼 하나만 둔다). 처리 순서는 강제하지 않는다 —
 * 관리자가 목록에서 아무 날짜나 먼저 확인해도 된다.
 *
 * Toast 확산(2단계)을 위해 plain FormData 액션에서 useActionState 시그니처로 바꿨다.
 * recordId/employeeId는 더 이상 bind()로 고정하지 않고 hidden input(FormData)으로 받는다
 * — useActionState 훅은 테이블 전체를 감싸는 클라이언트 컴포넌트 하나에서 한 번만 호출되고
 * (AttendanceDetailTable.tsx), 각 행의 form이 이 단일 dispatcher를 공유해야 하기 때문이다.
 * (처음엔 행마다 bind()로 recordId를 고정해 행별로 useActionState를 따로 뒀었는데, 확인
 * 처리 성공 시 그 행이 "검토필요"→"정상"으로 바뀌면서 버튼을 렌더링하던 컴포넌트 자체가
 * 트리에서 제거돼(unmount) 토스트도 같이 사라지는 버그가 라이브 테스트에서 실제로 발견됨.)
 */
export type ConfirmReviewState = { error?: string; success?: boolean };

export async function confirmAttendanceReview(
  _prevState: ConfirmReviewState,
  formData: FormData,
): Promise<ConfirmReviewState> {
  const admin = await assertAdminRequest();

  const recordId = String(formData.get("recordId") ?? "");
  const employeeId = String(formData.get("employeeId") ?? "");
  if (!recordId || !employeeId) {
    return { error: "잘못된 요청입니다." };
  }

  const supabase = createSupabaseAdminClient();

  const { data: pendingEvents, error: pendingError } = await supabase
    .from("attendance_events")
    .select("id, event_type")
    .eq("attendance_record_id", recordId)
    .eq("review_status", "pending_review");

  if (pendingError) return { error: `검토대기 이벤트를 불러오지 못했습니다: ${pendingError.message}` };
  if (!pendingEvents || pendingEvents.length === 0) {
    return { error: "확인할 검토대기 이벤트가 없습니다." };
  }

  const { error: updateError } = await supabase
    .from("attendance_events")
    .update({ review_status: "confirmed", reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .in(
      "id",
      pendingEvents.map((event) => event.id),
    );

  if (updateError) return { error: `검토 확정 처리에 실패했습니다: ${updateError.message}` };

  // 확정된 이벤트 중 외출/외근 시작이 있으면 recordAttendanceEvent(src/lib/attendanceEvents.ts)의
  // 라이브 체크인 경로와 동일한 규칙으로 status를 remote로 갱신한다(이미 present인 경우만).
  const hasGoOut = pendingEvents.some((event) => event.event_type === "go_out_personal" || event.event_type === "go_out_business");
  if (hasGoOut) {
    const { data: record, error: recordError } = await supabase
      .from("attendance_records")
      .select("status")
      .eq("id", recordId)
      .single();
    if (recordError) return { error: `근태 레코드를 조회하지 못했습니다: ${recordError.message}` };

    if (record.status === "present") {
      const { error: statusError } = await supabase
        .from("attendance_records")
        .update({ status: "remote" })
        .eq("id", recordId);
      if (statusError) return { error: `근태 상태 갱신에 실패했습니다: ${statusError.message}` };
    }
  }

  revalidatePath("/attendance");
  revalidatePath(`/attendance/${employeeId}`);
  return { success: true };
}

/**
 * 관리자 근태 강제 수정 — 기존 레코드 수정과 "기록 없는 날" 신규 생성을 한 액션에서
 * 처리한다(edit_attendance_record RPC가 upsert). 검토대기(pending_review) 이벤트가
 * 있는 날짜는 RPC가 'pending_review_exists' 예외를 던져서 막는다 — 자동 확정 처리하지
 * 않고, 먼저 확인완료 처리하도록 안내 메시지로 유도한다.
 */
export type EditAttendanceRecordState = { error?: string; success?: boolean };

const ATTENDANCE_STATUS_OPTIONS = ["present", "remote", "absent", "on_leave"] as const;

/** <input type="time">는 값이 있으면 항상 HH:MM 형식이지만, 폼 직접 조작 등 클라이언트를
 * 거치지 않는 요청 경로까지 막는 서버측 최종 검증. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function editAttendanceRecord(
  _prevState: EditAttendanceRecordState,
  formData: FormData,
): Promise<EditAttendanceRecordState> {
  const admin = await assertAdminRequest();

  const employeeId = String(formData.get("employeeId") ?? "");
  const workDate = String(formData.get("workDate") ?? "");
  const checkInTime = String(formData.get("checkInTime") ?? "").trim();
  const checkOutTime = String(formData.get("checkOutTime") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!employeeId || !workDate) return { error: "잘못된 요청입니다." };
  if (!ATTENDANCE_STATUS_OPTIONS.includes(status as (typeof ATTENDANCE_STATUS_OPTIONS)[number])) {
    return { error: "상태를 선택해주세요." };
  }
  if (checkInTime && !TIME_PATTERN.test(checkInTime)) {
    return { error: "출근시간 형식이 올바르지 않습니다 (예: 09:00)." };
  }
  if (checkOutTime && !TIME_PATTERN.test(checkOutTime)) {
    return { error: "퇴근시간 형식이 올바르지 않습니다 (예: 18:00)." };
  }
  if (!reason) return { error: "수정 사유를 입력해주세요." };

  // "HH:MM" + workDate -> KST 타임스탬프. +09:00을 명시해서 서버/브라우저 타임존과
  // 무관하게 항상 KST 그 시각으로 저장되게 한다(todayWorkDateKST류와 동일한 이유).
  const checkInAt = checkInTime ? `${workDate}T${checkInTime}:00+09:00` : null;
  const checkOutAt = checkOutTime ? `${workDate}T${checkOutTime}:00+09:00` : null;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("edit_attendance_record", {
    p_employee_id: employeeId,
    p_work_date: workDate,
    p_check_in_at: checkInAt,
    p_check_out_at: checkOutAt,
    p_status: status,
    p_note: note || null,
    p_reason: reason,
    p_admin_id: admin.id,
  });

  if (error) {
    if (error.message.includes("pending_review_exists")) {
      return { error: "검토 대기중인 이벤트가 있습니다. 먼저 확인완료 처리 후 수정해주세요." };
    }
    return { error: `근태 기록 저장에 실패했습니다: ${error.message}` };
  }

  revalidatePath("/attendance");
  revalidatePath(`/attendance/${employeeId}`);
  return { success: true };
}
