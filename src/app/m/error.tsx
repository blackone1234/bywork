"use client";

import { useEffect } from "react";
import { MobileErrorState, MobileErrorSymbol, MobileErrorMessageIcon } from "@/components/mobile/ErrorState";

/**
 * E07 마크업 그대로 재사용(src/app/screens/errors/e07/page.tsx와 동일 — 원본은
 * 리뷰용으로 남겨둠, E06과 달리 "이동" 지시가 없었음). Figma 원본이 버튼 1개
 * ("홈으로 이동")뿐이라 unstable_retry(재시도)는 받기만 하고 버튼으로는 안 씀 —
 * 임의로 버튼을 추가하면 이 프로젝트의 pixel-accurate 원칙과 어긋난다.
 */
export default function MobileErrorBoundary({
  error,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <MobileErrorState
      theme="light"
      symbolIcon={<MobileErrorSymbol color="light-gray" />}
      messageIcon={<MobileErrorMessageIcon color="light-gray" />}
      title={["일시적인 오류가", "발생했어요"]}
      description={["잠시 후 다시 시도해주세요.", "문제가 계속되면 문의해주세요."]}
      primaryAction={{ label: "홈으로 이동", href: "/m", variant: "outline-dark" }}
    />
  );
}
