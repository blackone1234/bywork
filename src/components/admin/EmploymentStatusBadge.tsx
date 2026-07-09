export type EmploymentStatus = "재직중" | "휴직중" | "퇴사";

const STATUS_STYLES: Record<EmploymentStatus, string> = {
  재직중: "bg-status-active text-black",
  휴직중: "bg-status-leave text-black",
  퇴사: "bg-status-terminated text-muted",
};

export function EmploymentStatusBadge({ status }: { status: EmploymentStatus }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[8px] px-[12px] py-[8px] text-[12px] font-semibold tracking-[-0.24px] ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
