import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterDropdown } from "@/components/admin/FilterDropdown";
import { monthlyAttendance } from "@/lib/dummy-data";

const TABLE_COLUMNS = ["이름", "날짜", "출근시간", "퇴근시간", "주간근무시간"];

export default function AttendancePage() {
  return (
    <>
      <PageHeader breadcrumb={["Dashboard", "근태 데이터"]} />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-[8px]">
            <FilterDropdown label="2026년" width={130} />
            <FilterDropdown label="7월" width={110} />
          </div>

          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              className="rounded-[10px] border border-muted px-[24px] py-[13px] pl-[20px] text-[12px] font-semibold tracking-[-0.24px] text-muted transition-colors hover:border-black hover:bg-page hover:text-black"
            >
              전체직원
            </button>
            <button
              type="button"
              className="rounded-[10px] border border-muted px-[24px] py-[13px] pl-[20px] text-[12px] font-semibold tracking-[-0.24px] text-muted transition-colors hover:border-black hover:bg-page hover:text-black"
            >
              엑셀 다운로드
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="flex w-full min-w-[640px] flex-col gap-[12px]">
            <div className="grid w-full grid-cols-5 border-b-2 border-black pb-[14px]">
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
              {monthlyAttendance.map((row) => (
                <Link
                  key={row.id}
                  href={`/attendance/${row.employeeId}`}
                  className="grid h-[42px] w-full grid-cols-5 items-center border-b border-divider pb-[12px] transition-colors hover:bg-white"
                >
                  <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                    {row.employeeName}
                  </p>
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
                    {row.weeklyHours}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
