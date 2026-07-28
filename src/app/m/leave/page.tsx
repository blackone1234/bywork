import { redirect } from "next/navigation";
import { MobileTabRootHeader } from "@/components/mobile/Header";
import { MobileButton } from "@/components/mobile/Button";
import { MobileSummaryRow } from "@/components/mobile/StatCard";
import { MobileSectionLabel } from "@/components/mobile/InfoBox";
import { MobileListRow } from "@/components/mobile/ListRow";
import { MobileStatusBadge, type MobileStatus } from "@/components/mobile/StatusBadge";
import { MobileBottomNav } from "@/components/mobile/BottomNav";
import { MobileTabTransition } from "@/components/mobile/TabTransition";
import { PlusIcon } from "@/components/mobile/icons";
import { getCurrentEmployee, EMPLOYEE_SESSION_EXPIRED_MESSAGE } from "@/lib/employeeAccount";
import { getLeaveBalance, listMyLeaveRequests, type MyLeaveRequestRow } from "@/lib/employeeLeaveRequests";
import { CancelLeaveRequestButton } from "./CancelLeaveRequestButton";

export const dynamic = "force-dynamic";

const STATUS_TO_BADGE: Record<MyLeaveRequestRow["status"], { status: MobileStatus; label: string }> = {
  pending: { status: "pending", label: "대기" },
  approved: { status: "approved", label: "승인" },
  rejected: { status: "rejected", label: "반려" },
  cancelled: { status: "cancelled", label: "취소" },
};

function formatDateDot(date: string): string {
  return date.replaceAll("-", ".");
}

function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatDateDot(startDate);
  return `${formatDateDot(startDate)} ~ ${formatDateDot(endDate)}`;
}

/** 취소 완료 알럿 문구용 — "8월 10일" 형태(CD가 준 예시 "00월 00일" 그대로). */
function formatMonthDay(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

/** S10 — 휴가 현황 (light, 휴가 탭 루트). */
export default async function MobileLeavePage() {
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect(`/m/login?error=${encodeURIComponent(EMPLOYEE_SESSION_EXPIRED_MESSAGE)}`);
  }

  const [balance, requests] = await Promise.all([
    getLeaveBalance(employee.id),
    listMyLeaveRequests(employee.id),
  ]);

  // "총부여 = 사용 + 잔여"로 눈으로 바로 검산되는 확정 잔여(승인분만 차감)를 보여준다 —
  // 대기중인 신청까지 뺀 "신청 가능 잔여"는 S11 제출 화면에서만 별도로 쓴다(둘의 의미가
  // 달라서 여기서 같이 보여주면 숫자가 안 맞아 보임).
  const confirmedRemaining = balance.annual - balance.used;
  const recentRequests = requests.slice(0, 5);

  return (
    <MobileTabTransition>
    {/* 하단 네비가 fixed로 바뀌면서(스크롤해도 항상 고정) 정상 흐름에서 빠졌다 — 마지막
        콘텐츠가 네비에 가려지지 않도록 실측한 네비 높이(pb-[110px])만큼 여백을 확보한다. */}
    <div className="flex min-h-screen w-full flex-col bg-[var(--mobile-color-white)] pb-[110px]">
      <div className="flex w-full flex-col gap-[30px]">
        <MobileTabRootHeader title="휴가현황" />

        {/* 그룹2(A 확산) — 요약/신청버튼/신청내역 3섹션에 스태거 적용. */}
        <div className="flex w-full flex-col gap-[30px] px-[var(--mobile-space-30)]">
          <div className="stagger-item" style={{ animationDelay: "0ms" }}>
            <MobileSummaryRow
              items={[
                { value: String(balance.annual), label: "총부여" },
                { value: String(balance.used), label: "사용" },
                { value: String(confirmedRemaining), label: "잔여" },
              ]}
            />
          </div>

          <div className="stagger-item" style={{ animationDelay: "70ms" }}>
            <MobileButton variant="outline-dark" href="/m/leave/new" className="gap-[10px]">
              <PlusIcon className="size-2.5" />
              휴가 신청하기
            </MobileButton>
          </div>

          <div className="stagger-item flex w-full flex-col gap-[30px]" style={{ animationDelay: "140ms" }}>
            <MobileSectionLabel title="신청내역" />
            {recentRequests.length > 0 ? (
              <div className="flex w-full flex-col gap-[10px]">
                {recentRequests.map((r) => {
                  const badge = STATUS_TO_BADGE[r.status];
                  return (
                    <MobileListRow
                      key={r.id}
                      title={formatDateRange(r.startDate, r.endDate)}
                      subtitle={r.leaveType}
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
              <p className="text-[length:var(--mobile-text-body)] text-[var(--mobile-color-soft-gray)]">아직 신청한 휴가가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
      <MobileBottomNav active="leave" theme="light" />
    </div>
    </MobileTabTransition>
  );
}
