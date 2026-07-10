export function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 10 5"
      fill="none"
      aria-hidden
      className={className ?? "size-[10px]"}
    >
      <path d="M5 5L0 0H10L5 5Z" fill="currentColor" />
    </svg>
  );
}
