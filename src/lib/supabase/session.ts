import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 세션(로그인 상태)을 다루는 클라이언트 — service_role이 아니라 anon 키를 쓴다.
 * 이 앱은 로그인/로그아웃/비밀번호 변경까지 전부 서버 액션에서 처리하므로 anon 키가
 * 브라우저 번들에 들어갈 일이 없다 (NEXT_PUBLIC_ 접두어 없이 서버 전용 env로 둔 이유).
 *
 * Server Component에서 호출되면 setAll이 쿠키를 못 쓰는데(read-only), 그건
 * src/proxy.ts가 매 요청마다 세션을 갱신해 응답 쿠키를 써주므로 문제 없다.
 */
export async function createSupabaseSessionClient() {
  const cookieStore = await cookies();

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY가 설정되지 않았습니다.");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component에서 호출된 경우 — proxy.ts가 세션 갱신을 담당하므로 무시해도 된다.
        }
      },
    },
  });
}
