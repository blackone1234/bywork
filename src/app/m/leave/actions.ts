"use server";

import { revalidatePath } from "next/cache";
import { getCurrentEmployee } from "@/lib/employeeAccount";
import { cancelMyLeaveRequest } from "@/lib/employeeLeaveRequests";

export type CancelLeaveState = { error?: string; success?: boolean };

/** S10/S12 취소 버튼 — cancelMyLeaveRequest(employeeLeaveRequests.ts)가 본인 요청인지
 * 서버에서 재확인하고 cancel_leave_request RPC를 호출한다(관리자와 달리
 * p_bypass_deadline=false — 직원 셀프취소는 컷오프 적용, CD 확정). */
export async function cancelLeaveRequestAction(
  _prevState: CancelLeaveState,
  formData: FormData,
): Promise<CancelLeaveState> {
  const employee = await getCurrentEmployee();
  if (!employee) {
    return { error: "로그인 정보를 확인할 수 없습니다." };
  }

  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) return { error: "잘못된 요청입니다." };

  const result = await cancelMyLeaveRequest(employee.id, requestId, null);
  if (!result.ok) return { error: result.message };

  revalidatePath("/m/leave");
  revalidatePath("/m/leave/history");
  return { success: true };
}
