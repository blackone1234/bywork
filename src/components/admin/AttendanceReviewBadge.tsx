/**
 * A07 "상태" 컬럼(신규), A08 "비고" 컬럼의 검토필요 표시가 공유하는 뱃지 — Figma
 * get_design_context 실측: rounded-[20px], h-[30px], px-[20px], text-body(14px SemiBold),
 * "검토필요"=status-outside(#ffe09e), "정상"=status-normal(#0dddb1) 두 variant만 확인됨.
 */
export function AttendanceReviewBadge({
  variant,
  children,
}: {
  variant: "pending" | "normal";
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-[30px] shrink-0 items-center justify-center rounded-[20px] px-[var(--space-20)] text-body font-semibold whitespace-nowrap text-black ${
        variant === "pending" ? "bg-status-outside" : "bg-status-normal"
      }`}
    >
      {children}
    </span>
  );
}
