import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NavigationProgressBar } from "@/components/shared/NavigationProgressBar";

export const metadata: Metadata = {
  title: "byWORK 관리자",
  description: "byWORK 관리자 웹",
};

// 루트 기본값은 일반 확대/축소를 허용한다 — /login, /reset-password, /forgot-password처럼
// (admin) 그룹 밖에 있는 인증 화면들이 이 기본값을 그대로 상속한다. /m(src/app/m/layout.tsx)과
// (admin)((admin)/layout.tsx, 2026-07-23부터 관리자도 실제로 모바일 브라우저에서 쓰이는 것이
// 확인돼 확대를 막는 쪽으로 판단이 뒤집힘)은 각자 더 구체적인 세그먼트 값으로 이 viewport를
// 덮어쓴다(Next.js 메타데이터 병합 규칙).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* 관리자/사용자 전체 공유 — 루트에 한 번만 마운트. */}
        <NavigationProgressBar />
        {children}
      </body>
    </html>
  );
}
