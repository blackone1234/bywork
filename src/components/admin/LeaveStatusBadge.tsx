export type LeaveRequestStatus = "대기중" | "승인" | "반려";

const STATUS_STYLES: Record<LeaveRequestStatus, string> = {
  대기중: "bg-status-active text-black",
  승인: "bg-status-work text-black",
  반려: "bg-status-absent text-black",
};

export function LeaveStatusBadge({ status }: { status: LeaveRequestStatus }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[8px] px-[12px] py-[8px] text-[12px] font-semibold tracking-[-0.24px] ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
