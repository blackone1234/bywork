import { PageHeader } from "@/components/admin/PageHeader";
import { FilterDropdown } from "@/components/admin/FilterDropdown";
import { Button } from "@/components/admin/Button";
import { DataTable, TableText, type DataTableColumn } from "@/components/admin/DataTable";
import {
  MONTH_OPTIONS,
  YEAR_OPTIONS,
  monthlyAttendance,
  type MonthlyAttendanceRow,
} from "@/lib/dummy-data";

const COLUMNS: DataTableColumn<MonthlyAttendanceRow>[] = [
  { key: "name", label: "이름", render: (row) => <TableText>{row.employeeName}</TableText> },
  { key: "date", label: "날짜", render: (row) => <TableText>{row.date}</TableText> },
  { key: "checkIn", label: "출근시간", render: (row) => <TableText>{row.checkIn}</TableText> },
  { key: "checkOut", label: "퇴근시간", render: (row) => <TableText>{row.checkOut}</TableText> },
  {
    key: "weeklyHours",
    label: "주간근무시간",
    render: (row) => <TableText>{row.weeklyHours}</TableText>,
  },
];

export default function AttendancePage() {
  return (
    <>
      <PageHeader breadcrumb={["Dashboard", "근태 데이터"]} />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-[8px]">
            <FilterDropdown label="2026년" options={YEAR_OPTIONS} width={130} />
            <FilterDropdown label="7월" options={MONTH_OPTIONS} width={110} />
          </div>

          <div className="flex items-center gap-[8px]">
            <Button size="toolbar">전체직원</Button>
            <Button size="toolbar">엑셀 다운로드</Button>
          </div>
        </div>

        <DataTable
          columns={COLUMNS}
          rows={monthlyAttendance}
          rowKey={(row) => row.id}
          rowHref={(row) => `/attendance/${row.employeeId}`}
          rowHeightClassName="h-[42px]"
        />
      </div>
    </>
  );
}
