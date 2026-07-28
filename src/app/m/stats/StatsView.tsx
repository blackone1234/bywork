"use client";

import { useState } from "react";
import { MobileMonthPager } from "@/components/mobile/Header";
import { MobileTabBar } from "@/components/mobile/TabBar";
import { MobilePendingReviewBanner } from "@/components/mobile/StatusBadge";
import { MobileStatCard, MobileHorizontalBarRow, MobileVerticalBarChart, MobileSummaryRow } from "@/components/mobile/StatCard";
import { MobileInfoBox, MobileInfoRow } from "@/components/mobile/InfoBox";
import { useCountUp, useMotionReveal } from "@/lib/useCountUp";
import type { MonthlyStats, YearlyStats } from "@/lib/employeeAttendanceStats";

export type StatsViewProps = {
  year: number;
  month: number;
  monthly: MonthlyStats;
  yearly: YearlyStats;
  leaveAnnual: number;
  leaveUsed: number;
  /** MobileMonthPager 화살표용 — 서버 컴포넌트(page.tsx)에서 URL 쿼리로 이동하는
   * 방식이라 콜백이 아니라 href를 넘긴다(S08과 동일한 이유 — onPrev/onNext는 콜백을
   * 어디서도 안 넘겨서 화살표가 죽어있던 버그가 있었음). */
  monthPrevHref: string;
  monthNextHref: string;
  yearPrevHref: string;
  yearNextHref: string;
};

/** S13/S14 — 통계 (light, 통계 탭 루트). 데이터는 서버 컴포넌트(page.tsx)에서 한 번에 다 받아오고, 여기선 월간/연간 탭 전환만 클라이언트에서 처리한다. */
export function StatsView({
  year,
  month,
  monthly,
  yearly,
  leaveAnnual,
  leaveUsed,
  monthPrevHref,
  monthNextHref,
  yearPrevHref,
  yearNextHref,
}: StatsViewProps) {
  const [period, setPeriod] = useState<0 | 1>(0);

  return (
    <>
      <div className="px-[var(--mobile-space-30)]">
        <MobileTabBar tabs={["월간", "연간"]} activeIndex={period} onChange={(index) => setPeriod(index as 0 | 1)} />
      </div>

      {period === 0 ? (
        <MonthlyView year={year} month={month} stats={monthly} prevHref={monthPrevHref} nextHref={monthNextHref} />
      ) : (
        <YearlyView
          year={year}
          stats={yearly}
          leaveAnnual={leaveAnnual}
          leaveUsed={leaveUsed}
          prevHref={yearPrevHref}
          nextHref={yearNextHref}
        />
      )}
    </>
  );
}

/**
 * 파일럿(B) — 큰 숫자 카드는 0에서 실제값까지 카운트업, 막대그래프는 0%에서 실제 값까지
 * CSS transition으로 채워진다. 정적 집계 화면(그룹D 확인 — 실시간 갱신 요소 없음)이라
 * 마운트 시 1회만 재생하면 된다. prefers-reduced-motion이면 훅 내부에서 바로 최종값/
 * 최종상태를 반환한다.
 */
function MonthlyView({
  year,
  month,
  stats,
  prevHref,
  nextHref,
}: {
  year: number;
  month: number;
  stats: MonthlyStats;
  prevHref: string;
  nextHref: string;
}) {
  const workDays = useCountUp(stats.workDays);
  const totalHours = useCountUp(Math.round(stats.totalHours));
  const leaveDays = useCountUp(stats.leaveDays);
  const revealed = useMotionReveal();

  return (
    <>
      <MobileMonthPager label={`${year}년 ${month}월`} asRoot={false} prevHref={prevHref} nextHref={nextHref} />
      <div className="flex w-full flex-col gap-[16px] px-[var(--mobile-space-30)]">
        <MobilePendingReviewBanner count={stats.pendingReviewCount} />
        {/* 그룹2(A 확산) — 숫자카드 행/주별근무시간 박스 2섹션에 스태거 적용
            (파일럿(B)의 카운트업·바채우기와 별개로, 섹션 자체의 등장 애니메이션). */}
        <div className="flex w-full flex-col gap-[10px]">
          <div className="stagger-item flex w-full flex-col gap-[10px]" style={{ animationDelay: "0ms" }}>
            <div className="flex w-full gap-[10px]">
              <MobileStatCard value={`${workDays}일`} label="총 근무일" />
              <MobileStatCard value={`${totalHours}h`} label="총 근무시간" />
            </div>
            <div className="flex w-full gap-[10px]">
              <MobileStatCard value={`${leaveDays}일`} label="연차" />
            </div>
          </div>

          <div
            className="stagger-item flex w-full flex-col gap-[14px] rounded-[var(--mobile-radius-chip)] border border-[var(--mobile-color-light-gray)] p-[var(--mobile-space-20)]"
            style={{ animationDelay: "70ms" }}
          >
            <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
              주별 근무시간
            </p>
            <div className="flex w-full flex-col gap-[12px]">
              {stats.weeklyHours.map((week) => (
                <MobileHorizontalBarRow
                  key={week.label}
                  label={week.label}
                  value={`${Math.round(week.hours)}h`}
                  percent={revealed ? week.percent : 0}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function YearlyView({
  year,
  stats,
  leaveAnnual,
  leaveUsed,
  prevHref,
  nextHref,
}: {
  year: number;
  stats: YearlyStats;
  leaveAnnual: number;
  leaveUsed: number;
  prevHref: string;
  nextHref: string;
}) {
  const leaveAnnualAnimated = useCountUp(leaveAnnual);
  const leaveUsedAnimated = useCountUp(leaveUsed);
  const leaveRemainingAnimated = useCountUp(leaveAnnual - leaveUsed);
  const totalHours = useCountUp(Math.round(stats.totalHours));
  const weeksOver52 = useCountUp(stats.weeksOver52);
  const revealed = useMotionReveal();

  return (
    <>
      <MobileMonthPager label={`${year}년`} asRoot={false} prevHref={prevHref} nextHref={nextHref} />
      {/* 그룹2(A 확산) — 월별근무시간/연차현황/정보박스 3섹션에 스태거 적용. */}
      <div className="flex w-full flex-col gap-[20px] px-[var(--mobile-space-30)]">
        {/* get_design_context 재확인: Figma 원본은 이 wrapper에 pt-10/pb-20이 있는데
            코드에는 없었다. */}
        <div className="stagger-item flex w-full flex-col gap-[14px] pt-[10px] pb-[20px]" style={{ animationDelay: "0ms" }}>
          <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
            월별 근무시간
          </p>
          <MobileVerticalBarChart bars={stats.monthlyHours.map((bar) => ({ ...bar, percent: revealed ? bar.percent : 0 }))} />
        </div>

        <div className="stagger-item flex w-full flex-col gap-[10px]" style={{ animationDelay: "70ms" }}>
          <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
            연간 연차 현황
          </p>
          <MobileSummaryRow
            items={[
              { value: String(leaveAnnualAnimated), label: "총부여" },
              { value: String(leaveUsedAnimated), label: "사용" },
              { value: String(leaveRemainingAnimated), label: "잔여" },
            ]}
          />
        </div>

        <div className="stagger-item" style={{ animationDelay: "140ms" }}>
          <MobileInfoBox>
            <MobileInfoRow label="연간 총 근무시간" value={`${totalHours.toLocaleString()} h`} />
            <MobileInfoRow label="52h 초과 주차" value={`${weeksOver52}주`} />
          </MobileInfoBox>
        </div>
      </div>
    </>
  );
}
