/**
 * S13(월간 통계) 2열 통계 카드 — 캡션이 위, 28px 숫자가 오른쪽 정렬로 아래에 온다
 * (get_design_context로 확인: 32px 왼쪽정렬로 짐작했던 첫 조사와 달랐다).
 */
export function MobileStatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-[var(--mobile-space-20)] rounded-[var(--mobile-radius-card)] border border-[var(--mobile-color-light-gray)] pt-[16px] pb-[14px]">
      <p className="w-full px-[var(--mobile-space-20)] text-center text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
        {label}
      </p>
      <p className="w-full px-[var(--mobile-space-20)] text-right text-[28px] font-extrabold tracking-[-0.56px] text-[var(--mobile-color-black)]">
        {value}
      </p>
    </div>
  );
}

/** S13 "주별 근무시간" — 라벨 + 가로 막대(line-gray 트랙 + mint 채움) + 값. */
export function MobileHorizontalBarRow({ label, value, percent }: { label: string; value: string; percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="flex w-full items-center gap-[20px]">
      <p className="w-6 shrink-0 text-center text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
        {label}
      </p>
      <div className="h-2 flex-1 rounded-[2px] bg-[var(--mobile-color-line-gray)]">
        <div className="h-2 rounded-[2px] bg-[var(--mobile-color-mint)]" style={{ width: `${clamped}%` }} />
      </div>
      <p className="w-6 shrink-0 text-right text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-black)]">
        {value}
      </p>
    </div>
  );
}

/**
 * S14 "월별 근무시간" 12개월 세로 막대 차트. Figma 원본은 가로 막대를 -90도 회전시켜
 * 세로처럼 보이게 하는 트릭을 쓴다(높이 기반 레이아웃 없이 width로 막대 길이를 표현) —
 * 그대로 재현했다. 12개 막대(40px+gap-10 폭 590px)가 333px 콘텐츠 폭을 넘어서므로
 * 가로 스크롤이 실제로 필요하다. 채움색은 주별 막대(mint)와 달리 state-leave(파랑).
 */
export function MobileVerticalBarChart({ bars }: { bars: { label: string; percent: number }[] }) {
  return (
    <div className="flex w-full gap-[10px] overflow-x-auto pb-[4px]">
      {bars.map((bar) => {
        const clamped = Math.min(100, Math.max(0, bar.percent));
        return (
          <div key={bar.label} className="flex shrink-0 flex-col items-center gap-[6px]">
            <div className="flex h-[120px] w-[40px] items-center justify-center">
              <div className="w-[120px] rotate-[-90deg]">
                <div className="h-[40px] w-[120px] overflow-clip rounded-[8px] bg-[var(--mobile-color-line-gray)]">
                  <div
                    className="h-[40px] rounded-[8px] bg-[var(--mobile-color-state-leave)]"
                    style={{ width: `${clamped}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="w-6 text-center text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
              {bar.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** S08(캘린더) "7월 요약"처럼 세로 구분선으로 나뉜 3~4분할 요약 행. */
export function MobileSummaryRow({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="flex w-full items-stretch justify-between px-[var(--mobile-space-10)] pt-[var(--mobile-space-10)]">
      {items.map((item, index) => (
        <div key={item.label} className="flex flex-1 items-center">
          {index > 0 ? <div className="mr-4 h-full w-px self-stretch bg-[var(--mobile-color-light-gray)]" aria-hidden /> : null}
          <div className="flex flex-1 flex-col items-center gap-[6px]">
            <p className="text-[length:var(--mobile-text-display)] font-extrabold tracking-[var(--mobile-text-display-tracking)] text-[var(--mobile-color-black)]">
              {item.value}
            </p>
            <p className="text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
