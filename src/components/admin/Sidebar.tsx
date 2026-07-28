"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/admin/icons/BrandLogo";
import { MENU_ITEMS } from "@/lib/nav";

export function Sidebar({
  notificationCount,
  onNavigate,
}: {
  notificationCount?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[218px] shrink-0 flex-col gap-[50px] bg-white pt-[50px] pb-[20px]">
      <div className="flex flex-col gap-[50px] px-[30px]">
        <BrandLogo className="h-[14px] w-[74.528px] text-black" />
        <span className="text-[19px] font-bold leading-[1.3] tracking-[-0.38px] text-black">
          Admin
          <br />
          Dashboard
        </span>
      </div>

      <nav className="flex flex-col gap-[6px] px-[10px]">
        {MENU_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              // prefetch=false — 사이드바 6개 링크가 대시보드 진입 시 전부 뷰포트 안에
              // 있어 기본값(자동 prefetch)이면 거의 동시에 여러 protected route로 백그라운드
              // GET이 나간다. 로그인 직후처럼 access token이 막 발급된 시점에 이 요청들이
              // 동시에 세션 갱신을 시도하면, Supabase가 refresh token을 1회용으로 회전시켜서
              // 먼저 도착한 요청만 성공하고 나머지는 "Refresh Token Not Found"로 실패 —
              // 그 요청이 middleware(proxy.ts)의 getUser()였다면 세션이 있는데도 /login으로
              // 튕기는 것처럼 보인다(CD가 보고한 "가끔 비번이 안 먹는" 증상, 프로덕션 로그로
              // 확인함). prefetch를 꺼서 동시 요청 자체를 없애 충돌 확률을 낮춘다.
              prefetch={false}
              className={`flex h-[42px] w-[198px] items-center justify-between gap-[16px] rounded-[30px] px-[20px] py-[10px] text-[14px] font-semibold tracking-[-0.28px] transition-colors ${
                isActive
                  ? "bg-sidebar-active text-white shadow-[2px_4px_2px_rgba(0,0,0,0.2)]"
                  : "bg-white text-black hover:bg-page"
              }`}
            >
              <span>{item.label}</span>
              {isActive && notificationCount ? (
                <span className="flex size-[22px] items-center justify-center rounded-full bg-accent text-[12px] font-semibold tracking-[-0.24px] text-black">
                  {notificationCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <p className="mt-auto px-[30px] text-[11px] font-medium tracking-[-0.22px] text-muted">
        © by BLACK. All rights reserved.
      </p>
    </aside>
  );
}
