"use client";

import { useActionState, useEffect, useState } from "react";
import { AttendanceReviewBadge } from "@/components/admin/AttendanceReviewBadge";
import { Button } from "@/components/admin/Button";
import { useToast } from "@/components/admin/ToastProvider";
import { DataTable, TableText, type DataTableColumn } from "@/components/admin/DataTable";
import type { AttendanceDetailRow } from "@/lib/attendance";
import { confirmAttendanceReview, editAttendanceRecord, type ConfirmReviewState, type EditAttendanceRecordState } from "../actions";
import { EditAttendanceRecordModal } from "./EditAttendanceRecordModal";

const INITIAL_CONFIRM_STATE: ConfirmReviewState = {};
const INITIAL_EDIT_STATE: EditAttendanceRecordState = {};

/**
 * A08 "확인완료" — useActionState 훅을 테이블 전체를 감싸는 이 컴포넌트 하나에서만
 * 호출한다(행마다 따로 두지 않는다). recordId를 확인한 행은 "검토필요" 배지+버튼에서
 * "정상" 텍스트로 바뀌면서 그 행의 마크업 자체가 교체되는데, 만약 useActionState를
 * 행 단위 컴포넌트에 뒀다면 확인 성공과 동시에 그 컴포넌트가 unmount되면서 토스트
 * 트리거도 같이 사라진다(실제로 라이브 테스트에서 발견한 버그) — 그래서 테이블을
 * 감싸는 이 컴포넌트는 행 내용이 바뀌어도 계속 살아있도록 한 단계 위에 둔다. 전역
 * 토스트 스택으로 옮긴 뒤에도 이 원칙은 그대로 유효 — showToast() 호출 자체가 이
 * 컴포넌트의 effect에서 일어나야 unmount와 무관하게 항상 발생한다.
 *
 * 관리자 근태 강제수정("수정"/"기록 추가")도 같은 이유로 훅을 이 컴포넌트에 둔다.
 */
export function AttendanceReviewTable({
  employeeId,
  rows,
}: {
  employeeId: string;
  rows: AttendanceDetailRow[];
}) {
  const [confirmState, confirmFormAction] = useActionState(confirmAttendanceReview, INITIAL_CONFIRM_STATE);
  const [editState, editFormAction] = useActionState(editAttendanceRecord, INITIAL_EDIT_STATE);
  const [editingWorkDate, setEditingWorkDate] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (confirmState.success) {
      showToast("검토가 확정되었습니다.");
    }
  }, [confirmState, showToast]);

  useEffect(() => {
    if (editState.success) {
      showToast("근태 기록이 저장되었습니다.");
    }
  }, [editState, showToast]);

  const editingRow = rows.find((row) => row.workDate === editingWorkDate) ?? null;

  const columns: DataTableColumn<AttendanceDetailRow>[] = [
    { key: "date", label: "날짜", render: (row) => <TableText>{row.date}</TableText> },
    { key: "checkIn", label: "출근시간", render: (row) => <TableText>{row.checkIn}</TableText> },
    { key: "checkOut", label: "퇴근시간", render: (row) => <TableText>{row.checkOut}</TableText> },
    {
      key: "note",
      label: "비고",
      render: (row) =>
        row.hasPendingReview ? (
          // 좁은 화면(관리자 화면을 모바일 브라우저 폭에서 볼 때, CD가 스크린샷으로 직접
          // 지적)에서 배지/버튼이 grid 컬럼의 1fr 몫보다 넓어지면 flex가 기본적으로
          // 줄바꿈/축소를 허용해서 "검토\n필요"/"확인\n완료"처럼 텍스트가 두 줄로 쪼개지며
          // 서로 겹치는 것처럼 보이던 버그 — shrink-0 + whitespace-nowrap으로 항상
          // 한 줄 폭을 유지하게 하고, 컬럼이 그보다 좁으면(테이블 자체가 overflow-x-auto라)
          // 가로 스크롤로 해결되게 한다(텍스트 줄바꿈이 아니라 스크롤이 좁은 화면의
          // 정상적인 대응 방식).
          <div className="flex shrink-0 items-center justify-center gap-[8px]">
            {/* 사유 호버 툴팁 — Figma get_design_context 실측: 검은 배경(dark), 텍스트는
                status-outside(#ffe09e) 색. group-hover로 순수 CSS 토글. */}
            <div className="group relative shrink-0">
              <AttendanceReviewBadge variant="pending">검토필요</AttendanceReviewBadge>
              {row.pendingReason ? (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-[8px] w-max max-w-[262px] -translate-x-1/2 rounded-[14px] bg-black px-[var(--space-20)] py-[14px] text-body font-semibold whitespace-pre-line text-status-outside opacity-0 shadow-[2px_4px_2px_rgba(0,0,0,0.25)] transition-opacity group-hover:opacity-100">
                  {row.pendingReason}
                </div>
              ) : null}
            </div>
            <form action={confirmFormAction} className="shrink-0">
              <input type="hidden" name="recordId" value={row.id ?? ""} />
              <input type="hidden" name="employeeId" value={employeeId} />
              <Button type="submit" variant="primary" size="sm" className="whitespace-nowrap">
                확인완료
              </Button>
            </form>
          </div>
        ) : (
          <TableText>{row.note}</TableText>
        ),
    },
    {
      key: "manage",
      label: "관리",
      render: (row) =>
        // 검토대기중인 날짜는 수정 버튼을 안 보여준다(어차피 서버에서도 막힘 — 확인완료를
        // 먼저 하도록 유도, race 상황을 위한 안전장치로 서버 체크는 그대로 둔다).
        row.hasPendingReview ? (
          <TableText>-</TableText>
        ) : (
          <button
            type="button"
            onClick={() => setEditingWorkDate(row.workDate)}
            className="rounded-md border border-muted px-[var(--space-16)] py-[var(--space-8)] text-badge font-semibold whitespace-nowrap text-muted transition-colors hover:border-sidebar-active hover:bg-sidebar-active hover:text-white"
          >
            {row.id ? "수정" : "기록 추가"}
          </button>
        ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-[12px]">
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.workDate}
        minWidthClassName="min-w-[620px]"
        rowHeightClassName="h-[42px]"
      />
      {confirmState.error ? (
        <p role="alert" className="text-body font-semibold text-red-600">
          {confirmState.error}
        </p>
      ) : null}

      {editingRow ? (
        <EditAttendanceRecordModal
          employeeId={employeeId}
          row={editingRow}
          formAction={editFormAction}
          state={editState}
          onClose={() => setEditingWorkDate(null)}
        />
      ) : null}
    </div>
  );
}
