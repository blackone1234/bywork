import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertAdminRequest } from "@/lib/admin-guard";
import { formatDateDot } from "@/lib/employees";
import type { LeaveRequestStatus } from "@/components/admin/LeaveStatusBadge";

export type LeaveRequestStatusDb = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveStatusFilter = "all" | LeaveRequestStatusDb;

const STATUS_TO_UI: Record<LeaveRequestStatusDb, LeaveRequestStatus> = {
  pending: "대기중",
  approved: "승인",
  rejected: "반려",
  cancelled: "취소",
};

export type LeaveRequest = {
  id: string;
  employeeName: string;
  leaveType: string;
  date: string;
  status: LeaveRequestStatus;
};

type LeaveRequestQueryRow = {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: LeaveRequestStatusDb;
  employees: { name: string } | null;
};

function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatDateDot(startDate);
  return `${formatDateDot(startDate)} ~ ${formatDateDot(endDate)}`;
}

/** A06 — 휴가승인: 상태(전체/대기중/승인/반려) + 연도 필터로 전체 직원의 신청 목록. */
export async function listLeaveRequests(
  status: LeaveStatusFilter,
  year: number,
): Promise<LeaveRequest[]> {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("leave_requests")
    .select("id, leave_type, start_date, end_date, status, employees(name)")
    .gte("start_date", `${year}-01-01`)
    .lte("start_date", `${year}-12-31`)
    .order("start_date", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query.returns<LeaveRequestQueryRow[]>();

  if (error) throw new Error(`휴가 신청 목록을 불러오지 못했습니다: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    employeeName: row.employees?.name ?? "-",
    leaveType: row.leave_type,
    date: formatDateRange(row.start_date, row.end_date),
    status: STATUS_TO_UI[row.status],
  }));
}
