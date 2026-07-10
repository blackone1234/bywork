import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatCard } from "@/components/admin/StatCard";
import { dashboardNotice, dashboardStats, todayAttendance } from "@/lib/dummy-data";

const TABLE_COLUMNS = [
  "이름",
  "현재상태",
  "출근시간",
  "퇴근시간",
  "외출/외근",
  "주간근무시간",
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

          <div className="w-full overflow-x-auto">
            <div className="flex w-full min-w-[720px] flex-col gap-[12px]">
              <div className="grid w-full grid-cols-6 border-b-2 border-black pb-[14px]">
                {TABLE_COLUMNS.map((column) => (
                  <p
                    key={column}
                    className="text-center text-[14px] font-semibold tracking-[-0.28px] text-muted"
                  >
                    {column}
                  </p>
                ))}
              </div>

              <div className="flex w-full flex-col gap-[7px]">
                {todayAttendance.map((row) => (
                  <div
                    key={row.id}
                    className="grid w-full grid-cols-6 items-center border-b border-divider pb-[12px]"
                  >
                    <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                      {row.name}
                    </p>
                    <div className="flex items-center justify-center">
                      <StatusBadge state={row.state} />
                    </div>
                    <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                      {row.checkIn}
                    </p>
                    <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                      {row.checkOut}
                    </p>
                    <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                      {row.outing}
                    </p>
                    <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                      {row.weeklyHours}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
