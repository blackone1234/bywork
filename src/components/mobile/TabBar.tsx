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
    <div className="flex w-full items-center justify-between border-b-2 border-[var(--mobile-color-soft-gray)] pb-[var(--mobile-space-10)]">
      {tabs.map((tab, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange?.(index)}
            aria-pressed={active}
            className="flex items-center gap-[var(--mobile-space-10)] border-0 p-0"
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
