"use client";

import { useState } from "react";
import Link from "next/link";
import { adminAccount } from "@/lib/dummy-data";

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
            <span className="flex size-[36px] items-center justify-center rounded-full bg-avatar-bg text-[15px] font-bold text-avatar-text">
              A
            </span>
            <span className={`text-muted transition-transform ${menuOpen ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>

          {menuOpen ? (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              <div className="absolute top-[46px] right-0 z-50 flex w-[220px] flex-col gap-1 rounded-[12px] border border-divider bg-white p-2 shadow-[2px_4px_8px_rgba(0,0,0,0.12)]">
                <div className="flex flex-col gap-[2px] px-3 py-2">
                  <span className="text-[13px] font-bold tracking-[-0.26px] text-black">
                    관리자
                  </span>
                  <span className="text-[12px] font-semibold tracking-[-0.24px] text-muted">
                    {adminAccount.email}
                  </span>
                </div>
                <div className="my-1 h-px w-full bg-divider" />
                <Link
                  href="/settings/system"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-[8px] px-3 py-2 text-left text-[14px] font-semibold tracking-[-0.28px] text-black transition-colors hover:bg-sidebar-active hover:text-white"
                >
                  시스템 설정
                </Link>
                <button
                  type="button"
                  className="rounded-[8px] px-3 py-2 text-left text-[14px] font-semibold tracking-[-0.28px] text-black transition-colors hover:bg-sidebar-active hover:text-white"
                >
                  로그아웃
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
