"use server";

import { redirect } from "next/navigation";
import { createSupabaseSessionClient } from "@/lib/supabase/session";

export type ResetPasswordState = { error?: string };

export async function updatePassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
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
    return { error: `비밀번호 변경에 실패했습니다: ${error.message}` };
  }

  redirect("/dashboard");
}
