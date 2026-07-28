import { Badge } from "@/components/admin/Badge";

export type LeaveRequestStatus = "대기중" | "승인" | "반려" | "취소";

const STATUS_STYLES: Record<LeaveRequestStatus, string> = {
  대기중: "bg-status-active text-black",
  승인: "bg-status-work text-black",
  반려: "bg-status-absent text-black",
  // "퇴사"(EmploymentStatusBadge) 배지와 같은 중립 회색 재사용 — 취소도 "종료된, 더는
  // 활성 상태가 아님"이라는 같은 성격이라 새 색상 토큰을 만들지 않는다.
  취소: "bg-status-terminated text-muted",
};

export function LeaveStatusBadge({ status }: { status: LeaveRequestStatus }) {
  return <Badge className={STATUS_STYLES[status]}>{status}</Badge>;
}
