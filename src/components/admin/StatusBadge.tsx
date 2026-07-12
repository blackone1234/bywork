import { Badge } from "@/components/admin/Badge";

export type AttendanceState = "근무중" | "외출중" | "휴가중" | "미출근";

const STATE_STYLES: Record<AttendanceState, string> = {
  근무중: "bg-status-work text-black",
  외출중: "bg-status-outside text-black",
  휴가중: "bg-status-leave text-black",
  미출근: "bg-status-absent text-black",
};

export function StatusBadge({ state }: { state: AttendanceState }) {
  return <Badge className={STATE_STYLES[state]}>{state}</Badge>;
}
