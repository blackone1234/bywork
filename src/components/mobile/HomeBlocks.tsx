import { Fragment } from "react";
import { MobileProgressBar } from "@/components/mobile/ProgressBar";

export type WeekdayHours = { day: string; hours: string | null };

/**
 * S03/S07의 "이번 주 근무현황" 요일별 알약 — 기록 있는 요일은 mint 필, 없는 요일은
 * warm-gray 필("-" 표시).
 */
export function MobileWeekdayHoursRow({ label, days }: { label?: string; days: WeekdayHours[] }) {
  return (
    // get_metadata 실측: 라벨(14px) → 요일 행(y=34 시작) 간격은 8px가 아니라 20px다.
    <div className="flex w-full flex-col items-start gap-[var(--mobile-space-20)]">
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

/**
 * S03의 "잔여 연차" 행. 사용자가 Figma 원본을 직접 수정한 뒤 재조회해서 확인한 최신 구조 —
 * 이전엔 텍스트 행 자체에 border-bottom을 걸었지만, 지금 Figma는 구분선을 별도의 0-height
 * 요소로 분리하고 -3px 인셋으로 텍스트 바로 아래에 붙인다(같은 결과처럼 보여도 실제 DOM
 * 구조가 다르므로 그대로 옮김).
 */
export function MobileResidualLeaveRow({ days }: { days: string }) {
  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="flex w-full items-center justify-end gap-[var(--mobile-space-20)] pb-[10px]">
        <p className="text-[length:var(--mobile-text-body)] tracking-[var(--mobile-text-body-tracking)] text-[var(--mobile-color-light-gray)]">
          잔여 연차
        </p>
        <p className="text-[24px] font-extrabold tracking-[-0.48px] text-[var(--mobile-color-white)]">{days}</p>
      </div>
      <div className="relative h-0 w-full">
        <div className="absolute inset-x-0 -top-[3px] h-[3px] bg-[var(--mobile-color-warm-gray)]" />
      </div>
    </div>
  );
}

/** S04/S07의 "주간 누적" 캡션 + 값 + 진행 바. */
export function MobileWeeklyProgress({ current, total, percent }: { current: string; total: string; percent: number }) {
  return (
    <div className="flex w-full flex-col items-start gap-[4px]">
      <p className="text-[12px] tracking-[-0.24px] text-[var(--mobile-color-hint)]">주간 누적</p>
      <div className="flex items-end gap-[var(--mobile-space-10)]">
        <p className="text-[18px] tracking-[-0.36px] text-[var(--mobile-color-mint)]">{current}</p>
        <p className="text-[12px] tracking-[-0.24px] text-[var(--mobile-color-hint)]">/ {total}</p>
      </div>
      <div className="w-full pt-[6px]">
        <MobileProgressBar percent={percent} />
      </div>
    </div>
  );
}

/**
 * S05/S06의 출근·외출(또는 외근)·순 근무 3분할 정보 행 — dark 배경용. Figma의 "Info"
 * 컴포넌트는 이미 333px 너비인 #Contents 안에서 자체적으로 pt-10 px-30을 한 번 더 가져서,
 * 다른 형제 요소(버튼 등)보다 좌우로 살짝 더 인셋된다.
 *
 * 구분선은 Figma에서 flex-[1_0_0](자라나는 영역)이라 실제 남는 공간을 전부 흡수하고,
 * 3개 라벨 컬럼은 각자 콘텐츠 폭만큼만 차지한다 — 이전엔 구분선에 고정 mr-20을 주고
 * 바깥 행을 justify-between으로 처리해서, 컬럼별 텍스트 폭이 다르면(출근/외출/순 근무)
 * 3영역 간격이 고르지 않게 벌어졌다.
 */
export function MobileHomeInfoRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex w-full items-start px-[var(--mobile-space-30)] pt-[10px]">
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 ? (
            <div className="flex flex-1 items-stretch justify-center px-[10px]">
              <div className="w-px bg-[var(--mobile-color-warm-gray)]" />
            </div>
          ) : null}
          <div className="flex shrink-0 flex-col items-center gap-[6px]">
            <p className="leading-none text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-light-gray)]">
              {item.label}
            </p>
            <p className="font-semibold leading-none text-[18px] tracking-[-0.36px] text-[var(--mobile-color-white)]">{item.value}</p>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
