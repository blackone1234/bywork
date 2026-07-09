import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterDropdown } from "@/components/admin/FilterDropdown";
import { StatCard } from "@/components/admin/StatCard";
import {
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

      <div className="flex flex-1 flex-col gap-[40px] px-[60px] pt-[50px] pb-[20px]">
        <div className="flex w-full items-start justify-between">
          <div className="flex items-center gap-[8px]">
            <FilterDropdown label="2026년" width={130} />
            <FilterDropdown label="7월" width={110} />
          </div>

          <button
            type="button"
            className="rounded-[10px] border border-muted px-[24px] py-[13px] pl-[20px] text-[12px] font-semibold tracking-[-0.24px] text-muted"
          >
            엑셀 다운로드
          </button>
        </div>

        <div className="flex w-full items-start gap-[10px]">
          <StatCard label="총 근무일" value={employeeAttendanceStats.totalWorkDays} />
          <StatCard label="총 근무시간" value={employeeAttendanceStats.totalWorkHours} />
          <StatCard label="연차사용" value={employeeAttendanceStats.usedLeaveDays} />
        </div>

        <div className="flex w-full flex-col gap-[12px]">
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
    </>
  );
}
