"use server";

import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/employeeAccount";
import { createSupabaseSessionClient } from "@/lib/supabase/session";

export type ChangePasswordState = { error?: string };

/**
 * 관리자용 changeAdminPassword(adminAccount.ts)는 service_role로 남의 비밀번호를
 * 강제로 바꾸는 관리자 기능이라 현재 비밀번호 검증이 없다 — 이건 본인이 본인 비밀번호를
 * 바꾸는 자기서비스 플로우라 현재 비밀번호를 먼저 검증해야 한다(세션을 탈취당한
 * 상태에서 현재 비밀번호도 모르는 채로 바꿔치기당하는 걸 막는 최소한의 방어).
 * signInWithPassword로 재인증 → 성공해야만 updateUser로 실제 변경.
 */
export async function changeMyPassword(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const employee = await getCurrentEmployee();
  if (!employee) {
    return { error: "로그인 정보를 확인할 수 없습니다." };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "모든 항목을 입력해주세요." };
  }
  if (newPassword.length < 8) {
    return { error: "새 비밀번호는 8자 이상이어야 합니다." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "새 비밀번호가 일치하지 않습니다." };
  }

  const supabase = await createSupabaseSessionClient();

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: employee.email,
    password: currentPassword,
  });
  if (verifyError) {
    return { error: "현재 비밀번호가 올바르지 않습니다." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    return { error: `비밀번호 변경에 실패했습니다: ${updateError.message}` };
  }

  redirect("/m/my");
}
