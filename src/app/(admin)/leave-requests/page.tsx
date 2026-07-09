import { PageHeader } from "@/components/admin/PageHeader";
import { LeaveStatusBadge } from "@/components/admin/LeaveStatusBadge";
import { leaveRequests } from "@/lib/dummy-data";

const FILTER_TABS = ["전체", "대기중", "승인", "반려"] as const;
const TABLE_COLUMNS = ["이름", "유형", "날짜", "상태", "처리"];

const PROCESSED_LABEL: Record<string, string> = {
  승인: "승인완료",
  반려: "반려완료",
};

export default function LeaveRequestsPage() {
  return (
    <>
      <PageHeader breadcrumb={["Dashboard", "휴가승인"]} />

      <div className="flex flex-1 flex-col gap-[40px] px-[60px] pt-[50px] pb-[20px]">
        <div className="flex w-full items-start justify-between">
          <div className="flex items-center gap-[8px]">
            {FILTER_TABS.map((tab, index) => (
              <button
                key={tab}
                type="button"
                className={`w-[100px] rounded-[10px] px-[20px] py-[12px] text-[12px] font-semibold tracking-[-0.24px] ${
                  index === 0
                    ? "bg-sidebar-active text-white shadow-[2px_4px_2px_rgba(0,0,0,0.2)]"
                    : "border border-muted text-muted"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="flex w-[130px] items-center justify-between rounded-[30px] border border-divider px-[24px] py-[11px] text-[14px] font-semibold tracking-[-0.28px] text-line"
          >
            2026년
            <span aria-hidden>▾</span>
          </button>
        </div>

        <div className="flex w-full flex-col gap-[12px]">
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
            {leaveRequests.map((request) => (
              <div
                key={request.id}
                className="grid w-full grid-cols-5 items-center border-b border-divider pb-[12px]"
              >
                <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                  {request.employeeName}
                </p>
                <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                  {request.leaveType}
                </p>
                <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                  {request.date}
                </p>
                <div className="flex items-center justify-center">
                  <LeaveStatusBadge status={request.status} />
                </div>
                <div className="flex items-center justify-center gap-[8px]">
                  {request.status === "대기중" ? (
                    <>
                      <button
                        type="button"
                        className="rounded-[10px] border border-muted px-[16px] py-[8px] text-[12px] font-semibold tracking-[-0.24px] text-muted"
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        className="rounded-[10px] border border-muted px-[16px] py-[8px] text-[12px] font-semibold tracking-[-0.24px] text-muted"
                      >
                        반려
                      </button>
                    </>
                  ) : (
                    <p className="text-[14px] font-semibold tracking-[-0.28px] text-black">
                      {PROCESSED_LABEL[request.status]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
