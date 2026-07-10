import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterDropdown } from "@/components/admin/FilterDropdown";
import { StatCard } from "@/components/admin/StatCard";
import {
  MONTH_OPTIONS,
  YEAR_OPTIONS,
  employeeAttendanceDetail,
  employeeAttendanceStats,
  getEmployeeById,
} from "@/lib/dummy-data";

const TABLE_COLUMNS = ["날짜", "출근시간", "퇴근시간", "비고"];

export default async function AttendanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = getEmployeeById(id);

  if (!employee) {
    notFound();
  }

  return (
    <>
      <PageHeader
        breadcrumb={["Dashboard", "근태 데이터", `근태상세 - ${employee.name}`]}
      />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-[8px]">
            <FilterDropdown label="2026년" options={YEAR_OPTIONS} width={130} />
            <FilterDropdown label="7월" options={MONTH_OPTIONS} width={110} />
          </div>

          <button
            type="button"
            className="self-start rounded-[10px] border border-muted px-[24px] py-[13px] pl-[20px] text-[12px] font-semibold tracking-[-0.24px] text-muted transition-colors hover:border-sidebar-active hover:bg-sidebar-active hover:text-white"
          >
            엑셀 다운로드
          </button>
        </div>

        <div className="grid w-full grid-cols-1 gap-[10px] sm:grid-cols-3">
          <StatCard label="총 근무일" value={employeeAttendanceStats.totalWorkDays} />
          <StatCard label="총 근무시간" value={employeeAttendanceStats.totalWorkHours} />
          <StatCard label="연차사용" value={employeeAttendanceStats.usedLeaveDays} />
        </div>

        <div className="w-full overflow-x-auto">
          <div className="flex w-full min-w-[520px] flex-col gap-[12px]">
            <div className="grid w-full grid-cols-4 border-b-2 border-black pb-[14px]">
              {TABLE_COLUMNS.map((column) => (
                <p
                  key={column}
                  className="text-center text-[14px] font-semibold tracking-[-0.28px] text-muted"
                >
                  {column}
                </p>
              ))}
            </div>

            <div className="flex w-full flex-col gap-[11px]">
              {employeeAttendanceDetail.map((row) => (
                <div
                  key={row.id}
                  className="grid h-[42px] w-full grid-cols-4 items-center border-b border-divider pb-[12px]"
                >
                  <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                    {row.date}
                  </p>
                  <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                    {row.checkIn}
                  </p>
                  <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                    {row.checkOut}
                  </p>
                  <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                    {row.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
