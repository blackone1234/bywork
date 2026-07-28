import { Fragment } from "react";

/**
 * S13(월간 통계) 2열 통계 카드 — 캡션이 위, 28px 숫자가 오른쪽 정렬로 아래에 온다
 * (get_design_context로 확인: 32px 왼쪽정렬로 짐작했던 첫 조사와 달랐다).
 */
export function MobileStatCard({ value, label }: { value: string; label: string }) {
  return (
    // 사용자 지시로 라벨 좌측정렬 + 카드 높이 98px(기존 113.5px, Figma 스펙과 무관) 강제 고정.
    <div className="flex flex-1 flex-col items-center gap-[var(--mobile-space-20)] rounded-[var(--mobile-radius-card)] border border-[var(--mobile-color-light-gray)] pt-[18px] pb-[17px]">
      <p className="w-full px-[var(--mobile-space-20)] leading-none text-left text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
        {label}
      </p>
      <p className="w-full px-[var(--mobile-space-20)] leading-none text-right text-[28px] font-extrabold tracking-[-0.56px] text-[var(--mobile-color-black)]">
        {value}
      </p>
    </div>
  );
}

/** S13 "주별 근무시간" — 라벨 + 가로 막대(line-gray 트랙 + mint 채움) + 값. */
export function MobileHorizontalBarRow({ label, value, percent }: { label: string; value: string; percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="flex w-full items-center gap-[20px]">
      <p className="w-6 shrink-0 text-center text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
        {label}
      </p>
      <div className="h-2 flex-1 rounded-[2px] bg-[var(--mobile-color-line-gray)]">
        {/* 파일럿(B): 0%→실제값 CSS transition — width 값 자체는 호출부(StatsView)가
            useMotionReveal()로 0/실제값을 넘겨준다. */}
        <div
          className="h-2 rounded-[2px] bg-[var(--mobile-color-mint)] transition-[width] duration-[900ms] ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="w-6 shrink-0 text-right text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-black)]">
        {value}
      </p>
    </div>
  );
}

/**
 * S14 "월별 근무시간" 12개월 세로 막대 차트. Figma 원본은 가로 막대를 -90도 회전시켜
 * 세로처럼 보이게 하는 트릭을 쓴다(높이 기반 레이아웃 없이 width로 막대 길이를 표현) —
 * 그대로 재현했다. 12개 막대(40px+gap-10 폭 590px)가 333px 콘텐츠 폭을 넘어서므로
 * 가로 스크롤이 실제로 필요하다. 채움색은 주별 막대(mint)와 달리 state-leave(파랑).
 */
export function MobileVerticalBarChart({ bars }: { bars: { label: string; percent: number }[] }) {
  return (
    // 사용자 지시로 스크롤바를 안 보이게 처리 — Figma는 스크롤 UI가 없어서 브라우저
    // 기본 스크롤바만 숨기고 스와이프 동작은 그대로 둔다.
    <div className="flex w-full gap-[10px] overflow-x-auto pb-[4px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {bars.map((bar) => {
        const clamped = Math.min(100, Math.max(0, bar.percent));
        return (
          <div key={bar.label} className="flex shrink-0 flex-col items-center gap-[6px]">
            <div className="flex h-[120px] w-[40px] items-center justify-center">
              <div className="w-[120px] rotate-[-90deg]">
                <div className="h-[40px] w-[120px] overflow-clip rounded-[8px] bg-[var(--mobile-color-line-gray)]">
                  <div
                    className="h-[40px] rounded-[8px] bg-[var(--mobile-color-state-leave)] transition-[width] duration-[900ms] ease-out"
                    style={{ width: `${clamped}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="w-6 text-center text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
              {bar.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * S08(캘린더) "7월 요약"처럼 세로 구분선으로 나뉜 3~4분할 요약 행. Figma의 "Info" 컴포넌트는
 * 값 컬럼과 구분선을 전부 형제 요소로 두고 동일하게 `flex-[1_0_0]`(자라나는 영역)를 줘서
 * 5개(컬럼-선-컬럼-선-컬럼)가 균등 분할된다 — 구분선에 고정 margin을 주고 컬럼만
 * flex-1로 처리하면(이전 구현) 항목별 텍스트 폭 차이 때문에 컬럼 중심이 서로 어긋난다
 * (실측: "22"/"176h"/"1" 중심 간격이 112.8px/104.3px로 불균등했던 문제, MobileHomeInfoRow와
 * 동일한 원인).
 */
export function MobileSummaryRow({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="flex w-full items-start justify-between px-[var(--mobile-space-10)] pt-[var(--mobile-space-10)]">
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 ? (
            <div className="flex flex-[1_0_0] items-center justify-center self-stretch">
              {/* 사용자 지시로 Figma 스펙보다 짧게 강제 고정(73.5→71.5→69.5→65.5px) — h-full
                  대신 명시적 px. */}
              <div className="h-[65.5px] w-px bg-[var(--mobile-color-light-gray)]" />
            </div>
          ) : null}
          <div className="flex flex-[1_0_0] flex-col items-center gap-[4px]">
            <p className="text-[length:var(--mobile-text-display)] font-extrabold tracking-[var(--mobile-text-display-tracking)] text-[var(--mobile-color-black)]">
              {item.value}
            </p>
            <p className="text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
              {item.label}
            </p>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
