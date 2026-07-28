import { PendingReviewClockIcon } from "@/components/mobile/icons";

/** S10/S12(휴가 내역)의 상태 뱃지, S08/S09(캘린더/근태 상세)의 근태 상태 뱃지가 공유하는 색상 규칙. */
export type MobileStatus = "pending" | "approved" | "rejected" | "normal" | "late" | "leave" | "cancelled";

const STATUS_CLASSNAME: Record<MobileStatus, string> = {
  pending: "bg-[var(--mobile-color-state-late)]",
  approved: "bg-[var(--mobile-color-state-work)]",
  rejected: "bg-[var(--mobile-color-state-holiday)]",
  normal: "bg-[var(--mobile-color-state-work)]",
  late: "bg-[var(--mobile-color-state-late)]",
  leave: "bg-[var(--mobile-color-state-leave)]",
  // Figma에 없는 신규 상태(휴가 취소) — E01~E07에서 이미 "중립/비활성" 의미로 쓰던
  // light-gray 재사용(admin의 "퇴사"/"취소" 배지가 status-terminated 회색을 쓰는 것과
  // 같은 논리).
  cancelled: "bg-[var(--mobile-color-light-gray)]",
};

/**
 * S09의 "State"와 S10/S12의 "Confirm"은 Figma에서 서로 다른 컴포넌트인데(각각
 * px-12/px-15) 색상 규칙이 같아서 한 React 컴포넌트로 묶었다 — get_design_context로
 * 개별 재확인해서 발견. size="list"(기본, S10/S12 목록 뱃지)/size="compact"(S09
 * 헤더 메타 뱃지)로 구분.
 */
export function MobileStatusBadge({
  status,
  children,
  size = "list",
}: {
  status: MobileStatus;
  children: React.ReactNode;
  size?: "list" | "compact";
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-[var(--mobile-radius-chip)] ${
        size === "list" ? "px-[15px]" : "px-[var(--mobile-space-12)]"
      } py-[var(--mobile-space-8)] text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-black)] ${STATUS_CLASSNAME[status]}`}
    >
      {children}
    </span>
  );
}

/**
 * S03~S07 홈 화면 상태 뱃지. 5개 상태 중 "근무중"(S04)만 filled(흰 배경/검은 글자)로
 * 강조되고, 나머지(출근전·외출중·외근중·퇴근완료)는 전부 outline(테두리만) 스타일이다 —
 * get_design_context로 5개 상태를 전부 대조해서 확인한 규칙.
 *
 * 폭: 출근전/근무중/외출중/외근중(전부 3글자)은 Figma가 고정 67px을 쓰지만, "퇴근완료"만
 * 4글자라 Figma 원본도 폭을 고정하지 않고 auto-width로 뒀다 — 그대로 67px을 강제하면
 * 글자가 줄바꿈되거나 넘친다. width="fixed"(기본)/"auto"로 구분.
 */
export function MobileHeaderBadge({
  children,
  variant = "outline",
  width = "fixed",
}: {
  children: React.ReactNode;
  variant?: "filled" | "outline";
  width?: "fixed" | "auto";
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-[var(--mobile-radius-badge)] px-[15px] py-[var(--mobile-space-8)] text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] whitespace-nowrap ${
        width === "fixed" ? "w-[67px]" : ""
      } ${
        variant === "filled"
          ? "bg-[var(--mobile-color-white)] text-[var(--mobile-color-black)]"
          : "border border-[var(--mobile-color-light-gray)] text-[var(--mobile-color-light-gray)]"
      }`}
    >
      {children}
    </span>
  );
}

/**
 * S04~S07 홈 기존 상태뱃지 옆에 조건부로 붙는 "검토대기중 N건" 마킹(Figma get_design_context
 * 실측: bg state_지각(#ffe09e) 고정, px-15/py-8, rounded-40, 아이콘+텍스트 gap-8, 텍스트
 * 12px SemiBold black). count가 0이면 아예 렌더링하지 않는다(조건부 마킹).
 */
export function MobilePendingReviewBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex shrink-0 items-center justify-center gap-[8px] rounded-[var(--mobile-radius-badge)] bg-[var(--mobile-color-state-late)] px-[15px] py-[var(--mobile-space-8)] whitespace-nowrap">
      <PendingReviewClockIcon className="size-3 text-[var(--mobile-color-black)]" />
      <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-black)]">
        검토대기중 {count}건
      </p>
    </span>
  );
}

/**
 * S13(월간 통계) 상단 전체폭 안내 배너 — MobilePendingReviewBadge와 같은 색이지만
 * padding(px-15/py-12 vs py-8)과 폭(w-full)이 다른 별도 컴포넌트(Figma get_design_context로
 * 개별 확인). count가 0이면 렌더링하지 않는다.
 */
export function MobilePendingReviewBanner({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="flex w-full shrink-0 items-center justify-center gap-[8px] rounded-[var(--mobile-radius-badge)] bg-[var(--mobile-color-state-late)] px-[15px] py-[12px]">
      <PendingReviewClockIcon className="size-3 text-[var(--mobile-color-black)]" />
      <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-black)]">
        검토대기중 {count}건 - 확정되면 통계에 반영됩니다.
      </p>
    </div>
  );
}
