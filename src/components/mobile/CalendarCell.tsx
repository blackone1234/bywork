/** S08(근태 캘린더) 날짜 셀 — 42x42 원형에 가까운 rounded 정사각형. */
export type MobileCalendarCellStatus = "work" | "late" | "leave" | "holiday" | "muted" | "empty";

const STATUS_CLASSNAME: Record<MobileCalendarCellStatus, string> = {
  work: "bg-[var(--mobile-color-state-work)] text-[var(--mobile-color-black)]",
  late: "bg-[var(--mobile-color-state-late)] text-[var(--mobile-color-black)]",
  leave: "bg-[var(--mobile-color-state-leave)] text-[var(--mobile-color-black)]",
  holiday: "bg-[var(--mobile-color-state-holiday)] text-[var(--mobile-color-black)]",
  /** 이전 달의 꼬리 날짜 (예: 7월 캘린더에 걸친 6월 28~30일) */
  muted: "bg-[var(--mobile-color-soft-gray)] text-[var(--mobile-color-white)]",
  /** 기록 없음 / 다음 달 날짜 */
  empty: "border border-[var(--mobile-color-light-gray)] text-[var(--mobile-color-warm-gray)]",
};

export function MobileCalendarCell({ day, status = "empty" }: { day: number; status?: MobileCalendarCellStatus }) {
  return (
    <div
      className={`flex size-[42px] shrink-0 flex-col items-center justify-center rounded-[var(--mobile-radius-card)] text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] ${STATUS_CLASSNAME[status]}`}
    >
      {day}
    </div>
  );
}

export function MobileCalendarWeekdayHeader({ label }: { label: string }) {
  return (
    <div className="flex h-6 w-[42px] shrink-0 flex-col items-center justify-center rounded-[var(--mobile-radius-card)] text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-dark-gray)]">
      {label}
    </div>
  );
}
