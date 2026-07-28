import "server-only";
import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createSupabaseSessionClient } from "@/lib/supabase/session";

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
};

/**
 * 로그인 세션의 사용자가 admin_profiles에도 있는지 확인해서 반환한다. 없으면 null.
 * admin-guard.ts가 이 함수를 가져다 쓰므로(assertAdminRequest), 이 파일은 admin-guard.ts를
 * 다시 가져오면 안 된다 — 순환 참조가 생긴다.
 *
 * assertAdminRequest()가 관리자 페이지의 거의 모든 lib 함수에서 개별 호출되는 구조라
 * React `cache()`로 감싸지 않으면 요청 하나당 이 함수(Auth getUser 왕복 + admin_profiles
 * 조회, 총 2회 라운드트립)가 lib 함수 호출 개수만큼 중복 실행된다 — waterfall 진단 결과
 * 반영(node_modules/next/dist/docs/.../caching-without-cache-components.md의 "Deduplicating
 * requests" 패턴 그대로).
 */
export const getCurrentAdmin = cache(async (): Promise<AdminAccount | null> => {
  const sessionClient = await createSupabaseSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) return null;

  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("admin_profiles")
    .select("id, name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(`관리자 계정 정보를 불러오지 못했습니다: ${error.message}`);
  return data;
});

/** A12에서 쓰는 이름 — 지금 로그인된 그 관리자 본인의 계정 정보. */
export async function getAdminAccount(): Promise<AdminAccount | null> {
  return getCurrentAdmin();
}

// admin-guard.ts가 이 파일의 getCurrentAdmin을 가져다 쓰기 때문에(순환 참조 방지), 이 함수는
// 다른 lib 함수들처럼 자체적으로 assertAdminRequest()를 다시 부르지 않는다 — 호출하는 서버
// 액션(settings/system/actions.ts의 saveAdminPassword)이 이미 그 검사를 하고, 여기엔 검증된
// adminId만 넘어온다는 전제다.
export async function changeAdminPassword(adminId: string, newPassword: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(adminId, {
    password: newPassword,
  });

  if (error) throw new Error(`비밀번호 변경에 실패했습니다: ${error.message}`);
}
