type IconProps = { className?: string };

/**
 * S01~S16 프레임의 원본 SVG는 Figma 임시 자산 URL(7일 만료)이라 그대로 담을 수 없다.
 * 화면별 퍼블리싱 단계에서 실제 아이콘을 내보내 교체하기 전까지 쓰는 최소 라인 아이콘 세트.
 */

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className ?? "size-5"}>
      <path d="M2.5 8.5 10 2.5l7.5 6" />
      <path d="M4.5 7.5V17h11V7.5" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className ?? "size-5"}>
      <rect x="2.5" y="4" width="15" height="13.5" rx="2" />
      <path d="M2.5 8h15M6.5 2v3.5M13.5 2v3.5" />
    </svg>
  );
}

export function LeaveIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className ?? "size-5"}>
      <path d="M2 18 12.5 2.5c1-1.4 3.1-1.1 3.6.6.3 1-.1 2-.9 2.6L2 18Z" />
    </svg>
  );
}

export function StatsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className ?? "size-5"}>
      <path d="M3 17.5h14M6 17.5V9M10.5 17.5V3M15 17.5v-6" />
    </svg>
  );
}

export function MyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className ?? "size-5"}>
      <circle cx="10" cy="6.5" r="3.5" />
      <path d="M3 17.5c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
    </svg>
  );
}

export function BackChevronIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className ?? "size-5"}>
      <path d="M12.5 4 6 10l6.5 6" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className ?? "size-2"}>
      <path d="M1 1l6 6-6 6" />
    </svg>
  );
}

export function PagerChevronIcon({ className, direction = "left" }: IconProps & { direction?: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 8 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className ?? "size-3"}
      style={direction === "right" ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M7 1 1 7l6 6" />
    </svg>
  );
}

export function BellIcon({ className, hasAlert = false }: IconProps & { hasAlert?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className ?? "size-5"}>
      <path d="M4 15.5h12l-1.5-2.2V9a4.5 4.5 0 0 0-9 0v4.3L4 15.5Z" />
      <path d="M8.5 17.5a1.7 1.7 0 0 0 3 0" />
      {hasAlert ? <circle cx="15" cy="4.5" r="2.5" fill="var(--mobile-color-state-holiday)" stroke="none" /> : null}
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className ?? "size-5"}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.5V10l3 2" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden className={className ?? "size-2.5"}>
      <path d="M6 1v10M1 6h10" />
    </svg>
  );
}
