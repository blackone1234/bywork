import { PageHeader } from "@/components/admin/PageHeader";
import { LeaveYearFilter } from "@/components/admin/LeaveYearFilter";
import { Button } from "@/components/admin/Button";
import { listLeaveRequests, type LeaveStatusFilter } from "@/lib/leaveRequests";
import { LeaveRequestsTable } from "./LeaveRequestsTable";

export const dynamic = "force-dynamic";

const FILTER_TABS: { key: LeaveStatusFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pending", label: "대기중" },
  { key: "approved", label: "승인" },
  { key: "rejected", label: "반려" },
  { key: "cancelled", label: "취소" },
];

const STATUS_FILTER_VALUES = new Set<LeaveStatusFilter>(["all", "pending", "approved", "rejected", "cancelled"]);

export default async function LeaveRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; year?: string }>;
}) {
  const params = await searchParams;
  const status = STATUS_FILTER_VALUES.has(params.status as LeaveStatusFilter)
    ? (params.status as LeaveStatusFilter)
    : "all";
  const year = Number(params.year) || new Date().getFullYear();

  const leaveRequests = await listLeaveRequests(status, year);

  return (
    <>
      <PageHeader breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, "휴가승인"]} />

      {/* 그룹3(A 확산) — 필터탭/테이블 2섹션에 스태거 적용(A01 패턴 재사용). */}
      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        {/* z-10 — .stagger-item은 animation-fill-mode:both로 애니메이션 종료 후에도
            transform:matrix(identity)가 남아 스태킹 컨텍스트가 생긴다. 뒤 형제인
            테이블(.stagger-item)이 DOM 순서상 나중이라 z-index 없이는 그 위에 그려져서
            이 드롭다운(연도 필터)을 가려버림 — A07/A08에서 이미 겪은 것과 동일한 버그. */}
        <div className="stagger-item relative z-10 flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center gap-[8px] overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <Button
                key={tab.key}
                href={`/leave-requests?status=${tab.key}&year=${year}`}
                variant={status === tab.key ? "primary" : "outline"}
                size="xs"
                className="w-[100px] shrink-0"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <LeaveYearFilter year={year} status={status} />
        </div>

        <div className="stagger-item" style={{ animationDelay: "70ms" }}>
          <LeaveRequestsTable rows={leaveRequests} />
        </div>
      </div>
    </>
  );
}
