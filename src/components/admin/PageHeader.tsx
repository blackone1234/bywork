"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronIcon } from "@/components/admin/ChevronIcon";
import { logout } from "@/app/login/actions";

const MENU_ITEMS = [
  { label: "관리자 계정 설정", href: "/settings/system" },
  { label: "공휴일 API 설정", href: "/settings/system" },
] as const;

export function PageHeader({ breadcrumb }: { breadcrumb: string[] }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex w-full items-start px-4 pt-6 sm:px-8 lg:px-[60px] lg:pt-[50px]">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3 lg:border-b-3 lg:pb-[14px]">
        <div className="flex flex-wrap items-center gap-2 sm:gap-[20px]">
          {breadcrumb.map((segment, index) => {
            const isLast = index === breadcrumb.length - 1;
            return (
              <span key={segment} className="flex items-center gap-2 sm:gap-[20px]">
                {index > 0 ? <span className="text-[16px] text-line sm:text-[20px]">›</span> : null}
                <span
                  className={`text-[20px] font-extrabold tracking-[-0.4px] sm:text-[26px] sm:tracking-[-0.52px] lg:text-[32px] lg:tracking-[-0.64px] ${
                    isLast ? "text-black" : "text-line"
                  }`}
                >
                  {segment}
                </span>
              </span>
            );
          })}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-[10px]"
            aria-label="관리자 계정 메뉴"
            aria-expanded={menuOpen}
          >
            <span
              className={`flex size-[36px] items-center justify-center rounded-full text-[15px] font-bold transition-colors ${
                menuOpen ? "bg-avatar-text text-white" : "bg-avatar-bg text-avatar-text"
              }`}
            >
              A
            </span>
            <ChevronIcon
              className={`size-[10px] text-muted transition-transform ${menuOpen ? "-scale-y-100" : ""}`}
            />
          </button>

          {menuOpen ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden />
              <div className="absolute top-[46px] right-0 z-50 flex w-max flex-col gap-[3px] rounded-[12px] border border-avatar-text bg-white p-[10px] shadow-[2px_4px_3px_rgba(0,0,0,0.2)]">
                {MENU_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-[10px] px-[14px] py-[8px] text-center text-[12px] font-semibold tracking-[-0.24px] whitespace-nowrap text-line transition-colors hover:rounded-[8px] hover:bg-avatar-text hover:py-[6px] hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full rounded-[10px] px-[14px] py-[8px] text-center text-[12px] font-semibold tracking-[-0.24px] whitespace-nowrap text-line transition-colors hover:rounded-[8px] hover:bg-avatar-text hover:py-[6px] hover:text-white"
                  >
                    로그아웃
                  </button>
                </form>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
