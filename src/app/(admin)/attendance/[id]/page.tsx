import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterDropdown } from "@/components/admin/FilterDropdown";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/admin/Button";
import { DataTable, TableText, type DataTableColumn } from "@/components/admin/DataTable";
import {
  MONTH_OPTIONS,
  YEAR_OPTIONS,
  employeeAttendanceDetail,
  employeeAttendanceStats,
  getEmployeeById,
  type AttendanceDetailRow,
} from "@/lib/dummy-data";

const COLUMNS: DataTableColumn<AttendanceDetailRow>[] = [
  { key: "date", label: "날짜", render: (row) => <TableText>{row.date}</TableText> },
  { key: "checkIn", label: "출근시간", render: (row) => <TableText>{row.checkIn}</TableText> },
  { key: "checkOut", label: "퇴근시간", render: (row) => <TableText>{row.checkOut}</TableText> },
  { key: "note", label: "비고", render: (row) => <TableText>{row.note}</TableText> },
];

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

          <Button size="toolbar" className="self-start">
            엑셀 다운로드
          </Button>
        </div>

        <div className="grid w-full grid-cols-1 gap-[10px] sm:grid-cols-3">
          <StatCard label="총 근무일" value={employeeAttendanceStats.totalWorkDays} />
          <StatCard label="총 근무시간" value={employeeAttendanceStats.totalWorkHours} />
          <StatCard label="연차사용" value={employeeAttendanceStats.usedLeaveDays} />
        </div>

        <DataTable
          columns={COLUMNS}
          rows={employeeAttendanceDetail}
          rowKey={(row) => row.id}
          minWidthClassName="min-w-[520px]"
          rowHeightClassName="h-[42px]"
        />
      </div>
    </>
  );
}
