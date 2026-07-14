/** S03/S07 주간 누적 근무시간 바 — track(연한 회색) 위에 mint 색 fill. */
export function MobileProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="h-1 w-full rounded-full bg-[var(--mobile-color-track-bg)]">
      <div className="h-1 rounded-full bg-[var(--mobile-color-mint)]" style={{ width: `${clamped}%` }} />
    </div>
  );
}
