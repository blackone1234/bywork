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

/** S04~S07 "경과 N시간" 옆 시계 아이콘 — 손그림 대신 Figma 실제 path(icon_time). */
export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className ?? "size-5"}>
      <path d="M10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20ZM10 18C12.1217 18 14.1566 17.1571 15.6569 15.6569C17.1571 14.1566 18 12.1217 18 10C18 7.87827 17.1571 5.84344 15.6569 4.34315C14.1566 2.84285 12.1217 2 10 2C7.87827 2 5.84344 2.84285 4.34315 4.34315C2.84285 5.84344 2 7.87827 2 10C2 12.1217 2.84285 14.1566 4.34315 15.6569C5.84344 17.1571 7.87827 18 10 18ZM11 10H15V12H9V5H11V10Z" />
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

/** "검토대기중 N건" 배지(S04~S07 홈 마크, S13 통계 배너) 전용 12×12 시계 아이콘 —
 * ClockIcon과는 다른 별개 path(alarm-clock 스타일, 위쪽 틱 마크 있음). */
export function PendingReviewClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden className={className ?? "size-3"}>
      <path d="M6 10.8083C4.88609 10.8083 3.8178 10.3689 3.03015 9.58674C2.2425 8.80456 1.8 7.7437 1.8 6.63754C1.8 5.53137 2.2425 4.47051 3.03015 3.68833C3.8178 2.90616 4.88609 2.46673 6 2.46673C7.11391 2.46673 8.1822 2.90616 8.96985 3.68833C9.7575 4.47051 10.2 5.53137 10.2 6.63754C10.2 7.7437 9.7575 8.80456 8.96985 9.58674C8.1822 10.3689 7.11391 10.8083 6 10.8083ZM6 1.27507C4.56783 1.27507 3.19432 1.84005 2.18162 2.8457C1.16893 3.85136 0.6 5.21532 0.6 6.63754C0.6 8.05975 1.16893 9.42371 2.18162 10.4294C3.19432 11.435 4.56783 12 6 12C7.43217 12 8.80568 11.435 9.81838 10.4294C10.8311 9.42371 11.4 8.05975 11.4 6.63754C11.4 5.21532 10.8311 3.85136 9.81838 2.8457C8.80568 1.84005 7.43217 1.27507 6 1.27507V1.27507ZM6.3 3.65839H5.4V7.23337L8.25 8.93148L8.7 8.19861L6.3 6.78649V3.65839ZM3.528 0.911619L2.76 0L0 2.29394L0.774 3.20556L3.528 0.911619ZM12 2.2999L9.24 0L8.466 0.911619L11.226 3.21152L12 2.2999Z" />
    </svg>
  );
}

/** M1(인증 실패 시 사유 입력 시트) 상단 위치 핀 아이콘 — accent 노랑 고정색(Figma fill 값). */
export function LocationPinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 34 40" fill="none" aria-hidden className={className ?? "h-10 w-[33.137px]"}>
      <path
        d="M28.2844 28.2842L16.5686 40L4.85275 28.2842C2.53562 25.967 0.957637 23.0148 0.318353 19.8008C-0.320932 16.5869 0.0071923 13.2555 1.26123 10.228C2.51527 7.20049 4.6389 4.61285 7.36358 2.79229C10.0883 0.971723 13.2916 0 16.5686 0C19.8455 0 23.0488 0.971723 25.7735 2.79229C28.4982 4.61285 30.6218 7.20049 31.8759 10.228C33.1299 13.2555 33.458 16.5869 32.8187 19.8008C32.1795 23.0148 30.6015 25.967 28.2844 28.2842ZM16.5686 20.2503C17.545 20.2503 18.4816 19.8624 19.172 19.1719C19.8625 18.4814 20.2504 17.5449 20.2504 16.5684C20.2504 15.5919 19.8625 14.6554 19.172 13.9649C18.4816 13.2744 17.545 12.8865 16.5686 12.8865C15.592 12.8865 14.6555 13.2744 13.9651 13.9649C13.2746 14.6554 12.8867 15.5919 12.8867 16.5684C12.8867 17.5449 13.2746 18.4814 13.9651 19.1719C14.6555 19.8624 15.592 20.2503 16.5686 20.2503Z"
        fill="#FFCC01"
      />
    </svg>
  );
}
