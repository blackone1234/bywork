"use client";

import { useActionState } from "react";
import { TextField } from "@/components/admin/TextField";
import { Button } from "@/components/admin/Button";
import { saveAdminPassword, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = {};

export function AdminPasswordForm({ adminId, email }: { adminId: string; email: string }) {
  const boundAction = saveAdminPassword.bind(null, adminId);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-[20px]">
      <div className="flex w-full flex-col divide-y divide-divider border-t-2 border-b-2 border-black">
        <div className="flex w-full flex-col gap-2 py-[10px] sm:flex-row sm:items-center sm:gap-[10px] sm:py-[6px]">
          <span className="w-full shrink-0 text-[14px] font-semibold tracking-[-0.28px] text-muted sm:w-[120px]">
            이메일
          </span>
          <TextField type="email" defaultValue={email} readOnly />
        </div>
        <div className="flex w-full flex-col gap-2 py-[10px] sm:flex-row sm:items-center sm:gap-[10px] sm:py-[6px]">
          <span className="w-full shrink-0 text-[14px] font-semibold tracking-[-0.28px] text-muted sm:w-[120px]">
            새 비밀번호
          </span>
          <TextField
            type="password"
            name="newPassword"
            placeholder="새 비밀번호를 입력해주세요. 최소 8자 이상 입력해주세요."
          />
        </div>
        <div className="flex w-full flex-col gap-2 py-[10px] sm:flex-row sm:items-center sm:gap-[10px] sm:py-[6px]">
          <span className="w-full shrink-0 text-[14px] font-semibold tracking-[-0.28px] text-muted sm:w-[120px]">
            비밀번호 확인
          </span>
          <TextField type="password" name="confirmPassword" placeholder="비밀번호를 다시 입력해주세요." />
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="text-body font-semibold text-red-600">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-body font-semibold text-sidebar-active">
          비밀번호가 변경됐습니다.
        </p>
      ) : null}

      <div className="flex w-full justify-end">
        <Button type="submit" className="w-full sm:w-[140px]">
          저장
        </Button>
      </div>
    </form>
  );
}
