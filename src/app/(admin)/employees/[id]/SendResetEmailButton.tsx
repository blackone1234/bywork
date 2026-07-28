"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/admin/Button";
import { useToast } from "@/components/admin/ToastProvider";
import { sendPasswordResetEmail, type SendResetEmailState } from "../actions";

const INITIAL_STATE: SendResetEmailState = {};

/**
 * A04 "비밀번호 초기화 메일 발송" — 자기 자신만의 <form>을 가져야 useActionState를
 * 쓸 수 있는데, 예전엔 근무설정 저장 폼(<form action={formAction}>) 안에 formAction
 * 오버라이드로 얹혀있어서 폼 중첩 문제로 불가능했다(A05 TerminateButton 때와 같은
 * 종류의 문제). "기본정보" 섹션 자체를 근무설정 폼 밖으로 뺀 뒤(EmployeeDetailForm.tsx),
 * 이 버튼만 독립된 <form>으로 감싼다.
 */
export function SendResetEmailButton({ email }: { email: string }) {
  const [state, formAction] = useActionState(sendPasswordResetEmail, INITIAL_STATE);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.success) {
      showToast("비밀번호 초기화 메일을 발송했습니다.");
    }
  }, [state, showToast]);

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="email" value={email} />
      <Button size="compact" type="submit">
        비밀번호 초기화 메일 발송
      </Button>
      {state.error ? (
        <p role="alert" className="text-body font-semibold text-red-600">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
