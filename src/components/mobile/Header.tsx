"use client";

import type { ReactNode } from "react";
import { BackChevronIcon, BellIcon, PagerChevronIcon } from "@/components/mobile/icons";

/**
 * S03~S07 홈 전용 어두운 헤더 — "by WORKS" 워드마크 + 알림 종. 로고는 Figma 원본 SVG를
 * public/mobile/logo-by-works-header.svg로 내려받아 그대로 쓴다(106.469×20, get_metadata로
 * 확인한 실측 크기).
 */
export function MobileHomeHeader({ hasAlert = false }: { hasAlert?: boolean }) {
  return (
    <div className="flex w-full flex-col items-start px-[var(--mobile-space-30)] pt-[60px] pb-[var(--mobile-space-20)]">
      <div className="flex w-full items-start justify-between border-b-4 border-[var(--mobile-color-warm-gray)] pb-[var(--mobile-space-20)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mobile/logo-by-works-header.svg" alt="by WORKS" width={106.469} height={20} />
        <BellIcon className="h-5 w-[15.814px] text-[var(--mobile-color-white)]" hasAlert={hasAlert} />
      </div>
    </div>
  );
}

/** S03/S07 "안녕하세요 / OOO 님" + 오늘 날짜. */
export function MobileGreeting({ name, date }: { name: string; date: string }) {
  return (
    <div className="flex w-full items-start justify-center gap-[var(--mobile-space-12)]">
      <div className="flex-1 text-[28px] leading-[36px] font-extrabold tracking-[-0.56px] text-[var(--mobile-color-white)]">
        <p>안녕하세요</p>
        <p>{name} 님</p>
      </div>
      <p className="pt-[2px] text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
        {date}
      </p>
    </div>
  );
}

/**
 * S02/S09/S11/S12/S16처럼 뒤로가기 + 큰 타이틀(+선택적 서브타이틀)을 쓰는 드릴인 화면 헤더.
 * pt-100(=Figma의 빈 TOP 스페이서 h-100 전체) — pt-60만 주던 이전 버전은 실제보다 40px
 * 낮은 위치에 타이틀이 떴다. get_metadata로 TOP이 "빈 100px 박스"라는 걸 재확인해서 고침.
 */
export function MobileSubPageHeader({
  title,
  subtitle,
  meta,
  onBack,
}: {
  title: string;
  subtitle?: string;
  /** S09처럼 subtitle 대신 상태 뱃지+요약 텍스트 같은 커스텀 콘텐츠를 타이틀 아래에 둘 때. */
  meta?: ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-[var(--mobile-space-24)] px-[var(--mobile-space-30)] pt-[100px]">
      {/* 네이티브 button의 기본 padding/border를 리셋 — 안 하면 브라우저가 넣는 여백 때문에
          화살표가 아래 타이틀보다 오른쪽으로 밀려서 왼쪽 정렬이 어긋난다. */}
      <button type="button" onClick={onBack} aria-label="뒤로가기" className="block border-0 p-0 text-[var(--mobile-color-black)]">
        <BackChevronIcon className="size-5" />
      </button>
      <div className="flex flex-col items-start gap-[var(--mobile-space-20)]">
        <h1 className="text-[length:var(--mobile-text-display)] font-extrabold tracking-[var(--mobile-text-display-tracking)] text-[var(--mobile-color-black)]">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-[length:var(--mobile-text-body)] tracking-[var(--mobile-text-body-tracking)] text-[var(--mobile-color-hint)]">
            {subtitle}
          </p>
        ) : null}
        {meta}
      </div>
    </div>
  );
}

/** S10/S13/S14/S15처럼 뒤로가기 없이 탭 루트에 바로 오는 헤더 — 필요하면 우측에 보조 요소. */
export function MobileTabRootHeader({
  title,
  size = "md",
  trailing,
}: {
  title: string;
  size?: "sm" | "md";
  trailing?: ReactNode;
}) {
  return (
    <div className="flex w-full items-center justify-between px-[var(--mobile-space-30)] pt-[100px]">
      <h1
        className={`font-extrabold text-[var(--mobile-color-black)] ${
          size === "sm"
            ? "text-[length:var(--mobile-text-heading-sm)] tracking-[var(--mobile-text-heading-sm-tracking)]"
            : "text-[length:var(--mobile-text-heading)] tracking-[var(--mobile-text-heading-tracking)]"
        }`}
      >
        {title}
      </h1>
      {trailing}
    </div>
  );
}

/** S08(근태 캘린더) "‹ 2026년 7월 ›" 처럼 좌우 화살표로 기간을 넘기는 타이틀 행. */
export function MobileMonthPager({ label, onPrev, onNext }: { label: string; onPrev?: () => void; onNext?: () => void }) {
  return (
    <div className="flex w-full items-center justify-between px-[var(--mobile-space-30)] pt-[100px]">
      <button type="button" onClick={onPrev} aria-label="이전" className="block border-0 p-0 text-[var(--mobile-color-black)]">
        <PagerChevronIcon direction="left" />
      </button>
      <p className="text-[length:var(--mobile-text-heading-sm)] font-bold tracking-[var(--mobile-text-heading-sm-tracking)] text-[var(--mobile-color-black)]">
        {label}
      </p>
      <button type="button" onClick={onNext} aria-label="다음" className="block border-0 p-0 text-[var(--mobile-color-black)]">
        <PagerChevronIcon direction="right" />
      </button>
    </div>
  );
}
