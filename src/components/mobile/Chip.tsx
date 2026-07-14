"use client";

/** S11 "휴가 종류" 3지선다처럼, 여러 개 중 하나를 고르는 세그먼트 칩. */
export function MobileChip({
  label,
  selected = false,
  onClick,
  className = "",
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex flex-1 items-center justify-center rounded-[var(--mobile-radius-chip)] px-[var(--mobile-space-20)] py-[var(--mobile-space-12)] text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] ${
        selected
          ? "bg-[var(--mobile-color-dark-gray)] text-[var(--mobile-color-white)]"
          : "border border-[var(--mobile-color-light-gray)] text-[var(--mobile-color-soft-gray)]"
      } ${className}`}
    >
      {label}
    </button>
  );
}
