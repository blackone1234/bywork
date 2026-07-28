import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertAdminRequest } from "@/lib/admin-guard";
import { todayWorkDateKST, type AttendanceEventType } from "@/lib/attendanceEvents";
import { formatDateDot } from "@/lib/employees";
import type { AttendanceState } from "@/components/admin/StatusBadge";

/** "현재상태"는 attendance_records.status(한번 외출하면 그날 내내 'remote'로 고정되는
 * 히스토리성 플래그 — A08 "비고" 컬럼은 이 값을 그대로 쓰는 게 맞다, 그날 있었던 일의
 * 요약이니까)가 아니라, 모바일 홈(S03~S07)과 동일하게 **오늘의 마지막 확정 이벤트**로
 * 판정해야 한다 — 그래야 외출 후 복귀·퇴근까지 마친 직원이 계속 "외출중"으로 잘못
 * 보이는 문제가 없다(실사용 중 발견된 버그, src/app/m/page.tsx의 LAST_EVENT_TO_STATE와
 * 같은 원리). check_out은 "퇴근완료"(CD가 Figma에 직접 추가한 5번째 variant, node
 * 226:1777)로 매핑 — 처음엔 관리자 배지가 4종뿐이라 "근무중"으로 합쳤었는데, 모바일
 * 앱은 "퇴근후"로 구분해서 보여주는데 대시보드만 "근무중"으로 뭉뚱그려서 두 화면이
 * 안 맞는다는 지적을 받고 Figma에 전용 배지가 추가된 것 확인 후 반영.
 */
const EVENT_TO_STATE: Record<AttendanceEventType | "none", AttendanceState> = {
  none: "미출근",
  check_in: "근무중",
  return: "근무중",
  go_out_personal: "외출중",
  go_out_business: "외출중",
  check_out: "퇴근완료",
};

/** 근로기준법 주 52시간 — S14(연간 통계)의 WEEKLY_LEGAL_LIMIT_HOURS와 동일 값. */
const WEEKLY_LEGAL_LIMIT_HOURS = 52;

/** Monday(YYYY-MM-DD) of the ISO week containing workDate — attendance.ts/
 * employeeAttendanceStats.ts와 동일한 로직(파일별로 각자 갖고 있는 기존 관례를 따름). */
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

function hoursBetween(checkInAt: string | null, checkOutAt: string | null): number {
  if (!checkInAt || !checkOutAt) return 0;
  return (new Date(checkOutAt).getTime() - new Date(checkInAt).getTime()) / 3_600_000;
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

export type DashboardStats = {
  total: number;
  working: number;
  outing: number;
  onLeave: number;
  notCheckedIn: number;
};

export type DashboardAttendanceRow = {
  id: string;
  name: string;
  state: AttendanceState;
  checkIn: string;
  checkOut: string;
  outing: string;
  weeklyHours: string;
};

export type DashboardData = {
  todayLabel: string;
  stats: DashboardStats;
  rows: DashboardAttendanceRow[];
  pendingLeaveCount: number;
  weeklyOverLimitCount: number;
};

type EmployeeRow = { id: string; name: string };
type WeekRecordRow = {
  employee_id: string;
  work_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
};
type TodayRecordRow = { id: string; employee_id: string };
type EventRow = { attendance_record_id: string; event_type: AttendanceEventType; occurred_at: string };
type ApprovedLeaveRow = { employee_id: string };

/** A01 — 대시보드: 상단 5개 카드 + "오늘 근무 현황" 테이블 + 안내 배너를 한 번에 계산한다. */
export async function getDashboardData(): Promise<DashboardData> {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const today = todayWorkDateKST();
  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(today);

  const [employeesResult, weekResult, todayRecordsResult, approvedLeaveResult, pendingLeaveResult] =
    await Promise.all([
      supabase
        .from("employees")
        .select("id, name")
        .eq("employment_status", "active")
        .order("hire_date", { ascending: true })
        .returns<EmployeeRow[]>(),
      // 체크인/체크아웃 "시각" 표시와 주간 근무시간 합산용(현재상태 판정에는 안 씀).
      supabase
        .from("attendance_records_with_times")
        .select("employee_id, work_date, check_in_at, check_out_at")
        .gte("work_date", weekStart)
        .lte("work_date", weekEnd)
        .returns<WeekRecordRow[]>(),
      // 오늘자 레코드 id — 이벤트 조회의 입력으로만 쓰고 status 컬럼은 더 이상 참조하지 않는다.
      supabase.from("attendance_records").select("id, employee_id").eq("work_date", today).returns<TodayRecordRow[]>(),
      // "휴가중"은 attendance_records.status='on_leave'가 아니라(이 값은 어떤 코드
      // 경로에서도 실제로 set되지 않는 죽은 값 — grep으로 재확인) 승인된 휴가 신청
      // 기간에 오늘이 들어가는지로 판정한다.
      supabase
        .from("leave_requests")
        .select("employee_id")
        .eq("status", "approved")
        .lte("start_date", today)
        .gte("end_date", today)
        .returns<ApprovedLeaveRow[]>(),
      supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);

  if (employeesResult.error) {
    throw new Error(`직원 목록을 불러오지 못했습니다: ${employeesResult.error.message}`);
  }
  if (weekResult.error) {
    throw new Error(`근태 데이터를 불러오지 못했습니다: ${weekResult.error.message}`);
  }
  if (todayRecordsResult.error) {
    throw new Error(`오늘자 근태 레코드를 불러오지 못했습니다: ${todayRecordsResult.error.message}`);
  }
  if (approvedLeaveResult.error) {
    throw new Error(`휴가 현황을 불러오지 못했습니다: ${approvedLeaveResult.error.message}`);
  }
  if (pendingLeaveResult.error) {
    throw new Error(`휴가 신청 현황을 불러오지 못했습니다: ${pendingLeaveResult.error.message}`);
  }

  const employees = employeesResult.data ?? [];
  const weekRecords = weekResult.data ?? [];
  const todayRecords = todayRecordsResult.data ?? [];

  const todayTimesByEmployee = new Map<string, WeekRecordRow>();
  const weeklyHoursByEmployee = new Map<string, number>();
  for (const record of weekRecords) {
    if (record.work_date === today) {
      todayTimesByEmployee.set(record.employee_id, record);
    }
    const hours = hoursBetween(record.check_in_at, record.check_out_at);
    if (hours > 0) {
      weeklyHoursByEmployee.set(record.employee_id, (weeklyHoursByEmployee.get(record.employee_id) ?? 0) + hours);
    }
  }

  // 오늘자 레코드의 마지막 확정 이벤트 타입을 직원별로 찾는다(모바일 getTodayAttendanceState와
  // 동일한 방식 — 검토대기중 이벤트는 review_status='confirmed'가 아니므로 여기서도 제외).
  const recordIdToEmployeeId = new Map(todayRecords.map((r) => [r.id, r.employee_id]));
  const recordIds = todayRecords.map((r) => r.id);

  const lastEventByEmployee = new Map<string, AttendanceEventType>();
  if (recordIds.length > 0) {
    const { data: events, error: eventsError } = await supabase
      .from("attendance_events")
      .select("attendance_record_id, event_type, occurred_at")
      .in("attendance_record_id", recordIds)
      .eq("review_status", "confirmed")
      .order("occurred_at", { ascending: true })
      .returns<EventRow[]>();
    if (eventsError) throw new Error(`오늘자 근태 이벤트를 불러오지 못했습니다: ${eventsError.message}`);

    for (const event of events ?? []) {
      const employeeId = recordIdToEmployeeId.get(event.attendance_record_id);
      if (employeeId) lastEventByEmployee.set(employeeId, event.event_type);
    }
  }

  const onLeaveEmployeeIds = new Set((approvedLeaveResult.data ?? []).map((r) => r.employee_id));

  let working = 0;
  let outing = 0;
  let onLeave = 0;

  const rows: DashboardAttendanceRow[] = employees.map((employee) => {
    const todayTimes = todayTimesByEmployee.get(employee.id);
    const lastEvent = lastEventByEmployee.get(employee.id) ?? "none";
    const state: AttendanceState = onLeaveEmployeeIds.has(employee.id) ? "휴가중" : EVENT_TO_STATE[lastEvent];

    // "출근중" 카드는 5개뿐(퇴근완료 전용 카드가 없음) — 그날 출근해서 정상적으로
    // 마친 직원도 "출근" 관점에서는 이 카드에 포함되는 게 맞다(미출근/외출/휴가
    // 어디에도 안 속하므로).
    if (state === "근무중" || state === "퇴근완료") working += 1;
    else if (state === "외출중") outing += 1;
    else if (state === "휴가중") onLeave += 1;

    const weeklyHours = weeklyHoursByEmployee.get(employee.id) ?? 0;

    return {
      id: employee.id,
      name: employee.name,
      state,
      checkIn: formatTimeKST(todayTimes?.check_in_at ?? null),
      checkOut: formatTimeKST(todayTimes?.check_out_at ?? null),
      // "외출/외근" 컬럼 — 현재상태 배지와 별개 컬럼이지만 Figma 실측상 같은 텍스트를
      // 그대로 다시 보여준다(외출중이 아니면 "-"). 상태 배지(State)와 문구가 겹치는
      // 건 Figma 원본도 동일하게 중복 표기하고 있어 의도된 디자인으로 판단.
      outing: state === "외출중" ? "외출중" : "-",
      // A07의 weeklyHours 포맷과 동일하게 0h도 그대로 "Nh"로 표시한다("-"로 감추지
      // 않음) — 두 화면의 같은 직원/같은 주 값이 항상 문자 그대로 일치해야 하므로.
      weeklyHours: `${Math.round(weeklyHours)}h`,
    };
  });

  const total = employees.length;
  const notCheckedIn = total - working - outing - onLeave;

  const weeklyOverLimitCount = employees.filter(
    (employee) => (weeklyHoursByEmployee.get(employee.id) ?? 0) > WEEKLY_LEGAL_LIMIT_HOURS,
  ).length;

  return {
    todayLabel: formatDateDot(today),
    stats: { total, working, outing, onLeave, notCheckedIn },
    rows,
    pendingLeaveCount: pendingLeaveResult.count ?? 0,
    weeklyOverLimitCount,
  };
}
