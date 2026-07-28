"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BackChevronIcon, BellIcon, PagerChevronIcon } from "@/components/mobile/icons";
import { NOTIFICATION_BELL_ENABLED } from "@/lib/featureFlags";

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
        {NOTIFICATION_BELL_ENABLED ? (
          <BellIcon className="h-5 w-[15.814px] text-[var(--mobile-color-white)]" hasAlert={hasAlert} />
        ) : null}
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
 * 2026-07-20 전 화면 재실측 결과 Figma TOP 높이가 화면마다 다름이 확인됨 — S02만 100px이고
 * 나머지(S09/S11/S12/S16)는 60px. 예전엔 S02 기준값(100)을 전체에 그대로 썼던 것(과거
 * "pt-60→100 수정" 이력 있음, 그 당시엔 맞았을 수 있으나 이번 재검증에서 대다수 화면과
 * 안 맞는 게 새로 드러남) — S02만 topPadding="100px"로 예외 지정하고 기본값을 60으로 내림.
 */
export function MobileSubPageHeader({
  title,
  subtitle,
  meta,
  onBack,
  topPadding = "60px",
}: {
  title: string;
  subtitle?: string;
  /** S09처럼 subtitle 대신 상태 뱃지+요약 텍스트 같은 커스텀 콘텐츠를 타이틀 아래에 둘 때. */
  meta?: ReactNode;
  onBack?: () => void;
  /** S02만 예외로 100px — 나머지 사용처(S09/S11/S12/S16)는 기본값 60px 그대로 둔다. */
  topPadding?: string;
}) {
  const router = useRouter();
  // onBack을 넘긴 사용처가 지금까지 하나도 없어서(grep 0건) 버튼 onClick이 항상 undefined였다
  // — 클릭해도 아무 동작 없이 죽어있던 버튼. 명시적으로 넘기지 않으면 브라우저 history back으로
  // 폴백해서, 실제로 진입한 화면(캘린더/리스트 등)으로 돌아가게 한다.
  const handleBack = onBack ?? (() => router.back());
  return (
    <div
      className="flex w-full flex-col items-start gap-[var(--mobile-space-24)] px-[var(--mobile-space-30)]"
      style={{ paddingTop: topPadding }}
    >
      {/* 네이티브 button의 기본 padding/border를 리셋 — 안 하면 브라우저가 넣는 여백 때문에
          화살표가 아래 타이틀보다 오른쪽으로 밀려서 왼쪽 정렬이 어긋난다. */}
      <button type="button" onClick={handleBack} aria-label="뒤로가기" className="block border-0 p-0 text-[var(--mobile-color-black)]">
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

/**
 * S10/S13/S14/S15처럼 뒤로가기 없이 탭 루트에 바로 오는 헤더 — 필요하면 우측에 보조 요소.
 * 2026-07-20 재실측: Figma TOP 높이가 4개 사용처(S10/S13/S14/S15) 전부 60px로 일치해서
 * 예외 없이 기본값만 100→60으로 내림.
 */
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
    <div className="flex w-full items-center justify-between px-[var(--mobile-space-30)] pt-[60px]">
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

/**
 * S08(근태 캘린더) "‹ 2026년 7월 ›" 처럼 좌우 화살표로 기간을 넘기는 타이틀 행.
 * S08에서는 페이지 맨 위(루트 헤더)로 쓰여서 자체 pt가 필요하지만, S13/S14(통계)에서는
 * TabRootHeader+TabBar 다음에 오는 2차 요소라 pt가 또 붙으면 바깥 gap-30과 합쳐져
 * 더 벌어진다(실측 확인) — asRoot=false로 그 pt를 뺀다. 2026-07-20: 다른 루트 헤더
 * (MobileTabRootHeader 등)와 값을 맞추기로 해서 100→60으로 내림(사용자 확인 — Figma
 * S08 실측은 50이지만 다른 헤더들과의 일관성을 우선함).
 *
 * onPrev/onNext(콜백)는 지금까지 실제로 넘긴 사용처가 하나도 없어서(grep 재확인) 화살표
 * 클릭이 항상 죽어있었다 — MobileSubPageHeader의 onBack이 겪었던 것과 동일한 버그가
 * 재발한 것. S08(page.tsx, 서버 컴포넌트)처럼 URL 쿼리로 연/월을 바꾸는 화면에서는
 * 콜백을 넘길 수 없으므로, prevHref/nextHref가 있으면 <button onClick>이 아니라
 * <Link href>로 렌더링하는 경로를 추가한다(콜백 방식과 공존, 기존 호출부는 무변경).
 */
export function MobileMonthPager({
  label,
  onPrev,
  onNext,
  prevHref,
  nextHref,
  asRoot = true,
}: {
  label: string;
  onPrev?: () => void;
  onNext?: () => void;
  prevHref?: string;
  nextHref?: string;
  asRoot?: boolean;
}) {
  return (
    <div className={`flex w-full items-center justify-between px-[var(--mobile-space-30)] ${asRoot ? "pt-[60px]" : ""}`}>
      {prevHref ? (
        <Link href={prevHref} aria-label="이전" className="block border-0 p-0 text-[var(--mobile-color-black)]">
          <PagerChevronIcon direction="left" />
        </Link>
      ) : (
        <button type="button" onClick={onPrev} aria-label="이전" className="block border-0 p-0 text-[var(--mobile-color-black)]">
          <PagerChevronIcon direction="left" />
        </button>
      )}
      <p className="text-[length:var(--mobile-text-heading-sm)] font-bold tracking-[var(--mobile-text-heading-sm-tracking)] text-[var(--mobile-color-black)]">
        {label}
      </p>
      {nextHref ? (
        <Link href={nextHref} aria-label="다음" className="block border-0 p-0 text-[var(--mobile-color-black)]">
          <PagerChevronIcon direction="right" />
        </Link>
      ) : (
        <button type="button" onClick={onNext} aria-label="다음" className="block border-0 p-0 text-[var(--mobile-color-black)]">
          <PagerChevronIcon direction="right" />
        </button>
      )}
    </div>
  );
}
