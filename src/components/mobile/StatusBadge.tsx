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

/** S03/S07 어두운 홈 헤더 위에 얹히는 흰 필 뱃지 — 출근전/근무중/외출중/퇴근완료. */
export function MobileHeaderBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-[var(--mobile-radius-badge)] bg-[var(--mobile-color-white)] px-[15px] py-[var(--mobile-space-8)] text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-black)]">
      {children}
    </span>
  );
}
