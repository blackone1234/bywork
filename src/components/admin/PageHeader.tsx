"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronIcon } from "@/components/admin/ChevronIcon";
import { logout } from "@/app/login/actions";

const MENU_ITEMS = [
  { label: "관리자 계정 설정", href: "/settings/system" },
  { label: "공휴일 API 설정", href: "/settings/system" },
] as const;

/** 문자열이면 기존처럼 클릭 불가 텍스트, { label, href }면 클릭 가능한 뎁스(마지막
 * 항목은 href를 넘겨받아도 항상 무시하고 비활성으로 렌더링한다 — 현재 페이지). */
export type BreadcrumbSegment = string | { label: string; href: string };

function segmentLabel(segment: BreadcrumbSegment): string {
  return typeof segment === "string" ? segment : segment.label;
}

function segmentHref(segment: BreadcrumbSegment): string | undefined {
  return typeof segment === "string" ? undefined : segment.href;
}

export function PageHeader({ breadcrumb }: { breadcrumb: BreadcrumbSegment[] }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex w-full items-start px-4 pt-6 sm:px-8 lg:px-[60px] lg:pt-[50px]">
      {/* CD가 모바일 브라우저 폭에서 스크린샷으로 직접 지적: 이 바깥 행에 flex-wrap이
          걸려 있으면 브레드크럼이 길어져 2줄이 될 때 계정 드롭다운 블록까지 통째로
          다음 줄로 밀려나고, flex-wrap된 두 번째 줄엔 항목이 그거 하나뿐이라
          justify-between이 좌측에 붙여버려서(줄에 항목이 1개면 space-between이
          왼쪽 정렬과 동일해짐) 드롭다운이 화면 왼쪽 아래로 밀리며 내용을 가리는
          버그였다. flex-wrap은 브레드크럼 내부(다음 줄)에만 걸어두고, 바깥 행은
          wrap을 없애 계정 드롭다운이 항상 오른쪽에 고정되게 한다. */}
      <div className="flex w-full items-center justify-between gap-3 border-b-2 border-black pb-3 lg:border-b-3 lg:pb-[14px]">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-[20px]">
          {breadcrumb.map((segment, index) => {
            const isLast = index === breadcrumb.length - 1;
            const label = segmentLabel(segment);
            const href = isLast ? undefined : segmentHref(segment);
            const textClassName = `text-[20px] font-extrabold tracking-[-0.4px] sm:text-[26px] sm:tracking-[-0.52px] lg:text-[32px] lg:tracking-[-0.64px] ${
              isLast ? "text-black" : "text-line"
            }`;
            return (
              <span key={label} className="flex items-center gap-2 sm:gap-[20px]">
                {index > 0 ? <span className="text-[16px] text-line sm:text-[20px]">›</span> : null}
                {href ? (
                  <Link href={href} className={`${textClassName} transition-colors hover:text-sidebar-active`}>
                    {label}
                  </Link>
                ) : (
                  <span className={textClassName}>{label}</span>
                )}
              </span>
            );
          })}
        </div>

        <div className="relative shrink-0">
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
