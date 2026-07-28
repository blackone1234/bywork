"use server";

import { getCurrentEmployee } from "@/lib/employeeAccount";
import { submitLeaveRequest } from "@/lib/employeeLeaveRequests";
import type { LeaveType } from "@/lib/leaveTypes";

export type LeaveSubmitState = { error?: string; success?: boolean };

export async function submitLeaveRequestAction(
  _prevState: LeaveSubmitState,
  formData: FormData,
): Promise<LeaveSubmitState> {
  const employee = await getCurrentEmployee();
  if (!employee) {
    return { error: "로그인 정보를 확인할 수 없습니다." };
  }

  const leaveType = String(formData.get("leaveType") ?? "") as LeaveType;
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDateRaw = String(formData.get("endDate") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!leaveType || !startDate) {
    return { error: "휴가 종류와 날짜를 선택해주세요." };
  }

  const result = await submitLeaveRequest({
    employeeId: employee.id,
    leaveType,
    startDate,
    endDate: endDateRaw || startDate,
    reason: reason || null,
  });

  if (!result.ok) {
    return { error: result.message };
  }

  // redirect()는 서버에서 즉시 던져지므로 클라이언트가 성공 여부를 알 방법이
  // 없다(useActionState의 state가 절대 갱신 안 됨) — 신청완료 알럿을 보여주려면
  // 성공 상태를 클라이언트로 돌려주고, 이동은 클라이언트 쪽에서 알럿 확인 후
  // router.push로 처리해야 한다(LeaveNewForm.tsx 참고).
  return { success: true };
}
