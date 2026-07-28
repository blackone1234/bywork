"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/admin/Button";
import { TextField } from "@/components/admin/TextField";
import type { AttendanceDetailRow } from "@/lib/attendance";
import type { EditAttendanceRecordState } from "../actions";

/** A09(근무설정) 기본근무 탭의 시작/종료시간 입력과 동일한 스타일 — 실기기(iOS Safari)로
 * 확인한 결과 A09는 겹침 없이 정상 렌더링됨. 두 구현의 결정적 차이는 A09가 폭을 전혀
 * 강제하지 않는다는 것(auto/intrinsic 크기) — 공용 TextField 컴포넌트는 항상
 * width:100%를 강제하는데, 그게 네이티브 <input type="time"> 위젯과 부딪혀서 겹침이
 * 났던 것으로 보임(세로로 쌓아 옆에 경쟁 요소가 없을 때도 겹쳤던 것과 일치하는 설명 —
 * "옆 필드 침범"이 아니라 "강제된 폭과 네이티브 렌더링의 충돌"이었던 것). 그래서 이
 * 필드도 TextField를 안 쓰고 A09처럼 순수 <input>에 폭을 안 주는 방식으로 통일한다.
 */
const TIME_INPUT_CLASSNAME =
  "rounded-[12px] border border-divider px-[24px] py-[13px] text-[14px] font-semibold tracking-[-0.28px] text-black transition-[border,box-shadow] focus:border-2 focus:border-black focus:shadow-[2px_4px_2px_rgba(0,0,0,0.2)] focus:outline-none";

// "근무중"/"외출중" 같은 라이브(오늘 기준 진행형) 라벨 대신, 지나간 날짜를 기록하는
// 이 폼의 성격에 맞게 A07/A08 "비고" 컬럼과 같은 카테고리 용어를 쓴다. present를
// 선택했을 때 실제 "근무중"/"퇴근" 중 무엇으로 표시될지는 퇴근시간 입력 여부로
// 자동 결정된다(src/lib/attendance.ts의 defaultNote 참고) — 이 드롭다운은 그중
// "정상 출근" 카테고리를 고르는 것일 뿐, 완료 여부까지 여기서 고르는 게 아니다.
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "present", label: "정상" },
  { value: "remote", label: "외출/외근" },
  { value: "on_leave", label: "휴가" },
  { value: "absent", label: "결근" },
];

/**
 * 관리자 근태 강제 수정 모달 — TerminateButton.tsx와 동일한 이유로 createPortal을 쓴다
 * (A08 페이지의 다른 <form>들과 중첩되지 않게). useActionState 훅은 AttendanceReviewTable
 * 쪽에서 테이블 전체를 감싸는 컴포넌트 하나가 소유하고(확인완료 버튼과 같은 이유 —
 * 성공 시 이 행의 마크업이 바뀌어도 훅을 소유한 상위 컴포넌트는 안 바뀌므로 안전),
 * 이 모달은 그 formAction/state를 그대로 받아쓰기만 한다.
 */
export function EditAttendanceRecordModal({
  employeeId,
  row,
  formAction,
  state,
  onClose,
}: {
  employeeId: string;
  row: AttendanceDetailRow;
  formAction: (formData: FormData) => void;
  state: EditAttendanceRecordState;
  onClose: () => void;
}) {
  useEffect(() => {
    if (state.success) onClose();
  }, [state, onClose]);

  const isNew = row.id === null;
  const defaultCheckIn = row.checkIn === "-" ? "" : row.checkIn;
  const defaultCheckOut = row.checkOut === "-" ? "" : row.checkOut;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar-active/80 px-4">
      <div className="flex w-full max-w-[420px] flex-col gap-[20px] rounded-[12px] bg-white p-6 shadow-[2px_4px_3px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col gap-[4px]">
          <p className="text-subtitle font-bold text-black">{row.date} 근태 {isNew ? "추가" : "수정"}</p>
          {!isNew ? (
            <p className="text-badge font-semibold text-muted">
              원본값 — 출근 {row.checkIn} · 퇴근 {row.checkOut} · 비고 {row.note}
            </p>
          ) : (
            <p className="text-badge font-semibold text-muted">기록이 없는 날짜입니다. 새로 생성합니다.</p>
          )}
        </div>

        <form action={formAction} className="flex flex-col gap-[16px]">
          <input type="hidden" name="employeeId" value={employeeId} />
          <input type="hidden" name="workDate" value={row.workDate} />

          {/* A09(근무설정) 기본근무 탭 시간설정과 동일한 구조(flex + auto width, gap-10px)
              — CD가 실기기로 A09는 안 겹치는 것까지 확인해줘서 그 구조를 그대로 재사용. */}
          <div className="flex flex-col gap-[6px]">
            <div className="flex items-center gap-[10px]">
              <label className="flex flex-col gap-[6px]">
                <span className="text-badge font-semibold text-muted">출근시간</span>
                <input
                  type="time"
                  name="checkInTime"
                  defaultValue={defaultCheckIn}
                  className={TIME_INPUT_CLASSNAME}
                />
              </label>
              <label className="flex flex-col gap-[6px]">
                <span className="text-badge font-semibold text-muted">퇴근시간</span>
                <input
                  type="time"
                  name="checkOutTime"
                  defaultValue={defaultCheckOut}
                  className={TIME_INPUT_CLASSNAME}
                />
              </label>
            </div>
          </div>

          <label className="flex flex-col gap-[6px]">
            <span className="text-badge font-semibold text-muted">상태</span>
            <select
              name="status"
              defaultValue={row.status}
              className="w-full rounded-lg border border-divider px-[var(--space-14)] py-[var(--space-12)] text-body font-semibold text-black focus:border-2 focus:border-black focus:outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-badge text-muted">
              &quot;정상&quot;일 때 비고는 퇴근시간 입력 여부로 자동 결정됩니다(퇴근시간 없으면 &quot;근무중&quot;, 있으면 &quot;퇴근&quot;).
            </span>
          </label>

          <label className="flex flex-col gap-[6px]">
            <span className="text-badge font-semibold text-muted">비고</span>
            {/* 항상 빈 값에서 시작한다(row.note로 미리 채우지 않음) — 채워두면 관리자가
                안 건드리고 그대로 저장했을 때 그 시점의 문구가 그대로 다시 저장돼버려서,
                이후 출퇴근시간을 다시 바꿔도 비고가 "자동 결정"을 안 따라가고 예전 값에
                고정되는 문제가 있었다(예: 퇴근시간을 나중에 추가했는데 비고가 계속
                "근무중"으로 남아있던 실제 사례). 비워서 제출하면 서버가 null로 저장하고
                화면에서 상태 기준으로 다시 계산하므로, 직접 다른 문구를 입력하지 않는 한
                항상 최신 상태를 따라간다. */}
            <TextField
              type="text"
              name="note"
              defaultValue=""
              placeholder={`비워두면 자동으로 "${row.note}"(으)로 표시됩니다`}
              variant="compact"
            />
          </label>

          <label className="flex flex-col gap-[6px]">
            <span className="text-badge font-semibold text-muted">수정 사유 (필수)</span>
            <textarea
              name="reason"
              required
              rows={3}
              className="w-full rounded-lg border border-divider px-[var(--space-14)] py-[var(--space-12)] text-body font-semibold text-black placeholder:text-line focus:border-2 focus:border-black focus:outline-none"
              placeholder="수정 사유를 입력해주세요."
            />
          </label>

          {state.error ? (
            <p role="alert" className="text-body font-semibold text-red-600">
              {state.error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-[10px] pt-[6px]">
            <Button type="button" size="sm" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" variant="primary" size="sm">
              저장
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
