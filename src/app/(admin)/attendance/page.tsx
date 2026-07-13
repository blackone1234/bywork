import { PageHeader } from "@/components/admin/PageHeader";
import { AttendanceMonthFilter } from "@/components/admin/AttendanceMonthFilter";
import { Button } from "@/components/admin/Button";
import { DataTable, TableText, type DataTableColumn } from "@/components/admin/DataTable";
import { listMonthlyAttendance, type MonthlyAttendanceRow } from "@/lib/attendance";

export const dynamic = "force-dynamic";

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

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;

  const monthlyAttendance = await listMonthlyAttendance(year, month);

  return (
    <>
      <PageHeader breadcrumb={["Dashboard", "근태 데이터"]} />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <AttendanceMonthFilter year={year} month={month} />

          <div className="flex items-center gap-[8px]">
            <Button size="toolbar">전체직원</Button>
            <Button size="toolbar">엑셀 다운로드</Button>
          </div>
        </div>

        <DataTable
          columns={COLUMNS}
          rows={monthlyAttendance}
          rowKey={(row) => row.id}
          rowHref={(row) => `/attendance/${row.employeeId}?year=${year}&month=${month}`}
          rowHeightClassName="h-[42px]"
        />
      </div>
    </>
  );
}
