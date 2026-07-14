"use client";

import { useActionState } from "react";
import { TextField } from "@/components/admin/TextField";
import { Button } from "@/components/admin/Button";
import { updatePassword, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePassword, initialState);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-4">
      <form
        action={formAction}
        className="flex w-full max-w-[480px] flex-col items-center justify-center gap-[20px] rounded-[20px] border border-divider p-6 sm:p-[30px]"
      >
        <div className="flex flex-col items-center gap-[12px] text-center">
          <p className="text-[16px] font-bold tracking-[-0.32px] text-black">
            비밀번호 재설정
          </p>
          <p className="max-w-[336px] text-[12px] font-semibold leading-[18px] tracking-[-0.24px] text-line">
            이메일 링크로 접속하셨습니다
          </p>
        </div>

        <div className="flex w-full flex-col gap-[20px]">
          <div className="flex w-full flex-col gap-[10px]">
            <p className="text-[12px] font-semibold tracking-[-0.24px] text-muted">
              새 비밀번호
            </p>
            <TextField
              type="password"
              name="newPassword"
              placeholder="새 비밀번호를 입력해주세요. 최소 8자 이상 입력해주세요."
              fullWidth
            />
          </div>
          <div className="flex w-full flex-col gap-[10px]">
            <p className="text-[12px] font-semibold tracking-[-0.24px] text-muted">
              비밀번호 확인
            </p>
            <TextField
              type="password"
              name="confirmPassword"
              placeholder="새 비밀번호를 입력해주세요. 최소 8자 이상 입력해주세요."
              fullWidth
            />
          </div>
        </div>

        {state.error ? (
          <p role="alert" className="text-body font-semibold text-red-600">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" variant="outline-pill" className="w-full">
          비밀번호 변경 완료
        </Button>
      </form>
    </div>
  );
}
