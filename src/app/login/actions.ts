"use server";

import { redirect } from "next/navigation";
import { createSupabaseSessionClient } from "@/lib/supabase/session";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getRequestOrigin } from "@/lib/origin";

export type LoginState = { error?: string };

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  const supabase = await createSupabaseSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  // admin_profiles에 없는 계정(예: 나중에 생길 직원 앱 계정)은 이 관리자 웹에 들어올 수 없다.
  // RLS를 우회해야 하므로 service_role 클라이언트로 확인한다.
  const adminClient = createSupabaseAdminClient();
  const { data: adminProfile } = await adminClient
    .from("admin_profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!adminProfile) {
    await supabase.auth.signOut();
    return { error: "관리자 계정이 아닙니다." };
  }

  redirect("/dashboard");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (email) {
    const supabase = await createSupabaseSessionClient();
    const origin = await getRequestOrigin();
    // 이메일이 실제로 등록돼 있는지와 무관하게 화면은 항상 같은 방식으로 진행한다 — 등록
    // 여부를 응답 차이로 노출하지 않기 위해서다 (Supabase 자체도 이렇게 동작한다). 다만
    // 발송 자체가 막혔는지(rate limit 등)는 화면에서는 알 수 없으니 서버 로그에는 남긴다.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/confirm?next=/reset-password`,
    });
    if (error) {
      console.error("resetPasswordForEmail failed:", error.status, error.code, error.message);
    }
  }

  redirect(`/forgot-password?email=${encodeURIComponent(email)}`);
}

export async function logout() {
  const supabase = await createSupabaseSessionClient();
  await supabase.auth.signOut();
  redirect("/login");
}
