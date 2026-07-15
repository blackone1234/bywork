"use server";

import { redirect } from "next/navigation";
import { createSupabaseSessionClient } from "@/lib/supabase/session";

export type RegisterPasswordState = { error?: string };

/**
 * 관리자 reset-password/actions.ts의 updatePassword와 동일한 패턴 — 초대 이메일의
 * token_hash를 /auth/confirm이 이미 verifyOtp로 검증해서 세션을 심어놓은 뒤 도달하는
 * 화면이므로, 여기서는 그 세션으로 비밀번호만 설정하면 된다.
 */
export async function registerPassword(
  _prevState: RegisterPasswordState,
  formData: FormData,
): Promise<RegisterPasswordState> {
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    return { error: "비밀번호는 최소 8자 이상 입력해주세요." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "비밀번호가 서로 일치하지 않습니다." };
  }

  const supabase = await createSupabaseSessionClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: `비밀번호 등록에 실패했습니다: ${error.message}` };
  }

  redirect("/m");
}
