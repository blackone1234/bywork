import type { ReactNode } from "react";

/**
 * S10/S12 "신청내역" 목록 한 줄 — 날짜+설명 좌측, 상태 뱃지 우측, 하단 구분선.
 * `action`은 Figma에 없던 신규 기능(휴가 취소 버튼)용 — 조건 충족 시에만 행 아래에
 * 노출되므로 optional, 없으면 기존 레이아웃 그대로다(회귀 없음).
 */
export function MobileListRow({
  title,
  subtitle,
  trailing,
  action,
}: {
  title: string;
  subtitle: string;
  trailing: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-[10px] border-b border-[var(--mobile-color-light-gray)] pb-[11px]">
      <div className="flex w-full items-center justify-between">
        {/* 사용자 지시로 Figma 스펙(8px)보다 좁게 강제 고정 — gap-6px→4px. */}
        <div className="flex flex-col items-start gap-[4px]">
          <p className="text-[length:var(--mobile-text-subtitle)] font-semibold tracking-[var(--mobile-text-subtitle-tracking)] text-[var(--mobile-color-black)]">
            {title}
          </p>
          <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
            {subtitle}
          </p>
        </div>
        {trailing}
      </div>
      {action}
    </div>
  );
}
