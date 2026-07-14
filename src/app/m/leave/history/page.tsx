"use client";

import { useState } from "react";
import { MobileSubPageHeader } from "@/components/mobile/Header";
import { MobileTabBar } from "@/components/mobile/TabBar";
import { MobileListRow } from "@/components/mobile/ListRow";
import { MobileStatusBadge, type MobileStatus } from "@/components/mobile/StatusBadge";
import { MobileBottomNav } from "@/components/mobile/BottomNav";

const TABS = ["전체", "대기중", "승인", "반려"];

const HISTORY: { date: string; subtitle: string; status: MobileStatus; label: string }[] = [
  { date: "2026.07.15", subtitle: "연차 1일", status: "pending", label: "대기" },
  { date: "2026.07.15", subtitle: "반차(오후) 0.5일", status: "approved", label: "승인" },
  { date: "2026.07.15", subtitle: "연차", status: "approved", label: "승인" },
  { date: "2026.07.15", subtitle: "연차", status: "pending", label: "대기" },
  { date: "2026.07.15", subtitle: "연차", status: "rejected", label: "반려" },
];

/** S12 — 휴가 내역 (light, 드릴인). */
export default function MobileLeaveHistoryPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-[var(--mobile-color-white)]">
      <div className="flex w-full flex-col gap-[30px]">
        <MobileSubPageHeader title="휴가내역" />
        <div className="flex w-full flex-col gap-[30px] px-[var(--mobile-space-30)]">
          <MobileTabBar tabs={TABS} activeIndex={activeTab} onChange={setActiveTab} />
          <div className="flex w-full flex-col gap-[10px]">
            {HISTORY.map((item, index) => (
              <MobileListRow
                key={index}
                title={item.date}
                subtitle={item.subtitle}
                trailing={<MobileStatusBadge status={item.status}>{item.label}</MobileStatusBadge>}
              />
            ))}
          </div>
        </div>
      </div>
      <MobileBottomNav active="leave" theme="light" />
    </div>
  );
}
