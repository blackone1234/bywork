export type AttendanceState = "근무중" | "외출중" | "휴가중" | "미출근";

const STATE_STYLES: Record<AttendanceState, string> = {
  근무중: "bg-status-work",
  외출중: "bg-status-outside",
  휴가중: "bg-status-leave",
  미출근: "bg-status-absent",
};

export function StatusBadge({ state }: { state: AttendanceState }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[8px] px-[12px] py-[8px] text-[12px] font-semibold tracking-[-0.24px] text-black ${STATE_STYLES[state]}`}
    >
      {state}
    </span>
  );
}
