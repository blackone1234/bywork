import Link from "next/link";
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
    <div className="flex w-full items-center justify-between text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)]">
      <span className="text-[var(--mobile-color-soft-gray)]">{label}</span>
      <span className="text-[var(--mobile-color-black)]">{value}</span>
    </div>
  );
}

/**
 * S09(근무기록/분석)·S10(신청내역)이 공유하는 섹션 캡션 — 검은 border-top-2 + soft-gray
 * 라벨. 아래에 오는 목록 형태(label/value 행 vs MobileListRow)가 화면마다 달라서 캡션만
 * 따로 떼어냈다.
 */
export function MobileSectionLabel({ title }: { title: string }) {
  return (
    <div className="flex w-full items-center justify-center border-t-2 border-[var(--mobile-color-black)] pt-[var(--mobile-space-10)]">
      <p className="w-full leading-none text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
        {title}
      </p>
    </div>
  );
}

/** S09(근태 날짜 상세) "근무기록"/"분석" 카드 — label/value 행이 light-gray 구분선으로 나뉜다. */
export function MobileRecordCard({ title, rows }: { title: string; rows: { label: string; value: ReactNode }[] }) {
  return (
    <div className="flex w-full flex-col items-start gap-[var(--mobile-space-30)]">
      <MobileSectionLabel title={title} />
      {/* 각 행의 pb-[12px](텍스트↔자기 구분선)와 대칭되도록, 구분선↔다음 행 간격도 12px로
          맞춤 — 이전엔 24px라 위/아래 간격이 24px/12px로 어긋나 보였다. */}
      <div className="flex w-full flex-col items-start gap-[12px]">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={`flex w-full items-center justify-between pb-[12px] text-[length:var(--mobile-text-body)] font-semibold tracking-[var(--mobile-text-body-tracking)] text-[var(--mobile-color-black)] ${
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
 * trailing에 ChevronRightIcon을 넣고 href로 다음 화면(S16 등)을 연결한다.
 */
export function MobileFieldRow({
  label,
  value,
  trailing,
  href,
}: {
  label: string;
  value?: ReactNode;
  trailing?: ReactNode;
  href?: string;
}) {
  const content = (
    <>
      <span className="text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
        {label}
      </span>
      {value ? (
        <span className="text-[length:var(--mobile-text-body)] tracking-[var(--mobile-text-body-tracking)] text-[var(--mobile-color-black)]">
          {value}
        </span>
      ) : null}
      {trailing}
    </>
  );
  const className =
    "flex w-full items-center justify-between rounded-[var(--mobile-radius-input)] border border-[var(--mobile-color-light-gray)] px-[var(--mobile-space-30)] py-[var(--mobile-space-16)]";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
