import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertAdminRequest } from "@/lib/admin-guard";
import { formatDateDot } from "@/lib/employees";

export type AttendanceStatusDb = "present" | "remote" | "absent" | "on_leave";

const NOTE_FALLBACK: Record<AttendanceStatusDb, string> = {
  present: "정상",
  remote: "외출/외근",
  on_leave: "승인된 연차",
  absent: "-",
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${pad2(month)}-01`;
}

/** month is 1-indexed, matching how the UI/URL params use it. */
function lastDayOfMonth(year: number, month: number): string {
  const nextMonthFirst =
    month === 12 ? `${year + 1}-01-01` : `${year}-${pad2(month + 1)}-01`;
  const d = new Date(`${nextMonthFirst}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Monday (as "YYYY-MM-DD") of the ISO week containing the given date. */
function getWeekStartKey(workDate: string): string {
  const d = new Date(`${workDate}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d.toISOString().slice(0, 10);
}

function formatTimeKST(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function hoursBetween(checkInAt: string | null, checkOutAt: string | null): number {
  if (!checkInAt || !checkOutAt) return 0;
  return (new Date(checkOutAt).getTime() - new Date(checkInAt).getTime()) / 3_600_000;
}

export type MonthlyAttendanceRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  weeklyHours: string;
};

type MonthlyQueryRow = {
  id: string;
  employee_id: string;
  work_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  employees: { name: string } | null;
};

/** A07 — 근태 데이터: 전체 직원의 선택된 월 기록. */
export async function listMonthlyAttendance(
  year: number,
  month: number,
): Promise<MonthlyAttendanceRow[]> {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("attendance_records")
    .select("id, employee_id, work_date, check_in_at, check_out_at, employees(name)")
    .gte("work_date", firstDayOfMonth(year, month))
    .lte("work_date", lastDayOfMonth(year, month))
    .order("work_date", { ascending: false })
    .returns<MonthlyQueryRow[]>();

  if (error) throw new Error(`근태 데이터를 불러오지 못했습니다: ${error.message}`);

  const records = data ?? [];

  // 주간근무시간은 같은 달 안에서 조회된 기록만으로 월~일 단위 합산한다. 월 경계에 걸친
  // 주(예: 1일이 수요일이면 그 주의 월~화는 전달 데이터)는 전달 기록을 포함하지 않아
  // 실제보다 적게 나올 수 있다 — 알려진 단순화이며 정확한 값을 원하면 개선이 필요하다.
  const weeklyHoursByKey = new Map<string, number>();
  for (const row of records) {
    const hours = hoursBetween(row.check_in_at, row.check_out_at);
    if (hours <= 0) continue;
    const key = `${row.employee_id}_${getWeekStartKey(row.work_date)}`;
    weeklyHoursByKey.set(key, (weeklyHoursByKey.get(key) ?? 0) + hours);
  }

  return records.map((row) => {
    const key = `${row.employee_id}_${getWeekStartKey(row.work_date)}`;
    return {
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employees?.name ?? "-",
      date: formatDateDot(row.work_date),
      checkIn: formatTimeKST(row.check_in_at),
      checkOut: formatTimeKST(row.check_out_at),
      weeklyHours: `${Math.round(weeklyHoursByKey.get(key) ?? 0)}h`,
    };
  });
}

export type AttendanceDetailRow = {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  note: string;
};

export type AttendanceStats = {
  totalWorkDays: string;
  totalWorkHours: string;
  usedLeaveDays: string;
  absentDays: string;
};

type DetailQueryRow = {
  id: string;
  work_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: AttendanceStatusDb;
  note: string | null;
};

/** A08 — 근태상세: 화면에 선택된 그 직원 1명의 선택된 월 기록 + 통계 카드 4개. */
export async function getEmployeeAttendanceDetail(
  employeeId: string,
  year: number,
  month: number,
): Promise<{ rows: AttendanceDetailRow[]; stats: AttendanceStats }> {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("attendance_records")
    .select("id, work_date, check_in_at, check_out_at, status, note")
    .eq("employee_id", employeeId)
    .gte("work_date", firstDayOfMonth(year, month))
    .lte("work_date", lastDayOfMonth(year, month))
    .order("work_date", { ascending: false })
    .returns<DetailQueryRow[]>();

  if (error) throw new Error(`근태 상세를 불러오지 못했습니다: ${error.message}`);

  const records = data ?? [];

  const totalWorkDays = records.filter((row) => row.check_in_at).length;
  const totalWorkHours = records.reduce(
    (sum, row) => sum + hoursBetween(row.check_in_at, row.check_out_at),
    0,
  );
  const usedLeaveDays = records.filter((row) => row.status === "on_leave").length;
  const absentDays = records.filter((row) => row.status === "absent").length;

  return {
    rows: records.map((row) => ({
      id: row.id,
      date: formatDateDot(row.work_date),
      checkIn: formatTimeKST(row.check_in_at),
      checkOut: formatTimeKST(row.check_out_at),
      note: row.note?.trim() || NOTE_FALLBACK[row.status],
    })),
    stats: {
      totalWorkDays: `${totalWorkDays}일`,
      totalWorkHours: `${Math.round(totalWorkHours)}h`,
      usedLeaveDays: `${usedLeaveDays}일`,
      absentDays: `${absentDays}일`,
    },
  };
}
