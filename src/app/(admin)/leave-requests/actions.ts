"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertAdminRequest } from "@/lib/admin-guard";

/** Toast 확산(A06)을 위해 plain (requestId) 액션에서 useActionState 시그니처로 바꿨다 —
 * A08(AttendanceReviewTable)과 동일한 이유: 이 훅은 테이블 전체를 감싸는 컴포넌트
 * 하나에서만 호출되고(행마다 두지 않음), 각 행의 form은 hidden input(requestId)으로
 * 대상만 넘긴다 — 승인/반려 처리된 행은 "대기중" 버튼 2개에서 "승인완료"/"반려완료"
 * 텍스트로 바뀌면서 그 행 마크업 자체가 교체되므로, useActionState를 행 단위에 두면
 * 처리 성공과 동시에 컴포넌트가 unmount되며 토스트 트리거가 같이 사라지는 버그가
 * 생긴다(A08에서 실제로 겪은 버그, 재발 방지).
 *
 * approve_leave_request/reject_leave_request RPC 자체는 기존에 검증된 로직이라
 * 그대로 두고, 검증/에러 반환 방식만 바꿨다(throw 대신 { error }, 성공 시 { success }).
 */
export type ProcessLeaveRequestState = { error?: string; success?: boolean };

export async function approveLeaveRequest(
  _prevState: ProcessLeaveRequestState,
  formData: FormData,
): Promise<ProcessLeaveRequestState> {
  const admin = await assertAdminRequest();

  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) return { error: "잘못된 요청입니다." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("approve_leave_request", {
    p_request_id: requestId,
    p_processed_by: admin.id,
  });

  if (error) {
    return { error: `휴가 승인에 실패했습니다: ${error.message}` };
  }

  revalidatePath("/leave-requests");
  return { success: true };
}

export async function rejectLeaveRequest(
  _prevState: ProcessLeaveRequestState,
  formData: FormData,
): Promise<ProcessLeaveRequestState> {
  const admin = await assertAdminRequest();

  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) return { error: "잘못된 요청입니다." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("reject_leave_request", {
    p_request_id: requestId,
    p_processed_by: admin.id,
  });

  if (error) {
    return { error: `휴가 반려에 실패했습니다: ${error.message}` };
  }

  revalidatePath("/leave-requests");
  return { success: true };
}

/**
 * A06 "승인" 탭 취소 액션 — 이미 승인된 휴가를 관리자가 대신 철회한다(반려와 다른
 * 개념: 반려는 대기중 요청을 거부, 취소는 이미 확정된 요청을 없던 일로 되돌림).
 * cancel_leave_request RPC가 승인 취소 시 employees.used_leave_days를 자동 복원한다.
 * p_bypass_deadline=true — 관리자 취소는 "연차 시작일 전날까지"라는 컷오프 예외
 * (CD 확정, 2026-07-27: 운영상 사후 정정이 필요할 수 있어 관리자는 언제든 취소 가능).
 * 근태 강제수정과 동일한 이유로 사유 필수(다른 사람의 확정된 기록을 되돌리는 액션).
 */
export async function cancelLeaveRequest(
  _prevState: ProcessLeaveRequestState,
  formData: FormData,
): Promise<ProcessLeaveRequestState> {
  const admin = await assertAdminRequest();

  const requestId = String(formData.get("requestId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!requestId) return { error: "잘못된 요청입니다." };
  if (!reason) return { error: "취소 사유를 입력해주세요." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("cancel_leave_request", {
    p_request_id: requestId,
    p_actor_admin_id: admin.id,
    p_reason: reason,
    p_bypass_deadline: true,
  });

  if (error) {
    if (error.message.includes("already_finalized")) {
      return { error: "이미 처리된 신청입니다." };
    }
    return { error: `휴가 취소에 실패했습니다: ${error.message}` };
  }

  revalidatePath("/leave-requests");
  return { success: true };
}
