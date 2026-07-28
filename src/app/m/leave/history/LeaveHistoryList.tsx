"use client";

import { useState } from "react";
import { MobileTabBar } from "@/components/mobile/TabBar";
import { MobileListRow } from "@/components/mobile/ListRow";
import { MobileStatusBadge, type MobileStatus } from "@/components/mobile/StatusBadge";
import type { MyLeaveRequestRow } from "@/lib/employeeLeaveRequests";
import { CancelLeaveRequestButton } from "../CancelLeaveRequestButton";

const TABS = ["전체", "대기중", "승인", "반려", "취소"] as const;
const TAB_TO_STATUS: Record<(typeof TABS)[number], MyLeaveRequestRow["status"] | null> = {
  전체: null,
  대기중: "pending",
  승인: "approved",
  반려: "rejected",
  취소: "cancelled",
};

const STATUS_TO_BADGE: Record<MyLeaveRequestRow["status"], { status: MobileStatus; label: string }> = {
  pending: { status: "pending", label: "대기" },
  approved: { status: "approved", label: "승인" },
  rejected: { status: "rejected", label: "반려" },
  cancelled: { status: "cancelled", label: "취소" },
};

/** 취소 완료 알럿 문구용 — "8월 10일" 형태(CD가 준 예시 "00월 00일" 그대로). */
function formatMonthDay(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

function formatDateDot(date: string): string {
  return date.replaceAll("-", ".");
}

function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatDateDot(startDate);
  return `${formatDateDot(startDate)} ~ ${formatDateDot(endDate)}`;
}

function formatDays(days: number): string {
  return days === 1 ? "1일" : `${days}일`;
}

/** S12 — 휴가 내역 목록 + 탭 필터. 페이지 이동 없이 클라이언트에서 필터링(원래 mock과 동일한 UX). */
export function LeaveHistoryList({ requests }: { requests: MyLeaveRequestRow[] }) {
  const [activeTab, setActiveTab] = useState(0);
  const filterStatus = TAB_TO_STATUS[TABS[activeTab]!];
  const filtered = filterStatus ? requests.filter((r) => r.status === filterStatus) : requests;

  return (
    // 그룹2(A 확산) — 탭바/목록 2섹션에 스태거 적용. 목록 컨테이너는 탭 필터로 내용만
    // 바뀔 뿐 이 div 자체는 리마운트되지 않아서, 필터 클릭할 때마다 애니메이션이
    // 다시 재생되지 않는다(마운트 시 1회만).
    <div className="flex w-full flex-col gap-[30px] px-[var(--mobile-space-30)]">
      <div className="stagger-item" style={{ animationDelay: "0ms" }}>
        <MobileTabBar tabs={[...TABS]} activeIndex={activeTab} onChange={setActiveTab} />
      </div>
      {filtered.length > 0 ? (
        <div className="stagger-item flex w-full flex-col gap-[10px]" style={{ animationDelay: "70ms" }}>
          {filtered.map((r) => {
            const badge = STATUS_TO_BADGE[r.status];
            return (
              <MobileListRow
                key={r.id}
                title={formatDateRange(r.startDate, r.endDate)}
                subtitle={`${r.leaveType} ${formatDays(r.days)}`}
                trailing={<MobileStatusBadge status={badge.status}>{badge.label}</MobileStatusBadge>}
                action={
                  r.canCancel ? (
                    <CancelLeaveRequestButton requestId={r.id} dateLabel={formatMonthDay(r.startDate)} />
                  ) : undefined
                }
              />
            );
          })}
        </div>
      ) : (
        <p
          className="stagger-item text-[length:var(--mobile-text-body)] text-[var(--mobile-color-soft-gray)]"
          style={{ animationDelay: "70ms" }}
        >
          해당하는 신청 내역이 없습니다.
        </p>
      )}
    </div>
  );
}
