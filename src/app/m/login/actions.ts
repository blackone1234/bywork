"use server";

import { redirect } from "next/navigation";
import { createSupabaseSessionClient } from "@/lib/supabase/session";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type MobileLoginState = { error?: string };

/**
 * 관리자 로그인(src/app/login/actions.ts)과 같은 패턴: signInWithPassword 후 employees
 * 소속 여부를 service_role로 재확인한다(RLS를 우회해야 하므로). 신규 초대된 직원은 아직
 * 비밀번호가 없어서 signInWithPassword 자체가 항상 실패하므로 — 초대 링크를 통해서만
 * /m/register-password로 최초 비밀번호를 설정할 수 있다. 여기서 "최초 로그인 판별" 로직이
 * 따로 필요 없는 이유이기도 하다.
 */
export async function login(_prevState: MobileLoginState, formData: FormData): Promise<MobileLoginState> {
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

  // admin_profiles에 auth_user_id가 아니라 id로 매칭하는 admin 패턴과 다르게, employees는
  // auth_user_id 컬럼으로 auth.users와 연결된다(employees.id는 별도의 인사 레코드 PK).
  const adminClient = createSupabaseAdminClient();
  const { data: employee } = await adminClient
    .from("employees")
    .select("id, employment_status")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (!employee) {
    await supabase.auth.signOut();
    return { error: "직원 계정이 아닙니다." };
  }

  if (employee.employment_status === "terminated") {
    await supabase.auth.signOut();
    return { error: "퇴사 처리된 계정입니다. 관리자에게 문의하세요." };
  }

  redirect("/m");
}

export async function logout() {
  const supabase = await createSupabaseSessionClient();
  await supabase.auth.signOut();
  redirect("/m/login");
}
