type IconProps = { className?: string };

/**
 * Figma get_design_context로 받은 실제 SVG(각 노드의 asset URL)에서 path/viewBox/stroke-width를
 * 그대로 옮겨온 아이콘 세트 — 이전에 손으로 그렸던 플레이스홀더 대신 실물이다.
 * 색은 fill/stroke="var(--fill-0/--stroke-0, ...)"를 currentColor로 바꿔서, 기존처럼
 * 부모 요소의 text color(className/style)로 그대로 제어된다.
 */

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 21.8182 21.8182" fill="none" stroke="currentColor" strokeWidth="1.81818" strokeLinejoin="round" aria-hidden className={className ?? "size-5"}>
      <path d="M5.45455 15.4545H16.3636M0.909091 7.27273V20.9091H20.9091V7.27273L10.9091 0.909091L0.909091 7.27273Z" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 21.7391 20.8696" fill="none" stroke="currentColor" strokeWidth="1.73913" strokeLinejoin="round" aria-hidden className={className ?? "h-5 w-[19px]"}>
      <path d="M6.32411 0V2.6087M6.32411 2.6087V5.21739M6.32411 2.6087H0.869565V7.82609M6.32411 2.6087H15.415M15.415 0V2.6087M15.415 2.6087V5.21739M15.415 2.6087H20.8696V7.82609M0.869565 7.82609H20.8696M0.869565 7.82609V20H20.8696V7.82609M5.41502 11.3043V13.0435M10.8696 11.3043V13.0435M16.3241 11.3043V13.0435M16.3241 14.7826V16.5217M10.8696 14.7826V16.5217M5.41502 14.7826V16.5217" />
    </svg>
  );
}

export function LeaveIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 19 20" fill="currentColor" aria-hidden className={className ?? "size-5"}>
      <path d="M11 6.947L19 12V14L11 11.474V16.834L14 18.5V20L9.5 19L5 20V18.5L8 16.833V11.473L0 14V12L8 6.947V1.5C8 1.10218 8.15804 0.720644 8.43934 0.43934C8.72064 0.158035 9.10218 0 9.5 0C9.89782 0 10.2794 0.158035 10.5607 0.43934C10.842 0.720644 11 1.10218 11 1.5V6.947Z" />
    </svg>
  );
}

export function StatsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className ?? "size-5"}>
      <path d="M0 11.1111H6V20H0V11.1111ZM14 5.55556H20V20H14V5.55556ZM7 0H13V20H7V0ZM2 13.3333V17.7778H4V13.3333H2ZM9 2.22222V17.7778H11V2.22222H9ZM16 7.77778V17.7778H18V7.77778H16Z" />
    </svg>
  );
}

export function MyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className ?? "size-5"}>
      <path d="M10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20ZM10 18C12.1217 18 14.1566 17.1571 15.6569 15.6569C17.1571 14.1566 18 12.1217 18 10C18 7.87827 17.1571 5.84344 15.6569 4.34315C14.1566 2.84285 12.1217 2 10 2C7.87827 2 5.84344 2.84285 4.34315 4.34315C2.84285 5.84344 2 7.87827 2 10C2 12.1217 2.84285 14.1566 4.34315 15.6569C5.84344 17.1571 7.87827 18 10 18V18ZM6 11H14C14 12.0609 13.5786 13.0783 12.8284 13.8284C12.0783 14.5786 11.0609 15 10 15C8.93913 15 7.92172 14.5786 7.17157 13.8284C6.42143 13.0783 6 12.0609 6 11V11ZM6 9C5.60218 9 5.22064 8.84196 4.93934 8.56066C4.65804 8.27936 4.5 7.89782 4.5 7.5C4.5 7.10218 4.65804 6.72064 4.93934 6.43934C5.22064 6.15804 5.60218 6 6 6C6.39782 6 6.77936 6.15804 7.06066 6.43934C7.34196 6.72064 7.5 7.10218 7.5 7.5C7.5 7.89782 7.34196 8.27936 7.06066 8.56066C6.77936 8.84196 6.39782 9 6 9ZM14 9C13.6022 9 13.2206 8.84196 12.9393 8.56066C12.658 8.27936 12.5 7.89782 12.5 7.5C12.5 7.10218 12.658 6.72064 12.9393 6.43934C13.2206 6.15804 13.6022 6 14 6C14.3978 6 14.7794 6.15804 15.0607 6.43934C15.342 6.72064 15.5 7.10218 15.5 7.5C15.5 7.89782 15.342 8.27936 15.0607 8.56066C14.7794 8.84196 14.3978 9 14 9Z" />
    </svg>
  );
}

/** 뒤로가기 화살표(S02/S09/S11/S12/S15/S16 등) — 실제 크기 22.14x22.14, size-5(20px)로 렌더. */
export function BackChevronIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22.1429 22.1429" fill="none" stroke="currentColor" strokeWidth="2.14286" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className ?? "size-5"}>
      <path d="M21.0714 11.0714H1.07143M11.0714 1.07143L1.07143 11.0714L11.0714 21.0714" />
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

/**
 * S08 캘린더 등 월 이동 화살표 — 실제 Figma 인스턴스 크기가 세로로 긴 6x12(원본 viewBox
 * 8.4x14.4)라, 기존에 12x12 정사각형으로 썼던 게 화살표 모양/비율이 아예 틀렸다.
 */
export function PagerChevronIcon({ className, direction = "left" }: IconProps & { direction?: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 8.4 14.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className ?? "h-3 w-[6px]"}
      style={direction === "right" ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M7.2 1.2 1.2 7.2l6 6" />
    </svg>
  );
}

export function BellIcon({ className, hasAlert = false }: IconProps & { hasAlert?: boolean }) {
  return (
    <svg viewBox="0 0 15.814 20" fill="currentColor" overflow="visible" aria-hidden className={className ?? "h-5 w-[15.814px]"}>
      <path d="M15.3488 15.5042L15.7209 16C15.7728 16.0691 15.8043 16.1513 15.8121 16.2373C15.8198 16.3233 15.8035 16.4098 15.7648 16.4871C15.7262 16.5643 15.6668 16.6293 15.5934 16.6747C15.5199 16.7201 15.4352 16.7442 15.3488 16.7442H0.465116C0.378739 16.7442 0.294068 16.7201 0.22059 16.6747C0.147113 16.6293 0.087733 16.5643 0.0491038 16.4871C0.0104745 16.4098 -0.00587758 16.3233 0.00187961 16.2373C0.00963681 16.1513 0.0411968 16.0691 0.0930234 16L0.465116 15.5042V7.44186C0.465116 5.46816 1.24917 3.57529 2.64479 2.17967C4.04041 0.784051 5.93327 0 7.90698 0C9.88068 0 11.7735 0.784051 13.1692 2.17967C14.5648 3.57529 15.3488 5.46816 15.3488 7.44186V15.5042ZM5.5814 17.6744H10.2326C10.2326 18.2912 9.98754 18.8827 9.55141 19.3189C9.11528 19.755 8.52376 20 7.90698 20C7.29019 20 6.69867 19.755 6.26254 19.3189C5.82641 18.8827 5.5814 18.2912 5.5814 17.6744V17.6744Z" />
      {/* Figma 알림 점 실측: 8×8원, #D91E1E — 사용자가 스크린샷으로 직접 지적해서 수정. */}
      {hasAlert ? <circle cx="13" cy="4" r="4" fill="var(--mobile-color-notification)" /> : null}
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
