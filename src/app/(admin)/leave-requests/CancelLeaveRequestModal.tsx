"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/admin/Button";
import type { ProcessLeaveRequestState } from "./actions";

/**
 * A06 "승인" 탭 취소 확인 모달 — EditAttendanceRecordModal/TerminateButton과 동일한
 * 이유로 createPortal 사용. 사유가 필수(서버 액션에서도 재검증)라 인라인 버튼 대신
 * 모달로 받는다. useActionState 훅은 LeaveRequestsTable이 테이블 전체를 감싸는
 * 컴포넌트 레벨에서 소유(확인완료/근태수정 모달과 동일한 이유 — 처리 성공 시 이
 * 행의 마크업이 바뀌어도 훅을 소유한 상위 컴포넌트는 안 바뀌므로 토스트가 살아남음).
 */
export function CancelLeaveRequestModal({
  employeeName,
  requestId,
  formAction,
  state,
  onClose,
}: {
  employeeName: string;
  requestId: string;
  formAction: (formData: FormData) => void;
  state: ProcessLeaveRequestState;
  onClose: () => void;
}) {
  useEffect(() => {
    if (state.success) onClose();
  }, [state, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar-active/80 px-4">
      <div className="flex w-full max-w-[420px] flex-col gap-[20px] rounded-[12px] bg-white p-6 shadow-[2px_4px_3px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col gap-[4px]">
          <p className="text-subtitle font-bold text-black">{employeeName} 휴가 취소</p>
          <p className="text-badge font-semibold text-muted">
            이미 승인된 휴가를 취소합니다. 사용된 연차 일수가 자동으로 복원됩니다.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-[16px]">
          <input type="hidden" name="requestId" value={requestId} />

          <label className="flex flex-col gap-[6px]">
            <span className="text-badge font-semibold text-muted">취소 사유 (필수)</span>
            <textarea
              name="reason"
              required
              rows={3}
              className="w-full rounded-lg border border-divider px-[var(--space-14)] py-[var(--space-12)] text-body font-semibold text-black placeholder:text-line focus:border-2 focus:border-black focus:outline-none"
              placeholder="취소 사유를 입력해주세요."
            />
          </label>

          {state.error ? (
            <p role="alert" className="text-body font-semibold text-red-600">
              {state.error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-[10px] pt-[6px]">
            <Button type="button" size="sm" onClick={onClose}>
              닫기
            </Button>
            <Button type="submit" variant="primary" size="sm">
              취소 처리
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
