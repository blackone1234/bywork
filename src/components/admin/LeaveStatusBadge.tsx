import { Badge } from "@/components/admin/Badge";

export type LeaveRequestStatus = "대기중" | "승인" | "반려";

const STATUS_STYLES: Record<LeaveRequestStatus, string> = {
  대기중: "bg-status-active text-black",
  승인: "bg-status-work text-black",
  반려: "bg-status-absent text-black",
};

export function LeaveStatusBadge({ status }: { status: LeaveRequestStatus }) {
  return <Badge className={STATUS_STYLES[status]}>{status}</Badge>;
}
