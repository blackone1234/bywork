import { PageHeader } from "@/components/admin/PageHeader";
import { LeaveStatusBadge } from "@/components/admin/LeaveStatusBadge";
import { FilterDropdown } from "@/components/admin/FilterDropdown";
import { Button } from "@/components/admin/Button";
import { DataTable, TableText, type DataTableColumn } from "@/components/admin/DataTable";
import { YEAR_OPTIONS, leaveRequests, type LeaveRequest } from "@/lib/dummy-data";

const FILTER_TABS = ["전체", "대기중", "승인", "반려"] as const;

const PROCESSED_LABEL: Record<string, string> = {
  승인: "승인완료",
  반려: "반려완료",
};

const COLUMNS: DataTableColumn<LeaveRequest>[] = [
  { key: "name", label: "이름", render: (row) => <TableText>{row.employeeName}</TableText> },
  { key: "type", label: "유형", render: (row) => <TableText>{row.leaveType}</TableText> },
  { key: "date", label: "날짜", render: (row) => <TableText>{row.date}</TableText> },
  { key: "status", label: "상태", render: (row) => <LeaveStatusBadge status={row.status} /> },
  {
    key: "actions",
    label: "처리",
    render: (row) =>
      row.status === "대기중" ? (
        <div className="flex items-center justify-center gap-[8px]">
          <Button size="sm">승인</Button>
          <Button size="sm">반려</Button>
        </div>
      ) : (
        <TableText>{PROCESSED_LABEL[row.status]}</TableText>
      ),
  },
];

export default function LeaveRequestsPage() {
  return (
    <>
      <PageHeader breadcrumb={["Dashboard", "휴가승인"]} />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-[8px] overflow-x-auto">
            {FILTER_TABS.map((tab, index) => (
              <Button
                key={tab}
                variant={index === 0 ? "primary" : "outline"}
                size="xs"
                className="w-[100px] shrink-0"
              >
                {tab}
              </Button>
            ))}
          </div>

          <FilterDropdown label="2026년" options={YEAR_OPTIONS} width={130} />
        </div>

        <DataTable columns={COLUMNS} rows={leaveRequests} rowKey={(row) => row.id} />
      </div>
    </>
  );
}
