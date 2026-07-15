import { MobileMonthPager } from "@/components/mobile/Header";
import { MobileCalendarCell, MobileCalendarWeekdayHeader, type MobileCalendarCellStatus } from "@/components/mobile/CalendarCell";
import { MobileSummaryRow } from "@/components/mobile/StatCard";
import { MobileBottomNav } from "@/components/mobile/BottomNav";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/** 2026년 7월 달력 그리드 — Figma S08 목데이터 그대로. */
const CALENDAR_ROWS: { day: number; status: MobileCalendarCellStatus }[][] = [
  [
    { day: 28, status: "muted" },
    { day: 29, status: "muted" },
    { day: 30, status: "muted" },
    { day: 1, status: "work" },
    { day: 2, status: "work" },
    { day: 3, status: "late" },
    { day: 4, status: "empty" },
  ],
  [
    { day: 5, status: "empty" },
    { day: 6, status: "work" },
    { day: 7, status: "work" },
    { day: 8, status: "work" },
    { day: 9, status: "leave" },
    { day: 10, status: "leave" },
    { day: 11, status: "empty" },
  ],
  [
    { day: 12, status: "empty" },
    { day: 13, status: "work" },
    { day: 14, status: "work" },
    { day: 15, status: "work" },
    { day: 16, status: "work" },
    { day: 17, status: "holiday" },
    { day: 18, status: "empty" },
  ],
  [
    { day: 19, status: "empty" },
    { day: 20, status: "late" },
    { day: 21, status: "leave" },
    { day: 22, status: "work" },
    { day: 23, status: "work" },
    { day: 24, status: "late" },
    { day: 25, status: "empty" },
  ],
  [
    { day: 26, status: "empty" },
    { day: 27, status: "empty" },
    { day: 28, status: "empty" },
    { day: 29, status: "empty" },
    { day: 30, status: "empty" },
    { day: 31, status: "empty" },
    { day: 1, status: "empty" },
  ],
];

const LEGEND: { label: string; status: MobileCalendarCellStatus }[] = [
  { label: "출근", status: "work" },
  { label: "지각", status: "late" },
  { label: "연차", status: "leave" },
  { label: "공휴", status: "holiday" },
];

/** S08 — 근태 캘린더 (light, 근태 탭 루트). */
export default function MobileAttendancePage() {
  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-[var(--mobile-color-white)]">
      <div className="flex w-full flex-col gap-[30px] pb-[30px]">
        {/* get_metadata 실측: welcome(타이틀) 하단→#info(캘린더) 상단은 30px지만, #info 내부의
            그리드→범례→7월요약 간격은 전부 40px다 — 하나의 gap 값으로 4개 형제를 묶으면
            첫 간격만 어긋난다. 타이틀을 별도 30px 래퍼로, 나머지 3개를 40px 래퍼로 분리했다. */}
        <MobileMonthPager label="2026년 7월" />
        <div className="flex w-full flex-col gap-[40px]">
          <div className="flex w-full flex-col gap-[10px] px-[var(--mobile-space-30)]">
            <div className="flex w-full justify-between">
              {WEEKDAY_LABELS.map((label) => (
                <MobileCalendarWeekdayHeader key={label} label={label} />
              ))}
            </div>
            <div className="flex w-full flex-col gap-[8px]">
              {CALENDAR_ROWS.map((row, index) => (
                <div key={index} className="flex w-full justify-between">
                  {row.map((cell, cellIndex) => (
                    <MobileCalendarCell key={cellIndex} day={cell.day} status={cell.status} />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex w-full items-center justify-center gap-[40px] px-[var(--mobile-space-30)]">
            {LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-[8px]">
                <LegendDot status={item.status} />
                <p className="text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-black)]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          {/* 사용자 지시로 Figma 스펙(20px = 여기 gap-10 + MobileSummaryRow 내부 pt-10)보다
              4px 좁게 강제 고정 — gap-6으로 줄임(합산 16px). */}
          <div className="flex w-full flex-col gap-[6px] px-[var(--mobile-space-30)]">
            <p className="w-full text-center text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
              7월 요약
            </p>
            <MobileSummaryRow items={[{ value: "22", label: "근무일" }, { value: "176h", label: "총 근무일" }, { value: "1", label: "연차" }]} />
          </div>
        </div>
      </div>
      <MobileBottomNav active="attendance" theme="light" />
    </div>
  );
}

const LEGEND_DOT_CLASSNAME: Record<MobileCalendarCellStatus, string> = {
  work: "bg-[var(--mobile-color-state-work)]",
  late: "bg-[var(--mobile-color-state-late)]",
  leave: "bg-[var(--mobile-color-state-leave)]",
  holiday: "bg-[var(--mobile-color-state-holiday)]",
  muted: "bg-[var(--mobile-color-soft-gray)]",
  empty: "bg-[var(--mobile-color-light-gray)]",
};

function LegendDot({ status }: { status: MobileCalendarCellStatus }) {
  return <span className={`size-3 rounded-full ${LEGEND_DOT_CLASSNAME[status]}`} aria-hidden />;
}
