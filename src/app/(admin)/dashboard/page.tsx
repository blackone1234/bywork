import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatCard } from "@/components/admin/StatCard";
import { DataTable, TableText, type DataTableColumn } from "@/components/admin/DataTable";
import { getDashboardData, type DashboardAttendanceRow } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

const COLUMNS: DataTableColumn<DashboardAttendanceRow>[] = [
  { key: "name", label: "이름", render: (row) => <TableText>{row.name}</TableText> },
  { key: "state", label: "현재상태", render: (row) => <StatusBadge state={row.state} /> },
  { key: "checkIn", label: "출근시간", render: (row) => <TableText>{row.checkIn}</TableText> },
  { key: "checkOut", label: "퇴근시간", render: (row) => <TableText>{row.checkOut}</TableText> },
  { key: "outing", label: "외출/외근", render: (row) => <TableText>{row.outing}</TableText> },
  {
    key: "weeklyHours",
    label: "주간근무시간",
    render: (row) => <TableText>{row.weeklyHours}</TableText>,
  },
];

export default async function DashboardPage() {
  const { todayLabel, stats, rows, pendingLeaveCount, weeklyOverLimitCount } = await getDashboardData();

  // Figma엔 "52h 초과 있음" 전용 배너 variant가 없음(get_design_context로 확인—
  // notice 박스가 재사용 컴포넌트가 아니라 텍스트만 있는 단일 프레임) — 그래서 스타일은
  // 그대로 두고 문구만 카운트에 따라 바뀐다.
  const overLimitText =
    weeklyOverLimitCount === 0 ? "이번 주 52h 초과 직원 없음" : `이번 주 52h 초과 직원 ${weeklyOverLimitCount}명`;

  return (
    <>
      <PageHeader breadcrumb={[{ label: "Dashboard", href: "/dashboard" }]} />

      {/* 파일럿(A) — A01만 스태거 등장 적용(다른 관리자 화면은 확산 여부 결정 전까지 그대로). */}
      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <div className="stagger-item grid w-full grid-cols-2 gap-[10px] sm:grid-cols-3 lg:flex lg:items-start" style={{ animationDelay: "0ms" }}>
          <StatCard label="전체" value={`${stats.total}명`} />
          <StatCard label="출근중" value={`${stats.working}명`} />
          <StatCard label="외출/외근" value={`${stats.outing}명`} />
          <StatCard label="미출근" value={`${stats.notCheckedIn}명`} />
          <StatCard label="휴가" value={`${stats.onLeave}명`} />
        </div>

        <div
          className="stagger-item flex w-full items-center gap-[10px] rounded-[10px] border-2 border-black px-4 py-3 lg:px-[20px] lg:py-[14px]"
          style={{ animationDelay: "70ms" }}
        >
          <span aria-hidden className="text-[16px]">
            ⓘ
          </span>
          <p className="text-[14px] font-semibold tracking-[-0.28px] text-black">
            휴가 승인 대기 {pendingLeaveCount}건 · {overLimitText}
          </p>
        </div>

        <div className="stagger-item flex w-full flex-col gap-[36px] rounded-[10px]" style={{ animationDelay: "140ms" }}>
          <div className="flex w-full items-center justify-center gap-[12px]">
            <p className="text-[12px] font-semibold tracking-[-0.24px] text-muted">
              오늘 근무 현황
            </p>
            <p className="text-[16px] font-bold tracking-[-0.32px] text-black">{todayLabel}</p>
          </div>

          <DataTable
            columns={COLUMNS}
            rows={rows}
            rowKey={(row) => row.id}
            minWidthClassName="min-w-[720px]"
            rowGapClassName="gap-[var(--space-7)]"
          />
        </div>
      </div>
    </>
  );
}
