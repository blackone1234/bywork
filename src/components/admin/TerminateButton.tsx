"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/admin/Button";

/**
 * A05 — 퇴사처리 확인 (모달). 원래 "퇴사처리" 버튼이 존재하지 않는 라우트
 * (`/employees/[id]/terminate`)로 링크돼 있던 버그를 고치면서 신설 — Figma가
 * 애초에 별도 페이지가 아니라 모달로 설계해뒀던 걸 그대로 구현. NewEmployeeForm의
 * "재입사 확인" 다이얼로그와 동일한 오버레이/카드 패턴을 재사용한다(이 프로젝트에
 * 이미 검증된 유일한 확인 모달 패턴).
 *
 * 이 버튼은 A04 페이지의 바깥 <form action={updateEmployeeAuthMethod}> 안에 배치되므로,
 * 확인 모달 자체를 또 <form>으로 만들면 HTML에 <form> 중첩이 생겨 브라우저가 제출을
 * 깨뜨린다(React가 "A React form was unexpectedly submitted" 경고를 던지고 액션이
 * 아예 실행되지 않음) — createPortal로 모달을 document.body에 그려서 실제 DOM 상
 * 바깥 form의 자식이 되지 않게 한다.
 */
export function TerminateButton({
  employeeName,
  terminateAction,
}: {
  employeeName: string;
  terminateAction: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Button type="button" variant="primary" className="w-full sm:w-[140px]" onClick={() => setConfirming(true)}>
        퇴사처리
      </Button>
      {confirming
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar-active/80 px-4">
              <div className="flex w-full max-w-[298px] flex-col items-center gap-[20px] rounded-[12px] bg-white p-6 shadow-[2px_4px_3px_rgba(0,0,0,0.2)]">
                <div className="flex flex-col items-center gap-[12px] text-center">
                  <p className="text-subtitle font-bold text-black">퇴사 처리 확인</p>
                  <span className="flex size-[32px] items-center justify-center rounded-full bg-status-work text-[16px]">
                    ✓
                  </span>
                  <p className="text-badge font-semibold leading-[18px] text-muted">
                    {employeeName} 직원을 퇴사 처리합니다.
                    <br />
                    근태 데이터는 3년간 보존됩니다.
                  </p>
                </div>
                <form action={terminateAction} className="flex w-full items-start gap-[10px]">
                  <Button type="button" size="xs" className="flex-1" onClick={() => setConfirming(false)}>
                    취소
                  </Button>
                  <Button type="submit" size="xs" className="flex-1">
                    퇴사처리
                  </Button>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
