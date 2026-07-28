"use client";

import { useEffect } from "react";
import { Button } from "@/components/admin/Button";

/** 이 프로젝트 Next.js 버전은 error.tsx의 재시도 콜백 prop 이름이 표준 문서의 `reset`이
 * 아니라 `unstable_retry`다(node_modules/next/dist/docs/.../10-error-handling.md
 * 확인, AGENTS.md 지시대로 구현 전 문서부터 확인). */
export default function DashboardError({
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
    <div className="flex flex-1 flex-col items-center justify-center gap-[16px] px-4 py-6 sm:px-8 lg:px-[60px]">
      <p className="text-heading font-bold text-black">대시보드를 불러오지 못했습니다</p>
      <p className="text-body font-semibold text-muted">{error.message}</p>
      <Button type="button" variant="primary" onClick={() => unstable_retry()}>
        다시 시도
      </Button>
    </div>
  );
}
