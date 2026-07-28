import { ViewTransition, type ReactNode } from "react";

/**
 * 하단탭(홈/근태/휴가/통계/마이) 전환 전용 크로스페이드. 5개 탭 루트 페이지가 전부 같은
 * name을 쓰기 때문에 React가 이전 화면→새 화면을 같은 정체성으로 보고 부드럽게 섞는다
 * (Next.js 문서 "Step 4: Crossfade content within the same route" 패턴을 다른 route
 * 간 전환에도 그대로 적용 — share="auto"라 탭마다 콘텐츠 크기가 달라도 모핑 없이
 * 깔끔하게 크로스페이드된다). default="none"으로 둬서 로그인/드릴인 등 다른 네비게이션엔
 * 영향 안 준다 — 지금은 하단탭 전환만 범위.
 */
export function MobileTabTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition name="mobile-tab-content" share="auto" default="none">
      {children}
    </ViewTransition>
  );
}
