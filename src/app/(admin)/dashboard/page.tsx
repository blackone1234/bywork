import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatCard } from "@/components/admin/StatCard";
import { DataTable, TableText, type DataTableColumn } from "@/components/admin/DataTable";
import {
  dashboardNotice,
  dashboardStats,
  todayAttendance,
  type TodayAttendanceRow,
} from "@/lib/dummy-data";

const COLUMNS: DataTableColumn<TodayAttendanceRow>[] = [
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

export default function DashboardPage() {
  return (
    <>
      <PageHeader breadcrumb={["Dashboard"]} />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <div className="grid w-full grid-cols-2 gap-[10px] sm:grid-cols-3 lg:flex lg:items-start">
          {dashboardStats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.count} />
          ))}
        </div>

        <div className="flex w-full items-center gap-[10px] rounded-[10px] border-2 border-black px-4 py-3 lg:px-[20px] lg:py-[14px]">
          <span aria-hidden className="text-[16px]">
            ⓘ
          </span>
          <p className="text-[14px] font-semibold tracking-[-0.28px] text-black">
            {dashboardNotice}
          </p>
        </div>

        <div className="flex w-full flex-col gap-[36px] rounded-[10px]">
          <div className="flex w-full items-center justify-center gap-[12px]">
            <p className="text-[12px] font-semibold tracking-[-0.24px] text-muted">
              오늘 근무 현황
            </p>
            <p className="text-[16px] font-bold tracking-[-0.32px] text-black">
              2026.07.10
            </p>
          </div>

          <DataTable
            columns={COLUMNS}
            rows={todayAttendance}
            rowKey={(row) => row.id}
            minWidthClassName="min-w-[720px]"
            rowGapClassName="gap-[7px]"
          />
        </div>
      </div>
    </>
  );
}
