import { Badge } from "@/components/admin/Badge";

export type EmploymentStatus = "재직중" | "휴직중" | "퇴사";

const STATUS_STYLES: Record<EmploymentStatus, string> = {
  재직중: "bg-status-active text-black",
  휴직중: "bg-status-leave text-black",
  퇴사: "bg-status-terminated text-muted",
};

export function EmploymentStatusBadge({ status }: { status: EmploymentStatus }) {
  return <Badge className={STATUS_STYLES[status]}>{status}</Badge>;
}
