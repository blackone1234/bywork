import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { calendarDaysBetween } from "@/lib/employeeLeaveRequests";
import { todayWorkDateKST } from "@/lib/attendanceEvents";

/**
 * S13/S14(통계) + S03/S07(홈 "이번 주 근무현황") 공용 집계 로직. "지각"은 이번 그룹
 * 범위에서 제외했다(S08 캘린더와 같은 이유 — company_settings.standard_start_time은
 * 있지만 유예시간 정책이 스키마 어디에도 없어서, 유예 없이 구현하면 정책을 임의로
 * 만드는 셈이라 사용자 확인받아 뺐다).
 *
 * 모든 "총/근무시간" 계산은 A07/A08(admin)·S07·S09와 동일하게 gross(체크인~체크아웃,
 * 외출/외근 시간 미차감) 방식이다 — 화면 라벨이 전부 "총"이지 "순"이 아니어서
 * go_out/return 구간 매칭 집계는 여기선 필요 없다(S09의 "순 근무 시간"만 예외이며
 * 그건 attendance/[date]/page.tsx에서 별도로 처리한다).
 */

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${pad2(month)}-01`;
}

function lastDayOfMonth(year: number, month: number): string {
  const nextMonthFirst = month === 12 ? `${year + 1}-01-01` : `${year}-${pad2(month + 1)}-01`;
  const d = new Date(`${nextMonthFirst}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Monday(YYYY-MM-DD) of the ISO week containing workDate. */
function getWeekStart(workDate: string): string {
  const d = new Date(`${workDate}T00:00:00Z`);
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d.toISOString().slice(0, 10);
}

function getWeekEnd(workDate: string): string {
  const d = new Date(`${getWeekStart(workDate)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function hoursBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  return (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;
}

type RecordRow = { work_date: string; check_in_at: string | null; check_out_at: string | null };

/**
 * 특정 기간에 걸친(range) 승인된 휴가 일수 — leave_requests.status='approved'인 요청 중
 * 범위와 겹치는 것만, 범위 밖으로 삐져나온 날짜는 잘라서(clip) 센다. 반차(days=0.5)는
 * 항상 하루 안(start=end)이라 클리핑 없이 그대로 더한다.
 */
async function getApprovedLeaveDaysInRange(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  employeeId: string,
  rangeStart: string,
  rangeEnd: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("start_date, end_date, days")
    .eq("employee_id", employeeId)
    .eq("status", "approved")
    .lte("start_date", rangeEnd)
    .gte("end_date", rangeStart);
  if (error) throw new Error(`승인된 휴가 일수를 불러오지 못했습니다: ${error.message}`);

  let total = 0;
  for (const r of data ?? []) {
    if (Number(r.days) === 0.5) {
      total += 0.5;
      continue;
    }
    const clippedStart = r.start_date < rangeStart ? rangeStart : r.start_date;
    const clippedEnd = r.end_date > rangeEnd ? rangeEnd : r.end_date;
    total += calendarDaysBetween(clippedStart, clippedEnd);
  }
  return total;
}

export type WeeklyHoursBar = { label: string; hours: number; percent: number };
const WEEKLY_TARGET_HOURS = 40;

export type MonthlyStats = {
  workDays: number;
  totalHours: number;
  leaveDays: number;
  weeklyHours: WeeklyHoursBar[];
  /** S13 상단 "검토대기중 N건" 배너용 — 해당 월에 걸린 검토대기중 이벤트 개수. */
  pendingReviewCount: number;
};

/** attendance_records_with_times VIEW는 review_status='confirmed'만 보므로, 검토대기중
 * 개수는 attendance_records → attendance_events를 2단계로 직접 세야 한다. */
async function getPendingReviewCountInRange(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  employeeId: string,
  rangeStart: string,
  rangeEnd: string,
): Promise<number> {
  const { data: records, error: recordsError } = await supabase
    .from("attendance_records")
    .select("id")
    .eq("employee_id", employeeId)
    .gte("work_date", rangeStart)
    .lte("work_date", rangeEnd);
  if (recordsError) throw new Error(`검토대기 건수를 불러오지 못했습니다: ${recordsError.message}`);

  const recordIds = (records ?? []).map((r) => r.id);
  if (recordIds.length === 0) return 0;

  const { count, error: countError } = await supabase
    .from("attendance_events")
    .select("id", { count: "exact", head: true })
    .in("attendance_record_id", recordIds)
    .eq("review_status", "pending_review");
  if (countError) throw new Error(`검토대기 건수를 불러오지 못했습니다: ${countError.message}`);

  return count ?? 0;
}

/** S13 — 월간 통계. */
export async function getMonthlyStats(employeeId: string, year: number, month: number): Promise<MonthlyStats> {
  const supabase = createSupabaseAdminClient();
  const monthStart = firstDayOfMonth(year, month);
  const monthEnd = lastDayOfMonth(year, month);
  // 주별 집계가 월 경계에 걸친 주도 정확하도록, 그 주 전체(인접 달 날짜 포함)를 가져온다
  // (admin A07의 listMonthlyAttendance와 동일한 이유).
  const weekRangeStart = getWeekStart(monthStart);
  const weekRangeEnd = getWeekEnd(monthEnd);

  const { data, error } = await supabase
    .from("attendance_records_with_times")
    .select("work_date, check_in_at, check_out_at")
    .eq("employee_id", employeeId)
    .gte("work_date", weekRangeStart)
    .lte("work_date", weekRangeEnd)
    .returns<RecordRow[]>();
  if (error) throw new Error(`월간 근태 통계를 불러오지 못했습니다: ${error.message}`);

  const allRecords = data ?? [];
  const monthRecords = allRecords.filter((r) => r.work_date >= monthStart && r.work_date <= monthEnd);

  const workDays = monthRecords.filter((r) => r.check_in_at).length;
  const totalHours = monthRecords.reduce((sum, r) => sum + hoursBetween(r.check_in_at, r.check_out_at), 0);

  const weekBuckets = new Map<string, number>();
  for (const r of allRecords) {
    const wk = getWeekStart(r.work_date);
    weekBuckets.set(wk, (weekBuckets.get(wk) ?? 0) + hoursBetween(r.check_in_at, r.check_out_at));
  }
  const weeklyHours = [...weekBuckets.keys()].sort().map((wk, i) => {
    const hours = weekBuckets.get(wk)!;
    return { label: `${i + 1}주`, hours, percent: Math.min(100, (hours / WEEKLY_TARGET_HOURS) * 100) };
  });

  const [leaveDays, pendingReviewCount] = await Promise.all([
    getApprovedLeaveDaysInRange(supabase, employeeId, monthStart, monthEnd),
    getPendingReviewCountInRange(supabase, employeeId, monthStart, monthEnd),
  ]);

  return { workDays, totalHours, leaveDays, weeklyHours, pendingReviewCount };
}

export type MonthlyHoursBar = { label: string; hours: number; percent: number };
const MONTHLY_TARGET_HOURS = 120;
const WEEKLY_LEGAL_LIMIT_HOURS = 52;

export type YearlyStats = {
  monthlyHours: MonthlyHoursBar[];
  totalHours: number;
  weeksOver52: number;
};

/** S14 — 연간 통계. */
export async function getYearlyStats(employeeId: string, year: number): Promise<YearlyStats> {
  const supabase = createSupabaseAdminClient();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  // 52시간 초과 주차 판정이 연말/연초 경계 주에서도 정확하도록 그 주 전체를 포함해서 조회.
  const rangeStart = getWeekStart(yearStart);
  const rangeEnd = getWeekEnd(yearEnd);

  const { data, error } = await supabase
    .from("attendance_records_with_times")
    .select("work_date, check_in_at, check_out_at")
    .eq("employee_id", employeeId)
    .gte("work_date", rangeStart)
    .lte("work_date", rangeEnd)
    .returns<RecordRow[]>();
  if (error) throw new Error(`연간 근태 통계를 불러오지 못했습니다: ${error.message}`);

  const allRecords = data ?? [];

  const monthlyBuckets = new Map<number, number>();
  for (const r of allRecords) {
    if (r.work_date < yearStart || r.work_date > yearEnd) continue;
    const month = Number(r.work_date.slice(5, 7));
    monthlyBuckets.set(month, (monthlyBuckets.get(month) ?? 0) + hoursBetween(r.check_in_at, r.check_out_at));
  }
  const monthlyHours: MonthlyHoursBar[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const hours = monthlyBuckets.get(month) ?? 0;
    return { label: `${month}월`, hours, percent: Math.min(100, (hours / MONTHLY_TARGET_HOURS) * 100) };
  });
  const totalHours = monthlyHours.reduce((sum, m) => sum + m.hours, 0);

  const weekBuckets = new Map<string, number>();
  for (const r of allRecords) {
    const wk = getWeekStart(r.work_date);
    weekBuckets.set(wk, (weekBuckets.get(wk) ?? 0) + hoursBetween(r.check_in_at, r.check_out_at));
  }
  const weeksOver52 = [...weekBuckets.values()].filter((h) => h > WEEKLY_LEGAL_LIMIT_HOURS).length;

  return { monthlyHours, totalHours, weeksOver52 };
}

export type WeekdayHoursEntry = { day: string; hours: string | null };
const WEEKDAY_LABELS_KO = ["월", "화", "수", "목", "금"];

/** S03/S07 홈 "이번 주 근무현황" — 이번 주(월~금) 요일별 근무시간. */
export async function getThisWeekWeekdayHours(employeeId: string): Promise<WeekdayHoursEntry[]> {
  const supabase = createSupabaseAdminClient();
  const weekStart = getWeekStart(todayWorkDateKST());
  const weekFriday = addDays(weekStart, 4);

  const { data, error } = await supabase
    .from("attendance_records_with_times")
    .select("work_date, check_in_at, check_out_at")
    .eq("employee_id", employeeId)
    .gte("work_date", weekStart)
    .lte("work_date", weekFriday)
    .returns<RecordRow[]>();
  if (error) throw new Error(`이번 주 근무현황을 불러오지 못했습니다: ${error.message}`);

  const byDate = new Map((data ?? []).map((r) => [r.work_date, r]));

  return WEEKDAY_LABELS_KO.map((label, i) => {
    const date = addDays(weekStart, i);
    const record = byDate.get(date);
    if (!record?.check_in_at || !record?.check_out_at) return { day: label, hours: null };
    return { day: label, hours: `${Math.round(hoursBetween(record.check_in_at, record.check_out_at))}h` };
  });
}
