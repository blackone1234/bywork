import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

// 임시 방어선 — 실제 관리자 로그인/세션이 붙기 전까지 관리자 화면 전체를 잠근다.
// Server Function(서버 액션)은 같은 경로로의 POST로 처리되기 때문에 이 matcher에
// 걸리는 페이지에서 호출되는 액션도 함께 막힌다. (src/lib/admin-guard.ts에서
// 액션 쪽에도 동일한 검사를 한 번 더 하니 참고.)
//
// ADMIN_ACTION_SECRET이 비어 있으면 "통과"가 아니라 "차단"한다 — 배포 시 값 설정을
// 깜빡해서 API가 그대로 열려버리는 상황을 피하기 위함이다.

const ADMIN_USERNAME = "admin";

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="byWORK Admin"' },
  });
}

export function proxy(request: NextRequest) {
  const secret = process.env.ADMIN_ACTION_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || !authHeader?.startsWith("Basic ")) {
    return unauthorized();
  }

  const decoded = Buffer.from(authHeader.slice("Basic ".length), "base64").toString("utf-8");
  const separatorIndex = decoded.indexOf(":");
  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  if (username !== ADMIN_USERNAME || !safeEqual(password, secret)) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/employees/:path*",
    "/attendance/:path*",
    "/leave-requests/:path*",
    "/settings/:path*",
  ],
};
