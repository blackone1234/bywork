"use client";

import { useActionState } from "react";
import { MobileTextField } from "@/components/mobile/TextField";
import { MobileButton } from "@/components/mobile/Button";
import { BIOMETRIC_LOGIN_ENABLED } from "@/lib/featureFlags";
import { login, type MobileLoginState } from "./actions";

const initialState: MobileLoginState = {};

/** S01 — 로그인 (dark, 인증 전이라 하단 네비 없음). */
export default function MobileLoginPage() {
  const [state, formAction] = useActionState(login, initialState);

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
            <MobileMarkField label="이메일" name="email" placeholder="000000@by-bk.com" type="email" />
            <MobileMarkField label="비밀번호" name="password" placeholder="••••••••" type="password" />
          </div>

          {/* Figma에 로그인 에러 상태 디자인이 없어서(재확인 완료) 최소한의 처리로 넣음. */}
          {state.error ? (
            <p role="alert" className="w-full text-center text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-notification)]">
              {state.error}
            </p>
          ) : null}

          <MobileButton type="submit" variant="filled-accent">
            로그인
          </MobileButton>

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
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-[var(--mobile-space-10)]">
      <label className="text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-line-gray)]">
        {label}
      </label>
      <MobileTextField name={name} placeholder={placeholder} type={type} textColor="light" required />
    </div>
  );
}
