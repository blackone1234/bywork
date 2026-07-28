"use client";

import { useEffect } from "react";
import { Button } from "@/components/admin/Button";

/**
 * 전역(관리자 쪽 + /login, /reset-password 등 /m 밖 전체) 에러 바운더리 — 이 프로젝트
 * Next.js 버전은 콜백 prop 이름이 표준 문서의 `reset`이 아니라 `unstable_retry`다
 * (node_modules/next/dist/docs/.../03-file-conventions/error.md 확인, AGENTS.md
 * 지시대로 구현 전 문서부터 확인). dashboard/error.tsx가 이미 있는 /dashboard는
 * 그쪽이 더 가까운 경계라 우선 적용되고, 이 파일은 나머지 모든 admin 라우트
 * (직원관리/근태데이터/휴가승인/근무설정/시스템)의 공통 fallback이다. /m/*은
 * src/app/m/error.tsx가 더 가까운 경계라 그쪽이 대신 처리한다.
 */
export default function GlobalErrorBoundary({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-[16px] bg-page px-4 py-6">
      <p className="text-heading font-bold text-black">문제가 발생했습니다</p>
      <p className="text-body font-semibold text-muted">{error.message}</p>
      <Button type="button" variant="primary" onClick={() => unstable_retry()}>
        다시 시도
      </Button>
    </div>
  );
}
