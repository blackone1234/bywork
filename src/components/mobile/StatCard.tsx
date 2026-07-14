/** S13(월간 통계) 2열 통계 카드 — 큰 숫자 + 캡션. */
export function MobileStatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-start gap-[var(--mobile-space-8)] rounded-[var(--mobile-radius-card)] border border-[var(--mobile-color-light-gray)] p-[var(--mobile-space-20)]">
      <p className="text-[length:var(--mobile-text-display)] font-extrabold tracking-[var(--mobile-text-display-tracking)] text-[var(--mobile-color-black)]">
        {value}
      </p>
      <p className="text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
        {label}
      </p>
    </div>
  );
}

/** S08(캘린더) "7월 요약"처럼 세로 구분선으로 나뉜 3~4분할 요약 행. */
export function MobileSummaryRow({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="flex w-full items-stretch justify-between px-[var(--mobile-space-10)] pt-[var(--mobile-space-10)]">
      {items.map((item, index) => (
        <div key={item.label} className="flex flex-1 items-center">
          {index > 0 ? <div className="mr-4 h-full w-px self-stretch bg-[var(--mobile-color-light-gray)]" aria-hidden /> : null}
          <div className="flex flex-1 flex-col items-center gap-[6px]">
            <p className="text-[length:var(--mobile-text-display)] font-extrabold tracking-[var(--mobile-text-display-tracking)] text-[var(--mobile-color-black)]">
              {item.value}
            </p>
            <p className="text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
