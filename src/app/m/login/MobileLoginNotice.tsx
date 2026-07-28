"use client";

import { useSearchParams } from "next/navigation";

/**
 * 관리자용 src/app/login/LoginNotice.tsx와 동일한 이유로 분리 — useSearchParams()는
 * Suspense 경계 안에서만 정적 빌드가 통과한다. /auth/confirm(초대/재설정 링크 검증)이
 * 실패하면 ?error=...를 붙여서 /m/login으로 리다이렉트한다.
 */
export function MobileLoginNotice() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  return (
    <p
      role="alert"
      className="w-full text-center text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-notification)]"
    >
      {error}
    </p>
  );
}
