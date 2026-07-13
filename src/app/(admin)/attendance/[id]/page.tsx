import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { AttendanceMonthFilter } from "@/components/admin/AttendanceMonthFilter";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/admin/Button";
import { DataTable, TableText, type DataTableColumn } from "@/components/admin/DataTable";
import { getEmployee } from "@/lib/employees";
import { getEmployeeAttendanceDetail, type AttendanceDetailRow } from "@/lib/attendance";

export const dynamic = "force-dynamic";

const COLUMNS: DataTableColumn<AttendanceDetailRow>[] = [
  { key: "date", label: "날짜", render: (row) => <TableText>{row.date}</TableText> },
  { key: "checkIn", label: "출근시간", render: (row) => <TableText>{row.checkIn}</TableText> },
  { key: "checkOut", label: "퇴근시간", render: (row) => <TableText>{row.checkOut}</TableText> },
  { key: "note", label: "비고", render: (row) => <TableText>{row.note}</TableText> },
];

export default async function AttendanceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const employee = await getEmployee(id);

  if (!employee) {
    notFound();
  }

  const now = new Date();
  const year = Number(query.year) || now.getFullYear();
  const month = Number(query.month) || now.getMonth() + 1;

  const { rows, stats } = await getEmployeeAttendanceDetail(id, year, month);

  return (
    <>
      <PageHeader
        breadcrumb={["Dashboard", "근태 데이터", `근태상세 - ${employee.name}`]}
      />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <AttendanceMonthFilter year={year} month={month} />

          <Button size="toolbar" className="self-start">
            엑셀 다운로드
          </Button>
        </div>

        <div className="grid w-full grid-cols-2 gap-[10px] sm:grid-cols-4">
          <StatCard label="총 근무일" value={stats.totalWorkDays} />
          <StatCard label="총 근무시간" value={stats.totalWorkHours} />
          <StatCard label="연차사용" value={stats.usedLeaveDays} />
          <StatCard label="결근일수" value={stats.absentDays} />
        </div>

        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey={(row) => row.id}
          minWidthClassName="min-w-[520px]"
          rowHeightClassName="h-[42px]"
        />
      </div>
    </>
  );
}
