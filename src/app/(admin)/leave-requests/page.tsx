import { PageHeader } from "@/components/admin/PageHeader";
import { LeaveStatusBadge } from "@/components/admin/LeaveStatusBadge";
import { LeaveYearFilter } from "@/components/admin/LeaveYearFilter";
import { Button } from "@/components/admin/Button";
import { DataTable, TableText, type DataTableColumn } from "@/components/admin/DataTable";
import { listLeaveRequests, type LeaveRequest, type LeaveStatusFilter } from "@/lib/leaveRequests";
import { approveLeaveRequest, rejectLeaveRequest } from "./actions";

export const dynamic = "force-dynamic";

const FILTER_TABS: { key: LeaveStatusFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pending", label: "대기중" },
  { key: "approved", label: "승인" },
  { key: "rejected", label: "반려" },
];

const STATUS_FILTER_VALUES = new Set<LeaveStatusFilter>(["all", "pending", "approved", "rejected"]);

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
          <form action={approveLeaveRequest.bind(null, row.id)}>
            <Button type="submit" size="sm">
              승인
            </Button>
          </form>
          <form action={rejectLeaveRequest.bind(null, row.id)}>
            <Button type="submit" size="sm">
              반려
            </Button>
          </form>
        </div>
      ) : (
        <TableText>{PROCESSED_LABEL[row.status]}</TableText>
      ),
  },
];

export default async function LeaveRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; year?: string }>;
}) {
  const params = await searchParams;
  const status = STATUS_FILTER_VALUES.has(params.status as LeaveStatusFilter)
    ? (params.status as LeaveStatusFilter)
    : "all";
  const year = Number(params.year) || new Date().getFullYear();

  const leaveRequests = await listLeaveRequests(status, year);

  return (
    <>
      <PageHeader breadcrumb={["Dashboard", "휴가승인"]} />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-[8px] overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <Button
                key={tab.key}
                href={`/leave-requests?status=${tab.key}&year=${year}`}
                variant={status === tab.key ? "primary" : "outline"}
                size="xs"
                className="w-[100px] shrink-0"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <LeaveYearFilter year={year} status={status} />
        </div>

        <DataTable columns={COLUMNS} rows={leaveRequests} rowKey={(row) => row.id} />
      </div>
    </>
  );
}
