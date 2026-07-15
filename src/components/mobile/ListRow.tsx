import type { ReactNode } from "react";

/** S10/S12 "신청내역" 목록 한 줄 — 날짜+설명 좌측, 상태 뱃지 우측, 하단 구분선. */
export function MobileListRow({ title, subtitle, trailing }: { title: string; subtitle: string; trailing: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between border-b border-[var(--mobile-color-light-gray)] pb-[11px]">
      {/* 사용자 지시로 Figma 스펙(8px)보다 좁게 강제 고정 — gap-6. */}
      <div className="flex flex-col items-start gap-[6px]">
        <p className="text-[length:var(--mobile-text-subtitle)] font-semibold tracking-[var(--mobile-text-subtitle-tracking)] text-[var(--mobile-color-black)]">
          {title}
        </p>
        <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
          {subtitle}
        </p>
      </div>
      {trailing}
    </div>
  );
}
