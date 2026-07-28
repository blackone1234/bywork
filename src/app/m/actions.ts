"use server";

import { revalidatePath } from "next/cache";
import { getCurrentEmployee } from "@/lib/employeeAccount";
import {
  recordAttendanceEvent,
  submitManualAttendanceEvent,
  type AttendanceEventType,
  type RecordAttendanceEventResult,
  type SubmitManualAttendanceEventResult,
} from "@/lib/attendanceEvents";

/** S03~S07 홈 버튼 5개가 공유하는 서버 액션 — 클라이언트에서 geolocation을 먼저 수집한 뒤 호출한다. */
export async function submitAttendanceEvent(
  eventType: AttendanceEventType,
  coords: { lat: number; lng: number } | null,
): Promise<RecordAttendanceEventResult> {
  const employee = await getCurrentEmployee();
  if (!employee) {
    return { ok: false, reason: "manual_approval_required", message: "로그인 정보를 확인할 수 없습니다." };
  }

  const result = await recordAttendanceEvent({
    employeeId: employee.id,
    authMethod: employee.authMethod,
    eventType,
    coords,
  });

  if (result.ok) {
    revalidatePath("/m");
    revalidatePath("/m/attendance");
  }

  return result;
}

/** M1(인증 실패 시 사유 입력 시트) 제출 — recordAttendanceEvent가 manual_approval_required를
 * 반환한 뒤에만 호출되는 경로. */
export async function submitManualAttendance(
  eventType: AttendanceEventType,
  reason: string,
  coords: { lat: number; lng: number } | null,
): Promise<SubmitManualAttendanceEventResult> {
  const employee = await getCurrentEmployee();
  if (!employee) {
    return { ok: false, reason: "invalid_sequence", message: "로그인 정보를 확인할 수 없습니다." };
  }

  const result = await submitManualAttendanceEvent({
    employeeId: employee.id,
    eventType,
    reason,
    coords,
  });

  if (result.ok) {
    revalidatePath("/m");
    revalidatePath("/m/attendance");
  }

  return result;
}
