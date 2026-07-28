"use client";

import { Suspense, useActionState, useEffect, useState } from "react";
import { TextField } from "@/components/admin/TextField";
import { PasswordField } from "@/components/admin/PasswordField";
import { Button } from "@/components/admin/Button";
import { Checkbox } from "@/components/admin/Checkbox";
import { login, requestPasswordReset, type LoginState } from "./actions";
import { LoginNotice } from "./LoginNotice";

const initialState: LoginState = {};

// 비밀번호는 절대 저장하지 않는다 — 저장 대상은 이메일뿐이고, 실제 비밀번호 저장/자동채움은
// autoComplete 속성으로 브라우저 자체 비밀번호 관리자에 맡긴다.
const SAVED_EMAIL_KEY = "bywork_admin_saved_email";

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState);
  const [{ email, rememberEmail }, setEmailState] = useState({ email: "", rememberEmail: false });

  useEffect(() => {
    // localStorage는 서버에 없는 브라우저 전용 API라 마운트 후 effect에서만 읽을 수 있다
    // (SSR 렌더와 값이 다를 수 있어 초기 렌더에서 바로 읽으면 하이드레이션 불일치가 남).
    const saved = localStorage.getItem(SAVED_EMAIL_KEY);
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmailState({ email: saved, rememberEmail: true });
    }
  }, []);

  function handleEmailChange(value: string) {
    setEmailState((prev) => {
      if (prev.rememberEmail) {
        localStorage.setItem(SAVED_EMAIL_KEY, value);
      }
      return { email: value, rememberEmail: prev.rememberEmail };
    });
  }

  function handleRememberToggle(next: boolean) {
    setEmailState((prev) => {
      if (next) {
        localStorage.setItem(SAVED_EMAIL_KEY, prev.email);
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }
      return { email: prev.email, rememberEmail: next };
    });
  }

  return (
    <div className="flex min-h-screen w-full items-stretch bg-page">
      <div className="hidden min-w-[420px] flex-1 flex-col justify-between bg-black px-10 py-16 text-white lg:flex xl:px-[100px] xl:py-[120px]">
        <span className="text-[14px] font-bold tracking-[-0.28px]">
          by BLACK
        </span>
        <h1 className="text-[50px] font-black leading-[50px] tracking-[-2px]">
          <span className="block whitespace-nowrap">RE-</span>
          <span className="block whitespace-nowrap">MARKABLE</span>
          <span className="block whitespace-nowrap">EXPERIENCE</span>
          <span className="block whitespace-nowrap">X BLACK</span>
        </h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 sm:px-[10%] lg:min-w-[480px] lg:items-start lg:px-12 xl:px-[180px]">
        <div className="flex w-full max-w-[420px] flex-col gap-[40px]">
          <div className="flex w-full flex-col gap-[20px]">
            <span className="text-[20px] font-black tracking-[-0.4px] text-black">
              by WORKS
            </span>
            <p className="text-[16px] font-bold tracking-[-0.32px] text-black">
              Admin Dashboard
            </p>
          </div>

          <form action={formAction} className="flex w-full flex-col gap-[30px]">
            <div className="flex flex-col gap-[12px]">
              <TextField
                id="email"
                type="email"
                name="email"
                placeholder="admin@by-bk.com"
                fullWidth
                borderColor="line"
                autoComplete="username"
                value={email}
                onChange={(event) => handleEmailChange(event.target.value)}
                required
              />
              <PasswordField
                id="password"
                name="password"
                placeholder="••••••••"
                fullWidth
                borderColor="line"
                autoComplete="current-password"
              />
            </div>

            {state.error ? (
              <p role="alert" className="text-body font-semibold text-red-600">
                {state.error}
              </p>
            ) : (
              <Suspense fallback={null}>
                <LoginNotice />
              </Suspense>
            )}

            <Button type="submit" variant="outline-pill" className="w-full">
              로그인
            </Button>

            <div className="flex w-full items-center justify-center">
              <Checkbox
                id="remember-email"
                checked={rememberEmail}
                onChange={handleRememberToggle}
                label="아이디 저장"
              />
            </div>

            <div className="flex w-full items-center justify-center pb-[5px]">
              <button
                type="submit"
                formAction={requestPasswordReset}
                className="flex items-center gap-[10px] text-[12px] font-medium tracking-[-0.24px] text-muted transition-colors hover:text-black hover:underline"
              >
                비밀번호를 잊으셨나요?
                <span aria-hidden>›</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
