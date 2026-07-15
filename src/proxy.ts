import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseProxyClient } from "@/lib/supabase/proxyClient";

// 실제 관리자 로그인 세션(Supabase Auth)이 붙었으니, 이전의 임시 Basic Auth 게이트를 이걸로
// 교체한다. admin_profiles/employees 소속 여부까지는 여기서 매 요청마다 확인하지 않는다 —
// 로그인된 세션이 있는지만 빠르게 확인하고, "이 사용자가 진짜 관리자/직원인가"는 실제 데이터
// 조회/서버 액션 쪽(admin-guard.ts, m/login/actions.ts)에서 다시 확인한다. Next.js 문서가
// 권고하는 대로 proxy matcher 하나만 믿지 않기 위함이기도 하다.
//
// /m(모바일)은 /m/login, /m/register-password만 세션 없이 접근 가능해야 한다(로그인/최초
// 비밀번호 등록 화면 자체이므로) — 나머지 /m/* 경로는 세션 없으면 /m/login으로 보낸다.
const MOBILE_PUBLIC_PATHS = ["/m/login", "/m/register-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, getResponse } = createSupabaseProxyClient(request);

  // getUser()는 쿠키를 그냥 읽는 게 아니라 Supabase Auth 서버에 다시 검증(필요하면 토큰도
  // 갱신)한다. getSession()은 위조되거나 만료된 쿠키를 걸러내지 못하므로 여기선 쓰면 안 된다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isMobilePath = pathname.startsWith("/m");

  if (!user) {
    if (isMobilePath) {
      if (MOBILE_PUBLIC_PATHS.includes(pathname)) {
        return getResponse();
      }
      return NextResponse.redirect(new URL("/m/login", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return getResponse();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/employees/:path*",
    "/attendance/:path*",
    "/leave-requests/:path*",
    "/settings/:path*",
    "/m/:path*",
  ],
};
