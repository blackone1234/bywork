import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { LeaveType } from "@/lib/leaveTypes";
import { getStandardEndTime } from "@/lib/companySettings";
import { computeLeaveCancelDeadline } from "@/lib/leaveCancellation";

/**
 * S10~S12(휴가현황/신청/내역) 등 직원용 앱 쪽 휴가 로직 — 관리자용 A06 로직
 * (src/lib/leaveRequests.ts의 listLeaveRequests)과 이름이 겹쳐서 별도 파일로 뗐다.
 * LEAVE_TYPES/LeaveType 자체는 leaveTypes.ts에 있다(클라이언트 컴포넌트도 쓰기 때문).
 */
export type { LeaveType };

function isHalfDayType(leaveType: LeaveType): boolean {
  return leaveType !== "연차";
}

export type LeaveBalance = {
  annual: number;
  used: number;
  pending: number;
  remaining: number;
};

/**
 * 잔여 연차 = 총부여 - 이미 승인돼 소진된 일수 - 아직 대기중인 신청의 일수 합.
 * pending도 "잠재적 소비"로 잡아야 대기중인 신청들끼리 합이 총부여를 넘는 걸
 * 신청 시점에 막을 수 있다(사용자 확인받은 방식) — used_leave_days는 승인 시에만
 * 늘어나므로(approve_leave_request RPC) pending을 안 더하면 승인 전까지는 잔여가
 * 실제보다 커 보인다.
 */
export async function getLeaveBalance(employeeId: string): Promise<LeaveBalance> {
  const supabase = createSupabaseAdminClient();

  // 두 쿼리 모두 employeeId만 있으면 되고 서로 결과에 의존하지 않는데 순차 await로
  // 묶여 있던 waterfall — Promise.all로 병렬화.
  const [
    { data: employee, error: employeeError },
    { data: pendingRows, error: pendingError },
  ] = await Promise.all([
    // employees_with_leave — annual_leave_days가 정책(법정 자동계산/관리자 수동입력)에
    // 따라 조회 시점에 계산돼 나온다(20260723000000 마이그레이션). 컬럼명은 employees와
    // 동일해서 이 select 자체는 변경 불필요.
    supabase.from("employees_with_leave").select("annual_leave_days, used_leave_days").eq("id", employeeId).single(),
    supabase.from("leave_requests").select("days").eq("employee_id", employeeId).eq("status", "pending"),
  ]);
  if (employeeError) throw new Error(`잔여 연차를 불러오지 못했습니다: ${employeeError.message}`);
  if (pendingError) throw new Error(`대기중인 신청을 불러오지 못했습니다: ${pendingError.message}`);

  const annual = Number(employee.annual_leave_days);
  const used = Number(employee.used_leave_days);
  const pending = (pendingRows ?? []).reduce((sum, r) => sum + Number(r.days), 0);

  return { annual, used, pending, remaining: annual - used - pending };
}

/** start~end(둘 다 YYYY-MM-DD, 포함) 사이 달력일 수. */
export function calendarDaysBetween(start: string, end: string): number {
  const startMs = new Date(`${start}T00:00:00Z`).getTime();
  const endMs = new Date(`${end}T00:00:00Z`).getTime();
  return Math.round((endMs - startMs) / 86_400_000) + 1;
}

export type SubmitLeaveRequestResult =
  | { ok: true }
  | { ok: false; reason: "invalid_range" | "insufficient_balance" | "overlap"; message: string };

export async function submitLeaveRequest(params: {
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string | null;
}): Promise<SubmitLeaveRequestResult> {
  const { employeeId, leaveType, startDate, endDate, reason } = params;

  if (endDate < startDate) {
    return { ok: false, reason: "invalid_range", message: "종료일이 시작일보다 빠를 수 없습니다." };
  }
  if (isHalfDayType(leaveType) && startDate !== endDate) {
    return { ok: false, reason: "invalid_range", message: "반차는 하루만 신청할 수 있습니다." };
  }

  const days = isHalfDayType(leaveType) ? 0.5 : calendarDaysBetween(startDate, endDate);

  // 승인 로직(approve_leave_request RPC)은 이미 검증 완료 상태라 건드리지 않는다 —
  // 잔여 검증은 신청(제출) 시점에서만 막는다(사용자 확인받은 방식).
  const balance = await getLeaveBalance(employeeId);
  if (days > balance.remaining) {
    return {
      ok: false,
      reason: "insufficient_balance",
      message: `잔여 연차(${balance.remaining}일)가 부족합니다.`,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("leave_requests").insert({
    employee_id: employeeId,
    leave_type: leaveType,
    start_date: startDate,
    end_date: endDate,
    days,
    reason: reason || null,
  });

  if (error) {
    // 20260716010000 마이그레이션의 EXCLUDE 제약 위반 — 같은 직원의 겹치는 기간에
    // 이미 pending/approved 요청이 있을 때. 앱 코드로 먼저 겹침을 SELECT해서 막는
    // 방식은 두 요청이 거의 동시에 들어오면 둘 다 통과할 수 있어서, DB가 최종
    // 방어선이다 — 여기서는 그 위반을 사용자 메시지로만 번역한다.
    if (error.code === "23P01") {
      return { ok: false, reason: "overlap", message: "같은 기간에 이미 신청한 휴가가 있습니다." };
    }
    throw new Error(`휴가 신청에 실패했습니다: ${error.message}`);
  }

  return { ok: true };
}

export type LeaveRequestStatusDb = "pending" | "approved" | "rejected" | "cancelled";

export type MyLeaveRequestRow = {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveRequestStatusDb;
  requestedAt: string;
  /** 취소 버튼 노출 여부 — pending/approved이고 컷오프(leaveCancellation.ts) 이전일 때만
   * true. 최종 강제는 항상 cancel_leave_request RPC가 하므로 이 값은 UI 표시용. */
  canCancel: boolean;
};

export async function listMyLeaveRequests(employeeId: string): Promise<MyLeaveRequestRow[]> {
  const supabase = createSupabaseAdminClient();

  // 두 쿼리 모두 employeeId 없이도 독립적으로 시작 가능 — Promise.all로 병렬화
  // (standardEndTime은 행마다 컷오프를 계산하는 데 공통으로 쓰이므로 한 번만 조회).
  const [{ data, error }, standardEndTime] = await Promise.all([
    supabase
      .from("leave_requests")
      .select("id, leave_type, start_date, end_date, days, status, requested_at")
      .eq("employee_id", employeeId)
      .order("requested_at", { ascending: false }),
    getStandardEndTime(),
  ]);

  if (error) throw new Error(`휴가 내역을 불러오지 못했습니다: ${error.message}`);

  const now = Date.now();

  return (data ?? []).map((r) => {
    const status = r.status as LeaveRequestStatusDb;
    const isCancellableStatus = status === "pending" || status === "approved";
    const canCancel =
      isCancellableStatus && now <= computeLeaveCancelDeadline(r.start_date, standardEndTime).getTime();
    return {
      id: r.id,
      leaveType: r.leave_type,
      startDate: r.start_date,
      endDate: r.end_date,
      days: Number(r.days),
      status,
      requestedAt: r.requested_at,
      canCancel,
    };
  });
}

export type CancelLeaveRequestResult = { ok: true } | { ok: false; message: string };

/** S10/S12 취소 버튼 — 본인 요청인지 서버에서 재확인(타인 요청 취소 방지, 이 프로젝트
 * 전반의 직원별 데이터 격리 원칙) 후 cancel_leave_request RPC 호출. 관리자와 달리
 * p_bypass_deadline은 항상 false(직원 셀프취소는 컷오프 적용, CD 확정). */
export async function cancelMyLeaveRequest(
  employeeId: string,
  requestId: string,
  reason: string | null,
): Promise<CancelLeaveRequestResult> {
  const supabase = createSupabaseAdminClient();

  const { data: request, error: fetchError } = await supabase
    .from("leave_requests")
    .select("employee_id")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) return { ok: false, message: "휴가 신청을 찾을 수 없습니다." };
  if (request.employee_id !== employeeId) return { ok: false, message: "본인의 신청만 취소할 수 있습니다." };

  const { error } = await supabase.rpc("cancel_leave_request", {
    p_request_id: requestId,
    p_actor_employee_id: employeeId,
    p_reason: reason,
    p_bypass_deadline: false,
  });

  if (error) {
    if (error.message.includes("cancel_deadline_passed")) {
      return { ok: false, message: "취소 가능 시점이 지났습니다(연차 시작일 전날 근무시간까지만 취소할 수 있습니다)." };
    }
    if (error.message.includes("already_finalized")) {
      return { ok: false, message: "이미 처리된 신청입니다." };
    }
    return { ok: false, message: `휴가 취소에 실패했습니다: ${error.message}` };
  }

  return { ok: true };
}
