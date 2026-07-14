import type { ReactNode } from "react";

/** S11 "신청 정보" 요약 박스 — 라벨(soft-gray)/값(black) 행이 쌓이는 테두리 박스. */
export function MobileInfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col items-start gap-[var(--mobile-space-10)] rounded-[var(--mobile-radius-chip)] border border-[var(--mobile-color-light-gray)] px-[var(--mobile-space-30)] py-[var(--mobile-space-20)]">
      {children}
    </div>
  );
}

export function MobileInfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)]">
      <span className="text-[var(--mobile-color-soft-gray)]">{label}</span>
      <span className="text-[var(--mobile-color-black)]">{value}</span>
    </div>
  );
}

/**
 * S09(근태 날짜 상세) "근무기록"/"분석" 카드 — MobileInfoBox와 달리 테두리 박스가 아니라
 * 검은 border-top-2 + soft-gray 섹션 캡션, 그 아래 label/value 행들이 light-gray 구분선으로
 * 나뉜다(마지막 행만 구분선 없음).
 */
export function MobileRecordCard({ title, rows }: { title: string; rows: { label: string; value: ReactNode }[] }) {
  return (
    <div className="flex w-full flex-col items-start gap-[var(--mobile-space-30)]">
      <div className="flex w-full items-center justify-center border-t-2 border-[var(--mobile-color-black)] pt-[var(--mobile-space-10)]">
        <p className="w-full text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
          {title}
        </p>
      </div>
      <div className="flex w-full flex-col items-start gap-[14px]">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={`flex w-full items-center justify-between pb-[12px] text-[length:var(--mobile-text-body)] tracking-[var(--mobile-text-body-tracking)] text-[var(--mobile-color-black)] ${
              index < rows.length - 1 ? "border-b border-[var(--mobile-color-light-gray)]" : ""
            }`}
          >
            <span>{row.label}</span>
            <span>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * S15(마이페이지) "계정설정"/"내 정보" 행 — rounded-input(14px) 카드형, 클릭 가능한 항목은
 * trailing에 ChevronRightIcon을 넣어 씀.
 */
export function MobileFieldRow({ label, value, trailing }: { label: string; value?: ReactNode; trailing?: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between rounded-[var(--mobile-radius-input)] border border-[var(--mobile-color-light-gray)] px-[var(--mobile-space-30)] py-[var(--mobile-space-16)]">
      <span className="text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
        {label}
      </span>
      {value ? (
        <span className="text-[length:var(--mobile-text-body)] tracking-[var(--mobile-text-body-tracking)] text-[var(--mobile-color-black)]">
          {value}
        </span>
      ) : null}
      {trailing}
    </div>
  );
}
