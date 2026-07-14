"use client";

import { useState } from "react";
import { MobileTabRootHeader, MobileMonthPager } from "@/components/mobile/Header";
import { MobileTabBar } from "@/components/mobile/TabBar";
import { MobileStatCard, MobileHorizontalBarRow, MobileVerticalBarChart, MobileSummaryRow } from "@/components/mobile/StatCard";
import { MobileInfoBox, MobileInfoRow } from "@/components/mobile/InfoBox";
import { MobileBottomNav } from "@/components/mobile/BottomNav";

const WEEKLY_HOURS = [
  { label: "1주", value: "40h", percent: 100 },
  { label: "2주", value: "14h", percent: 35 },
  { label: "3주", value: "14h", percent: 35 },
  { label: "4주", value: "14h", percent: 35 },
  { label: "5주", value: "14h", percent: 35 },
];

const MONTHLY_HOURS = [
  { label: "1월", percent: (74 / 120) * 100 },
  { label: "2월", percent: (99 / 120) * 100 },
  { label: "3월", percent: (86 / 120) * 100 },
  { label: "4월", percent: 100 },
  { label: "5월", percent: (86 / 120) * 100 },
  { label: "6월", percent: (86 / 120) * 100 },
  { label: "7월", percent: (86 / 120) * 100 },
  { label: "8월", percent: (86 / 120) * 100 },
  { label: "9월", percent: (86 / 120) * 100 },
  { label: "10월", percent: (86 / 120) * 100 },
  { label: "11월", percent: (86 / 120) * 100 },
  { label: "12월", percent: (86 / 120) * 100 },
];

/** S13/S14 — 통계 (light, 통계 탭 루트). 월간/연간을 탭으로 전환하는 한 화면. */
export default function MobileStatsPage() {
  const [period, setPeriod] = useState<0 | 1>(0);

  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-[var(--mobile-color-white)]">
      <div className="flex w-full flex-col gap-[30px]">
        <div className="flex w-full flex-col gap-[30px] px-[var(--mobile-space-30)]">
          <MobileTabRootHeader title="통계" size="sm" />
          <MobileTabBar tabs={["월간", "연간"]} activeIndex={period} onChange={(index) => setPeriod(index as 0 | 1)} />
        </div>

        {period === 0 ? <MonthlyView /> : <YearlyView />}
      </div>
      <MobileBottomNav active="stats" theme="light" />
    </div>
  );
}

function MonthlyView() {
  return (
    <>
      <MobileMonthPager label="2026년 7월" />
      <div className="flex w-full flex-col gap-[10px] px-[var(--mobile-space-30)]">
        <div className="flex w-full gap-[10px]">
          <MobileStatCard value="22일" label="총 근무일" />
          <MobileStatCard value="176h" label="총 근무시간" />
        </div>
        <div className="flex w-full gap-[10px]">
          <MobileStatCard value="3일" label="연차" />
          <MobileStatCard value="4회" label="지각" />
        </div>

        <div className="flex w-full flex-col gap-[14px] rounded-[var(--mobile-radius-chip)] border border-[var(--mobile-color-light-gray)] p-[var(--mobile-space-20)]">
          <p className="text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
            주별 근무시간
          </p>
          <div className="flex w-full flex-col gap-[12px]">
            {WEEKLY_HOURS.map((week) => (
              <MobileHorizontalBarRow key={week.label} {...week} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function YearlyView() {
  return (
    <>
      <MobileMonthPager label="2026년" />
      <div className="flex w-full flex-col gap-[20px] px-[var(--mobile-space-30)]">
        <div className="flex w-full flex-col gap-[14px]">
          <p className="text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
            월별 근무시간
          </p>
          <MobileVerticalBarChart bars={MONTHLY_HOURS} />
        </div>

        <div className="flex w-full flex-col gap-[10px]">
          <p className="text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
            연간 연차 현황
          </p>
          <MobileSummaryRow items={[{ value: "15", label: "총부여" }, { value: "3", label: "사용" }, { value: "12", label: "잔여" }]} />
        </div>

        <MobileInfoBox>
          <MobileInfoRow label="연간 총 근무시간" value="1,148 h" />
          <MobileInfoRow label="52h 초과 주차" value="0주" />
        </MobileInfoBox>
      </div>
    </>
  );
}
