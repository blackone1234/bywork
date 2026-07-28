import type { Metadata, Viewport } from "next";
import { TouchActionLock } from "@/components/mobile/TouchActionLock";

// 루트 layout(src/app/layout.tsx)의 title("byWORK 관리자")이 /m 전체에도 그대로
// 상속되고 있었다 — 사용자 앱 브라우저 탭 제목이 "byWORK 관리자"로 뜨던 버그.
// /m 세그먼트에서 title만 재정의(다른 필드는 루트에서 그대로 상속).
export const metadata: Metadata = {
  title: "byWORK",
};

// 관리자(데스크톱)와 달리 사용자 앱은 네이티브 앱처럼 핀치줌을 막는다 —
// maximumScale/userScalable이 /m 하위에서만 루트 viewport를 덮어쓴다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 이 layout은 실제 DOM(래퍼 엘리먼트)을 추가하지 않는다 — /m 밑에는 공용 chrome(하단
// 네비 등)이 없고 각 page.tsx가 각자 전체 화면을 직접 그리는 기존 구조를 그대로
// 유지한다. TouchActionLock은 null을 렌더링하고 body에 클래스만 토글하므로 이
// 원칙을 깨지 않는다.
export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TouchActionLock />
      {children}
    </>
  );
}
