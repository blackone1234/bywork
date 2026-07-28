"use client";

import { Suspense, useActionState, useEffect, useState, type ChangeEvent } from "react";
import { MobileTextField } from "@/components/mobile/TextField";
import { MobileButton } from "@/components/mobile/Button";
import { MobileCheckbox } from "@/components/mobile/Checkbox";
import { BIOMETRIC_LOGIN_ENABLED } from "@/lib/featureFlags";
import { login, type MobileLoginState } from "./actions";
import { MobileLoginNotice } from "./MobileLoginNotice";

const initialState: MobileLoginState = {};

// 비밀번호는 절대 저장하지 않는다 — 저장 대상은 이메일뿐이고, 실제 비밀번호 저장/자동채움은
// autoComplete 속성으로 브라우저 자체 비밀번호 관리자에 맡긴다(관리자 웹 로그인과 동일 방식).
const SAVED_EMAIL_KEY = "bywork_mobile_saved_email";

/**
 * S01 — 로그인 (dark, 인증 전이라 하단 네비 없음).
 *
 * ?error= 쿼리는 /auth/confirm(초대/재설정 링크 검증)이 실패했을 때 여기로 붙여서
 * 리다이렉트한다 — 관리자 쪽 /login의 LoginNotice와 동일한 이유·동일한 패턴
 * (useSearchParams는 Suspense 경계 안에서만 정적 빌드가 통과해서 별도 컴포넌트로 뗐다).
 * state.error(로그인 폼 제출 결과)가 있으면 그게 더 최신 정보라 우선한다.
 */
export default function MobileLoginPage() {
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
    <div className="flex min-h-screen w-full flex-col items-start bg-[var(--mobile-color-black)]">
      <form action={formAction} className="flex w-full flex-1 flex-col items-start justify-center gap-[70px] px-[var(--mobile-space-30)] pt-[50px]">
        <div className="flex w-full flex-col items-center gap-[var(--mobile-space-24)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mobile/logo-by-works.svg" alt="by WORKS" width={212.937} height={40} />
          <p className="pt-[2px] text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-white)]">
            by BLACK 근태관리 시스템
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-[var(--mobile-space-30)]">
          <div className="flex w-full flex-col items-start gap-[var(--mobile-space-24)]">
            <MobileMarkField
              label="이메일"
              name="email"
              placeholder="000000@by-bk.com"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => handleEmailChange(event.target.value)}
            />
            <MobileMarkField
              label="비밀번호"
              name="password"
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
            />
          </div>

          {/* Figma에 로그인 에러 상태 디자인이 없어서(재확인 완료) 최소한의 처리로 넣음. */}
          {state.error ? (
            <p role="alert" className="w-full text-center text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-notification)]">
              {state.error}
            </p>
          ) : (
            <Suspense fallback={null}>
              <MobileLoginNotice />
            </Suspense>
          )}

          <MobileButton type="submit" variant="filled-accent">
            로그인
          </MobileButton>

          <div className="flex w-full items-center justify-center">
            <MobileCheckbox
              id="remember-email"
              checked={rememberEmail}
              onChange={handleRememberToggle}
              label="아이디 저장"
            />
          </div>

          {/* 생체인증(WebAuthn)은 그룹F 착수 전까지 조건부 숨김 — BIOMETRIC_LOGIN_ENABLED만
              true로 바꾸면 구분선+버튼이 다시 보인다. Figma 원본엔 항상 노출돼 있어서
              figma-pixel-accurate 재검증 대상에서 이 블록만 의도적으로 제외한다
              (CLAUDE.md에 기록). */}
          {BIOMETRIC_LOGIN_ENABLED ? (
            <>
              <div className="flex w-full items-center justify-center gap-[var(--mobile-space-20)] pt-[2px]">
                <div className="h-px flex-1 bg-[var(--mobile-color-warm-gray)]" aria-hidden />
                <p className="text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
                  또는
                </p>
                <div className="h-px flex-1 bg-[var(--mobile-color-warm-gray)]" aria-hidden />
              </div>

              <MobileButton type="button" variant="outline-warm" compact>
                생체인증으로 로그인
              </MobileButton>
            </>
          ) : null}

          <p className="pt-[2px] text-center text-[12px] tracking-[-0.24px] text-[var(--mobile-color-hint)]">
            비밀번호를 잊으셨나요? 관리자에게 문의하세요
          </p>
        </div>

        <div className="flex w-full items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mobile/logo-by-black-footer.svg" alt="by BLACK" width={80.15} height={16} />
        </div>
      </form>
    </div>
  );
}

/**
 * S01/S02가 공유하는 dark 로그인용 인풋 스타일 — 어드민의 warm-gray 테두리 rounded-14
 * 그대로지만, 다크 배경 위에선 라벨 색이 line-gray(#e0e0e0)로 밝아진다.
 */
function MobileMarkField({
  label,
  name,
  placeholder,
  type = "text",
  autoComplete,
  value,
  onChange,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-[var(--mobile-space-10)]">
      <label
        htmlFor={name}
        className="text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-line-gray)]"
      >
        {label}
      </label>
      <MobileTextField
        id={name}
        name={name}
        placeholder={placeholder}
        type={type}
        textColor="light"
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        required
      />
    </div>
  );
}
