import { Badge } from "@/components/admin/Badge";

export type AttendanceState = "근무중" | "외출중" | "휴가중" | "미출근" | "퇴근완료";

/** "퇴근완료" — A01 Figma에 CD가 직접 추가한 5번째 variant(node 226:1777, get_design_context
 * 실측: bg var(--light-gray,#c7c7c7) — 이 프로젝트의 --color-divider와 같은 hex라 그대로
 * 재사용, 텍스트는 다른 배지와 동일하게 검정). */
const STATE_STYLES: Record<AttendanceState, string> = {
  근무중: "bg-status-work text-black",
  외출중: "bg-status-outside text-black",
  휴가중: "bg-status-leave text-black",
  미출근: "bg-status-absent text-black",
  퇴근완료: "bg-divider text-black",
};

export function StatusBadge({ state }: { state: AttendanceState }) {
  return <Badge className={STATE_STYLES[state]}>{state}</Badge>;
}
