"use client";

import { useActionState, useEffect } from "react";
import { DetailRow } from "@/components/admin/DetailRow";
import { AuthMethodSelect } from "@/components/admin/AuthMethodSelect";
import { Button } from "@/components/admin/Button";
import { TextField } from "@/components/admin/TextField";
import { TerminateButton } from "@/components/admin/TerminateButton";
import { useToast } from "@/components/admin/ToastProvider";
import type { Employee } from "@/lib/employees";
import type { LeavePolicyType } from "@/lib/leavePolicies";
import { updateEmployeeAuthMethod, type UpdateAuthMethodState } from "../actions";
import { SendResetEmailButton } from "./SendResetEmailButton";

const INITIAL_STATE: UpdateAuthMethodState = {};

export function EmployeeDetailForm({
  employee,
  workdaysLabel,
  leavePolicy,
  terminateAction,
}: {
  employee: Employee;
  /** company_settings.workdays를 한글 라벨로 변환한 값 — 직원별 개별 요일 설정은
   * 스키마에 없어서(A09 안내문과 동일 전제) 회사 공통값을 그대로 보여준다. */
  workdaysLabel: string;
  /** A09/A11에서 설정한 회사 전체 연차 정책 — statutory면 읽기전용(자동계산값 표시),
   * manual이면 직원별로 값을 직접 입력할 수 있다. */
  leavePolicy: LeavePolicyType;
  terminateAction: () => Promise<void>;
}) {
  const updateAuthMethodWithId = updateEmployeeAuthMethod.bind(null, employee.id);
  const [state, formAction] = useActionState(updateAuthMethodWithId, INITIAL_STATE);
  const { showToast } = useToast();

  // state는 제출마다 새 객체 레퍼런스를 갖는다 — 이 effect는 실제 새 제출 결과가
  // 들어올 때만 실행되고(초기 마운트 시 INITIAL_STATE는 success가 없어 무해), 전역
  // 스택에 토스트를 한 번만 추가한다(로컬에서 show/dismiss를 직접 관리하지 않음).
  useEffect(() => {
    if (state.success) {
      // 이 폼이 인증방식뿐 아니라 연차(관리자수동입력 모드)도 같이 저장하게 되면서
      // "인증 방식이 저장되었습니다"는 연차만 수정한 경우에도 뜨는 부정확한 문구가
      // 됐다 — 폼 전체를 아우르는 문구로 교체.
      showToast("직원 정보가 저장되었습니다.");
    }
  }, [state, showToast]);

  return (
    <div className="flex flex-1 flex-col px-4 py-6 sm:px-8 lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
      {/* 그룹3(A 확산) — 기본정보/근무설정/버튼행 3섹션에 스태거 적용. */}
      <div className="flex w-full flex-col gap-10 lg:gap-[80px]">
        {/* "기본정보" 섹션은 편집 가능한 필드가 하나도 없다(전부 읽기전용 텍스트, 유일한
            인터랙션이 비밀번호 초기화 버튼) — 그 버튼이 자기 자신만의 <form>(useActionState)을
            가져야 해서, 아래 근무설정 저장 폼과 겹치지 않도록 이 섹션 전체를 그 폼 밖에 둔다
            (HTML은 <form> 중첩을 허용하지 않는다 — A05 TerminateButton 때와 같은 이유). */}
        <div className="stagger-item flex w-full flex-col gap-[18px]" style={{ animationDelay: "0ms" }}>
          <h2 className="text-heading font-bold text-black">기본정보</h2>
          <div className="flex w-full flex-col divide-y divide-divider border-t-2 border-b-2 border-black">
            <DetailRow label="이름">
              <span className="text-subtitle font-bold text-black">{employee.name}</span>
            </DetailRow>
            <DetailRow label="입사일">
              <span className="text-subtitle font-bold text-black">{employee.hireDate}</span>
            </DetailRow>
            <DetailRow label="이메일">
              <span className="flex-1 text-subtitle font-bold text-black">{employee.email}</span>
              <SendResetEmailButton email={employee.email} />
            </DetailRow>
          </div>
        </div>

        <form action={formAction} className="stagger-item flex w-full flex-col gap-10 lg:gap-[80px]" style={{ animationDelay: "70ms" }}>
          <div className="flex w-full flex-col gap-[18px]">
            <h2 className="text-heading font-bold text-black">근무설정 (개별)</h2>
            <div className="flex w-full flex-col divide-y divide-divider border-t-2 border-b-2 border-black">
              <DetailRow label="요일">
                <span className="text-subtitle font-bold text-black">{workdaysLabel}</span>
              </DetailRow>
              <DetailRow label="연차">
                {leavePolicy === "manual" ? (
                  <>
                    <TextField
                      type="number"
                      name="annualLeaveDays"
                      variant="compact"
                      className="max-w-[100px]"
                      step="0.5"
                      min="0"
                      defaultValue={employee.annualLeaveDaysGranted}
                    />
                    <span className="text-body font-semibold text-muted">
                      일 (사용 {employee.usedLeaveDays}일 · 잔여 {employee.remainingLeaveDays}일)
                    </span>
                  </>
                ) : (
                  <span className="text-subtitle font-bold text-black">
                    자동계산 {employee.remainingLeaveDays}일
                  </span>
                )}
              </DetailRow>
              <DetailRow label="인증방식">
                <AuthMethodSelect defaultValue={employee.authMethod} name="authMethod" />
              </DetailRow>
            </div>
          </div>

          <div className="mt-8 flex w-full flex-col-reverse gap-3 pt-[30px] sm:mt-0 sm:flex-row sm:items-center sm:justify-between">
            <Button href="/employees" className="w-full sm:w-[140px]">
              취소
            </Button>
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-[12px]">
              {state.error ? (
                <p role="alert" className="text-body font-semibold text-red-600">
                  {state.error}
                </p>
              ) : null}
              <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:justify-end sm:gap-[12px]">
                <Button type="submit" variant="primary" className="w-full sm:w-[140px]">
                  저장
                </Button>
                <TerminateButton employeeName={employee.name} terminateAction={terminateAction} />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
