import type { Viewport } from "next";
import { Sidebar } from "@/components/admin/Sidebar";
import { MobileGnb } from "@/components/admin/MobileGnb";
import { ToastProvider } from "@/components/admin/ToastProvider";
import { TouchActionLock } from "@/components/mobile/TouchActionLock";

// CD가 실제로 관리자 화면을 모바일 브라우저 폭에서 쓰고 있는 것이 이번 배치 스크린샷들로
// 확인됨(MobileGnb가 그 근거) — 어제 "관리자는 데스크톱 전용이라 확대 허용" 판단을 뒤집고,
// /m과 동일하게 네이티브 앱처럼 핀치줌을 막는다. DataTable(A02/A06/A07/A08 등 표 화면
// 전체가 공유)은 이미 overflow-x-auto로 가로 스크롤을 지원하고, touch-action: pan-x pan-y는
// 핀치줌만 막고 드래그 스크롤은 그대로 허용하므로 표를 확대해서 봐야 하는 화면은 없다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 전역 토스트 스택 — A01~A12 전체가 이 하나의 Provider/스택을 공유한다(화면별
    // 컴포넌트는 useToast()만 호출, 자기 위치에 토스트를 직접 렌더링하지 않는다).
    <ToastProvider>
      <TouchActionLock />
      <div className="flex min-h-screen w-full flex-col bg-white lg:flex-row lg:items-stretch">
        <MobileGnb />

        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="flex min-h-screen flex-1 flex-col bg-page">
          {children}
        </div>
      </div>
    </ToastProvider>
  );
}
