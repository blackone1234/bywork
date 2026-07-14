import { MobileProgressBar } from "@/components/mobile/ProgressBar";

export type WeekdayHours = { day: string; hours: string | null };

/**
 * S03/S07의 "이번 주 근무현황" 요일별 알약 — 기록 있는 요일은 mint 필, 없는 요일은
 * warm-gray 필("-" 표시).
 */
export function MobileWeekdayHoursRow({ label, days }: { label?: string; days: WeekdayHours[] }) {
  return (
    <div className="flex w-full flex-col items-start gap-[var(--mobile-space-8)]">
      {label ? (
        <p className="w-full text-center text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-light-gray)]">
          {label}
        </p>
      ) : null}
      <div className="flex w-full items-start">
        {days.map(({ day, hours }) => (
          <div key={day} className="flex flex-1 flex-col items-center gap-[var(--mobile-space-8)]">
            <p className="text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-warm-gray)]">
              {day}
            </p>
            <div
              className={`flex w-[42px] items-center justify-center rounded-[var(--mobile-radius-badge)] px-[12px] py-[6px] text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-black)] ${
                hours ? "bg-[var(--mobile-color-mint)]" : "bg-[var(--mobile-color-warm-gray)]"
              }`}
            >
              {hours ?? "-"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** S03의 "잔여 연차" 행 — 위쪽에 warm-gray 굵은 구분선. */
export function MobileResidualLeaveRow({ days }: { days: string }) {
  return (
    <div className="flex w-full items-center justify-end gap-[var(--mobile-space-20)] border-t-[3px] border-[var(--mobile-color-warm-gray)] pb-[10px] pt-[10px]">
      <p className="text-[length:var(--mobile-text-body)] tracking-[var(--mobile-text-body-tracking)] text-[var(--mobile-color-light-gray)]">
        잔여 연차
      </p>
      <p className="text-[24px] font-extrabold tracking-[-0.48px] text-[var(--mobile-color-white)]">{days}</p>
    </div>
  );
}

/** S04/S07의 "주간 누적" 캡션 + 값 + 진행 바. */
export function MobileWeeklyProgress({ current, total, percent }: { current: string; total: string; percent: number }) {
  return (
    <div className="flex w-full flex-col items-start gap-[4px]">
      <p className="text-[12px] tracking-[-0.24px] text-[#9e9e9e]">주간 누적</p>
      <div className="flex items-end gap-[var(--mobile-space-10)]">
        <p className="text-[18px] tracking-[-0.36px] text-[var(--mobile-color-mint)]">{current}</p>
        <p className="text-[12px] tracking-[-0.24px] text-[#9e9e9e]">/ {total}</p>
      </div>
      <div className="w-full pt-[6px]">
        <MobileProgressBar percent={percent} />
      </div>
    </div>
  );
}

/** S05/S06의 출근·외출(또는 외근)·순 근무 3분할 정보 행 — dark 배경용. */
export function MobileHomeInfoRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex w-full items-start justify-between">
      {items.map((item, index) => (
        <div key={item.label} className="flex items-center">
          {index > 0 ? <div className="mr-[20px] h-[38px] w-px bg-[var(--mobile-color-warm-gray)]" aria-hidden /> : null}
          <div className="flex flex-col items-start gap-[10px]">
            <p className="text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-light-gray)]">
              {item.label}
            </p>
            <p className="text-[18px] tracking-[-0.36px] text-[var(--mobile-color-white)]">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
