"use client";

import { useActionState, useState } from "react";
import { FormField } from "@/components/admin/FormField";
import { TextField } from "@/components/admin/TextField";
import { Button } from "@/components/admin/Button";
import { createEmployee, rehireEmployee, type FormActionState } from "@/app/(admin)/employees/actions";

const initialState: FormActionState = {};

export function NewEmployeeForm() {
  const [state, formAction] = useActionState(createEmployee, initialState);
  // useActionState returns a new `state` object every time the action completes, so
  // comparing by reference (rather than a separate boolean) means the dialog reopens
  // even if the admin cancels and resubmits with the exact same conflicting email.
  const [dismissedState, setDismissedState] = useState<FormActionState | null>(null);
  const showRehireDialog = Boolean(state.rehireCandidate) && state !== dismissedState;

  const rehireWithId = state.rehireCandidate
    ? rehireEmployee.bind(null, state.rehireCandidate.id)
    : undefined;

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-8 px-4 py-6 sm:px-8 lg:gap-[50px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
      <div className="flex w-full flex-col gap-[20px]">
        <FormField label="이름" required>
          <TextField type="text" name="name" placeholder="이름을 입력해주세요." required />
        </FormField>

        <FormField label="연락처" required>
          <TextField
            type="tel"
            name="phone"
            placeholder="000-1234-5678 (숫자만 입력해주세요)"
            required
          />
        </FormField>

        <FormField label="이메일 (로그인 ID)" required>
          <div className="flex w-full max-w-[500px] items-center rounded-lg border border-divider py-[var(--space-16)] pr-[var(--space-14)] pl-[var(--space-30)] transition-[border,box-shadow] focus-within:border-2 focus-within:border-black focus-within:shadow-[2px_4px_2px_rgba(0,0,0,0.2)]">
            <input
              type="text"
              name="emailLocal"
              placeholder="abcd"
              required
              className="flex-1 text-body font-semibold text-black placeholder:text-line focus:outline-none"
            />
            <span className="text-body font-semibold text-black">@by-bk.com</span>
          </div>
        </FormField>

        <div className="flex items-center gap-[12px]">
          <FormField label="입사일" required>
            <TextField type="date" name="hireDate" required />
          </FormField>
        </div>

        <FormField label="근무설정">
          <div className="w-full max-w-[500px] rounded-lg border border-divider py-[var(--space-16)] pr-[var(--space-14)] pl-[var(--space-30)] text-body font-semibold text-line">
            근무설정 기본 값 자동적용되었습니다. (월~금 09:00 ~ 18:00)
          </div>
        </FormField>

        {state.error ? (
          <p role="alert" className="text-body font-semibold text-red-600">
            {state.error}
          </p>
        ) : null}
      </div>

      <div className="flex w-full items-center justify-between gap-3 border-t border-muted pt-[30px]">
        <Button href="/employees" className="w-[110px] sm:w-[140px]">
          취소
        </Button>
        <Button type="submit" className="w-[110px] sm:w-[140px]">
          저장
        </Button>
      </div>

      {showRehireDialog && state.rehireCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar-active/80 px-4">
          <div className="flex w-full max-w-[420px] flex-col gap-[20px] rounded-lg bg-white p-6 shadow-[2px_4px_3px_rgba(0,0,0,0.2)] sm:p-[24px]">
            <div className="flex flex-col gap-[12px] text-center">
              <p className="text-subtitle font-bold text-black">재입사 확인</p>
              <p className="text-badge font-semibold leading-[18px] text-muted">
                이 이메일은 퇴사한 직원(이름: {state.rehireCandidate.name}, 퇴사일:{" "}
                {state.rehireCandidate.terminationDate})의 계정입니다.
                <br />
                재입사가 맞으면 재입사 처리를, 다른 사람이면 다른 이메일을 입력해주세요.
              </p>
            </div>
            <div className="flex w-full items-start gap-[10px]">
              <Button
                type="button"
                size="xs"
                className="flex-1"
                onClick={() => setDismissedState(state)}
              >
                취소
              </Button>
              <Button type="submit" size="xs" className="flex-1" formAction={rehireWithId}>
                재입사 처리
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
