"use client";

import { useActionState, useEffect, useState } from "react";
import { LeaveStatusBadge } from "@/components/admin/LeaveStatusBadge";
import { Button } from "@/components/admin/Button";
import { useToast } from "@/components/admin/ToastProvider";
import { DataTable, TableText, type DataTableColumn } from "@/components/admin/DataTable";
import type { LeaveRequest } from "@/lib/leaveRequests";
import { approveLeaveRequest, rejectLeaveRequest, cancelLeaveRequest, type ProcessLeaveRequestState } from "./actions";
import { CancelLeaveRequestModal } from "./CancelLeaveRequestModal";

const INITIAL_STATE: ProcessLeaveRequestState = {};

const PROCESSED_LABEL: Record<string, string> = {
  반려: "반려완료",
  취소: "취소완료",
};

/**
 * A06 승인/반려 — useActionState 훅 2개(승인/반려)를 테이블 전체를 감싸는 이 컴포넌트
 * 하나에서만 호출한다(행마다 두지 않는다). 처리된 행은 "승인"/"반려" 버튼 2개에서
 * "승인완료"/"반려완료" 텍스트로 바뀌면서 그 행 마크업 자체가 교체되는데, A08에서
 * 실제로 겪었듯 useActionState를 행 단위 컴포넌트에 두면 처리 성공과 동시에 그
 * 컴포넌트가 unmount되며 토스트 트리거도 같이 사라진다 — 그래서 테이블을 감싸는
 * 이 컴포넌트가 행 내용이 바뀌어도 계속 살아있도록 한 단계 위에서 관리한다.
 */
export function LeaveRequestsTable({ rows }: { rows: LeaveRequest[] }) {
  const [approveState, approveAction] = useActionState(approveLeaveRequest, INITIAL_STATE);
  const [rejectState, rejectAction] = useActionState(rejectLeaveRequest, INITIAL_STATE);
  const [cancelState, cancelAction] = useActionState(cancelLeaveRequest, INITIAL_STATE);
  const { showToast } = useToast();

  // 취소 확인 모달을 띄울 대상 행 id — 확인완료/근태수정 모달과 동일한 이유로
  // useActionState 훅은 위(테이블 레벨)에서 소유하고, 이 state는 어느 행의 모달을
  // 열지만 결정한다.
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const cancellingRow = rows.find((row) => row.id === cancellingId) ?? null;

  useEffect(() => {
    if (approveState.success) showToast("휴가 신청을 승인했습니다.");
  }, [approveState, showToast]);
  useEffect(() => {
    if (rejectState.success) showToast("휴가 신청을 반려했습니다.");
  }, [rejectState, showToast]);
  // 모달 닫힘은 CancelLeaveRequestModal 자신의 useEffect(state.success → onClose)가
  // 처리한다(EditAttendanceRecordModal과 동일 패턴) — 여기서는 토스트만 띄운다.
  useEffect(() => {
    if (cancelState.success) showToast("휴가 신청을 취소했습니다.");
  }, [cancelState, showToast]);

  const columns: DataTableColumn<LeaveRequest>[] = [
    { key: "name", label: "이름", render: (row) => <TableText>{row.employeeName}</TableText> },
    { key: "type", label: "유형", render: (row) => <TableText>{row.leaveType}</TableText> },
    { key: "date", label: "날짜", render: (row) => <TableText>{row.date}</TableText> },
    { key: "status", label: "상태", render: (row) => <LeaveStatusBadge status={row.status} /> },
    {
      key: "actions",
      label: "처리",
      render: (row) => {
        if (row.status === "대기중") {
          return (
            <div className="flex items-center justify-center gap-[8px]">
              <form action={approveAction}>
                <input type="hidden" name="requestId" value={row.id} />
                <Button type="submit" size="sm">
                  승인
                </Button>
              </form>
              <form action={rejectAction}>
                <input type="hidden" name="requestId" value={row.id} />
                <Button type="submit" size="sm">
                  반려
                </Button>
              </form>
            </div>
          );
        }
        if (row.status === "승인") {
          return (
            <Button size="sm" onClick={() => setCancellingId(row.id)}>
              취소
            </Button>
          );
        }
        return <TableText>{PROCESSED_LABEL[row.status]}</TableText>;
      },
    },
  ];

  return (
    <div className="flex w-full flex-col gap-[12px]">
      <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />
      {approveState.error ? (
        <p role="alert" className="text-body font-semibold text-red-600">
          {approveState.error}
        </p>
      ) : null}
      {rejectState.error ? (
        <p role="alert" className="text-body font-semibold text-red-600">
          {rejectState.error}
        </p>
      ) : null}
      {cancellingRow ? (
        <CancelLeaveRequestModal
          employeeName={cancellingRow.employeeName}
          requestId={cancellingRow.id}
          formAction={cancelAction}
          state={cancelState}
          onClose={() => setCancellingId(null)}
        />
      ) : null}
    </div>
  );
}
