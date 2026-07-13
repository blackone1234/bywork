import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertAdminRequest } from "@/lib/admin-guard";

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
};

// 지금은 관리자 로그인 세션이 없어서(임시 Basic Auth 게이트뿐) "현재 로그인한 관리자"를
// 특정할 수 없고, 이 앱에는 다중 관리자 관리 UI도 아직 없다. admin_profiles의 가장 먼저
// 만들어진 행을 유일한 관리자로 취급한다 — 실제 로그인이 붙으면 세션의 사용자로 교체해야 한다.
export async function getAdminAccount(): Promise<AdminAccount | null> {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("id, name, email")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`관리자 계정 정보를 불러오지 못했습니다: ${error.message}`);
  return data;
}

export async function changeAdminPassword(adminId: string, newPassword: string) {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(adminId, {
    password: newPassword,
  });

  if (error) throw new Error(`비밀번호 변경에 실패했습니다: ${error.message}`);
}
