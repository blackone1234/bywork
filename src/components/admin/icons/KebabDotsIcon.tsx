export function KebabDotsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 33 6" fill="none" aria-hidden className={className ?? "h-[6px] w-[33px]"}>
      <circle cx="3" cy="3" r="3" fill="currentColor" />
      <circle cx="16.5" cy="3" r="3" fill="currentColor" />
      <circle cx="30" cy="3" r="3" fill="currentColor" />
    </svg>
  );
}
