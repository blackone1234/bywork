import "server-only";
import { headers } from "next/headers";
import { timingSafeEqual } from "node:crypto";

const ADMIN_USERNAME = "admin";

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * 임시 방어선 — 실제 관리자 로그인/세션이 붙기 전까지 서버 액션을 잠그는 용도.
 * src/proxy.ts가 같은 Basic Auth 헤더를 이미 검사해서 이 화면들의 페이지 요청과 그
 * 서버 액션(같은 경로로의 POST)을 걸러내지만, Next.js가 권고하는 대로 액션 자체에서도
 * 다시 검사한다 — 나중에 matcher 범위가 바뀌거나 액션이 다른 경로로 옮겨져도
 * 이 체크는 그대로 남는다. 진짜 로그인 세션이 붙으면 이 파일 전체를 교체해야 한다.
 */
export async function assertAdminRequest() {
  const secret = process.env.ADMIN_ACTION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_ACTION_SECRET이 설정되지 않아 관리자 요청을 확인할 수 없습니다.");
  }

  const requestHeaders = await headers();
  const authHeader = requestHeaders.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    throw new Error("인증되지 않은 요청입니다.");
  }

  const decoded = Buffer.from(authHeader.slice("Basic ".length), "base64").toString("utf-8");
  const separatorIndex = decoded.indexOf(":");
  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  if (username !== ADMIN_USERNAME || !safeEqual(password, secret)) {
    throw new Error("인증되지 않은 요청입니다.");
  }
}
