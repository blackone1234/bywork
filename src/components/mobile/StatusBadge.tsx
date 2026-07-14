/** S10/S12(휴가 내역)의 상태 뱃지, S08/S09(캘린더/근태 상세)의 근태 상태 뱃지가 공유하는 색상 규칙. */
export type MobileStatus = "pending" | "approved" | "rejected" | "normal" | "late" | "leave";

const STATUS_CLASSNAME: Record<MobileStatus, string> = {
  pending: "bg-[var(--mobile-color-state-late)]",
  approved: "bg-[var(--mobile-color-state-work)]",
  rejected: "bg-[var(--mobile-color-state-holiday)]",
  normal: "bg-[var(--mobile-color-state-work)]",
  late: "bg-[var(--mobile-color-state-late)]",
  leave: "bg-[var(--mobile-color-state-leave)]",
};

export function MobileStatusBadge({ status, children }: { status: MobileStatus; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-[var(--mobile-radius-chip)] px-[var(--mobile-space-16)] py-[var(--mobile-space-8)] text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-black)] ${STATUS_CLASSNAME[status]}`}
    >
      {children}
    </span>
  );
}

/**
 * S03~S07 홈 화면 상태 뱃지. 5개 상태 중 "근무중"(S04)만 filled(흰 배경/검은 글자)로
 * 강조되고, 나머지(출근전·외출중·외근중·퇴근완료)는 전부 outline(테두리만) 스타일이다 —
 * get_design_context로 5개 상태를 전부 대조해서 확인한 규칙.
 */
export function MobileHeaderBadge({
  children,
  variant = "outline",
}: {
  children: React.ReactNode;
  variant?: "filled" | "outline";
}) {
  return (
    <span
      // Figma의 5개 상태 배지가 전부 고정 폭 67px — auto-width로 두면 "출근전" 같은
      // 3글자 라벨이 62px로 좁게 나온다(실측 확인).
      className={`inline-flex w-[67px] shrink-0 items-center justify-center rounded-[var(--mobile-radius-badge)] px-[15px] py-[var(--mobile-space-8)] text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] ${
        variant === "filled"
          ? "bg-[var(--mobile-color-white)] text-[var(--mobile-color-black)]"
          : "border border-[var(--mobile-color-light-gray)] text-[var(--mobile-color-light-gray)]"
      }`}
    >
      {children}
    </span>
  );
}
