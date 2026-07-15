"use client";

/** S12(휴가내역 필터)·S13/S14(통계 월간/연간)이 공유하는 점+밑줄 탭. */
export function MobileTabBar({
  tabs,
  activeIndex,
  onChange,
}: {
  tabs: string[];
  activeIndex: number;
  onChange?: (index: number) => void;
}) {
  return (
    // Figma는 탭마다 고정 폭(333px / 탭 개수)을 쓴다 — justify-between으로 흉내 내면
    // 라벨 글자 수가 다를 때(예: "대기중" 3자 vs "전체" 2자) 점(dot) 간격이 고르지
    // 않게 벌어진다(실측 확인: 94px/105px/94px). flex-1로 탭마다 동일 폭을 준다.
    <div className="flex w-full items-center border-b-2 border-[var(--mobile-color-soft-gray)] pb-[var(--mobile-space-10)]">
      {tabs.map((tab, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange?.(index)}
            aria-pressed={active}
            className="flex flex-1 items-center gap-[var(--mobile-space-10)] border-0 p-0"
          >
            <span
              className={`size-2 rounded-full ${active ? "bg-[var(--mobile-color-accent)]" : "bg-[var(--mobile-color-light-gray)]"}`}
              aria-hidden
            />
            <span
              className={`text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] ${
                active ? "text-[var(--mobile-color-black)]" : "text-[var(--mobile-color-warm-gray)]"
              }`}
            >
              {tab}
            </span>
          </button>
        );
      })}
    </div>
  );
}
