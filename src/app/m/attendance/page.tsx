import Link from "next/link";
import { redirect } from "next/navigation";
import { MobileMonthPager } from "@/components/mobile/Header";
import { MobileCalendarCell, MobileCalendarWeekdayHeader, type MobileCalendarCellStatus } from "@/components/mobile/CalendarCell";
import { MobileSummaryRow } from "@/components/mobile/StatCard";
import { MobileBottomNav } from "@/components/mobile/BottomNav";
import { MobileTabTransition } from "@/components/mobile/TabTransition";
import { getCurrentEmployee, EMPLOYEE_SESSION_EXPIRED_MESSAGE } from "@/lib/employeeAccount";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

type MonthRow = {
  work_date: string;
  status: "present" | "remote" | "absent" | "on_leave";
  check_in_at: string | null;
  check_out_at: string | null;
};

function kstYearMonth(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" })
    .format(new Date())
    .split("-");
  return { year: Number(parts[0]), month: Number(parts[1]) };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** month는 1~12 범위 밖으로 넘어가도(0 또는 13) 정상 처리 — 연 경계를 넘는 이전/다음달 계산용. */
function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

function monthHref(year: number, month: number): string {
  return `/m/attendance?year=${year}&month=${pad2(month)}`;
}

function hoursBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  return (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;
}

type CalendarCellData = { day: number; status: MobileCalendarCellStatus; href: string | null };

/** work_date(YYYY-MM-DD, 1~31일 중 하루) → 셀 상태. 캘린더는 항상 일요일 시작 6주 그리드로 맞춘다. */
function buildCalendarRows(year: number, month: number, dayStatus: Map<number, MobileCalendarCellStatus>): CalendarCellData[][] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prevMonthDays = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  const cells: CalendarCellData[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, status: "muted", href: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    // S09 드릴인은 이번 달 실제 날짜만 — 다른 달 꼬리 셀(muted/다음달)은 링크 없음.
    cells.push({ day: d, status: dayStatus.get(d) ?? "empty", href: `/m/attendance/${year}-${pad2(month)}-${pad2(d)}` });
  }
  let nextMonthDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: nextMonthDay++, status: "empty", href: null });
  }

  const rows: CalendarCellData[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

const LEGEND: { label: string; status: MobileCalendarCellStatus }[] = [
  { label: "출근", status: "work" },
  { label: "연차", status: "leave" },
  { label: "공휴", status: "holiday" },
];

/** S08 — 근태 캘린더 (light, 근태 탭 루트). ?year=&month= 쿼리로 다른 달을 조회할 수
 * 있고(없으면 오늘이 속한 월), attendance_records_with_times + holidays로 실제 조회한다. */
export default async function MobileAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect(`/m/login?error=${encodeURIComponent(EMPLOYEE_SESSION_EXPIRED_MESSAGE)}`);
  }

  const params = await searchParams;
  const today = kstYearMonth();
  const year = Number(params.year) || today.year;
  const month = Number(params.month) || today.month;
  const monthStart = `${year}-${pad2(month)}-01`;
  const nextMonthFirst = month === 12 ? `${year + 1}-01-01` : `${year}-${pad2(month + 1)}-01`;
  const monthEndDate = new Date(`${nextMonthFirst}T00:00:00Z`);
  monthEndDate.setUTCDate(monthEndDate.getUTCDate() - 1);
  const monthEnd = monthEndDate.toISOString().slice(0, 10);

  const supabase = createSupabaseAdminClient();
  const [{ data: records, error: recordsError }, { data: holidays, error: holidaysError }] = await Promise.all([
    supabase
      .from("attendance_records_with_times")
      .select("work_date, status, check_in_at, check_out_at")
      .eq("employee_id", employee.id)
      .gte("work_date", monthStart)
      .lte("work_date", monthEnd)
      .returns<MonthRow[]>(),
    supabase.from("holidays").select("holiday_date").gte("holiday_date", monthStart).lte("holiday_date", monthEnd),
  ]);

  if (recordsError) throw new Error(`근태 데이터를 불러오지 못했습니다: ${recordsError.message}`);
  if (holidaysError) throw new Error(`공휴일 데이터를 불러오지 못했습니다: ${holidaysError.message}`);

  const monthRecords = records ?? [];
  const holidayDays = new Set((holidays ?? []).map((h) => Number(h.holiday_date.slice(8, 10))));

  const dayStatus = new Map<number, MobileCalendarCellStatus>();
  for (const row of monthRecords) {
    const day = Number(row.work_date.slice(8, 10));
    if (row.status === "on_leave") {
      dayStatus.set(day, "leave");
    } else if (row.status === "present" || row.status === "remote") {
      dayStatus.set(day, "work");
    }
  }
  for (const day of holidayDays) {
    if (!dayStatus.has(day)) dayStatus.set(day, "holiday");
  }

  const calendarRows = buildCalendarRows(year, month, dayStatus);
  const prev = addMonths(year, month, -1);
  const next = addMonths(year, month, 1);

  const workDaysCount = monthRecords.filter((r) => r.status === "present" || r.status === "remote").length;
  const totalHours = monthRecords.reduce((sum, r) => sum + hoursBetween(r.check_in_at, r.check_out_at), 0);
  const leaveDaysCount = monthRecords.filter((r) => r.status === "on_leave").length;

  return (
    <MobileTabTransition>
    {/* 하단 네비가 fixed로 바뀌면서(스크롤해도 항상 고정) 정상 흐름에서 빠졌다 — 마지막
        콘텐츠가 네비에 가려지지 않도록 실측한 네비 높이(pb-[110px])만큼 여백을 확보한다. */}
    <div className="flex min-h-screen w-full flex-col bg-[var(--mobile-color-white)] pb-[110px]">
      <div className="flex w-full flex-col gap-[30px] pb-[30px]">
        {/* get_metadata 실측: welcome(타이틀) 하단→#info(캘린더) 상단은 30px지만, #info 내부의
            그리드→범례→7월요약 간격은 전부 40px다 — 하나의 gap 값으로 4개 형제를 묶으면
            첫 간격만 어긋난다. 타이틀을 별도 30px 래퍼로, 나머지 3개를 40px 래퍼로 분리했다. */}
        <MobileMonthPager
          label={`${year}년 ${month}월`}
          prevHref={monthHref(prev.year, prev.month)}
          nextHref={monthHref(next.year, next.month)}
        />
        {/* 그룹2(A 확산) — 캘린더 그리드/범례/월요약 3섹션에 스태거 적용. */}
        <div className="flex w-full flex-col gap-[40px]">
          <div className="stagger-item flex w-full flex-col gap-[10px] px-[var(--mobile-space-30)]" style={{ animationDelay: "0ms" }}>
            <div className="flex w-full justify-between">
              {WEEKDAY_LABELS.map((label) => (
                <MobileCalendarWeekdayHeader key={label} label={label} />
              ))}
            </div>
            <div className="flex w-full flex-col gap-[8px]">
              {calendarRows.map((row, index) => (
                <div key={index} className="flex w-full justify-between">
                  {row.map((cell, cellIndex) =>
                    cell.href ? (
                      <Link key={cellIndex} href={cell.href}>
                        <MobileCalendarCell day={cell.day} status={cell.status} />
                      </Link>
                    ) : (
                      <MobileCalendarCell key={cellIndex} day={cell.day} status={cell.status} />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
          <div
            className="stagger-item flex w-full items-center justify-center gap-[40px] px-[var(--mobile-space-30)]"
            style={{ animationDelay: "70ms" }}
          >
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
          <div className="stagger-item flex w-full flex-col gap-[6px] px-[var(--mobile-space-30)]" style={{ animationDelay: "140ms" }}>
            <p className="w-full text-center text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
              {month}월 요약
            </p>
            <MobileSummaryRow
              items={[
                { value: String(workDaysCount), label: "근무일" },
                { value: `${Math.round(totalHours)}h`, label: "총 근무시간" },
                { value: String(leaveDaysCount), label: "연차" },
              ]}
            />
          </div>
        </div>
      </div>
      <MobileBottomNav active="attendance" theme="light" />
    </div>
    </MobileTabTransition>
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
