"use client";

import { useActionState } from "react";
import { MobileSubPageHeader } from "@/components/mobile/Header";
import { MobileTextField } from "@/components/mobile/TextField";
import { MobileButton } from "@/components/mobile/Button";
import { registerPassword, type RegisterPasswordState } from "./actions";

const initialState: RegisterPasswordState = {};

export function MobileRegisterPasswordForm() {
  const [state, formAction] = useActionState(registerPassword, initialState);

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-[var(--mobile-color-white)]">
      <form action={formAction} className="flex w-full flex-1 flex-col items-start gap-[80px]">
        {/* S02만 Figma TOP이 100px — 나머지 MobileSubPageHeader 사용처(S09/S11/S12/S16)는 60px 기본값. */}
        <MobileSubPageHeader
          title="비밀번호 등록"
          subtitle="처음 로그인하셨습니다. 새 비밀번호를 등록해주세요."
          topPadding="100px"
        />

        <div className="flex w-full flex-col items-center gap-[var(--mobile-space-30)] px-[var(--mobile-space-30)]">
          <div className="flex w-full flex-col items-start gap-[var(--mobile-space-30)]">
            <MobileTextField
              id="newPassword"
              label="새 비밀번호"
              name="newPassword"
              placeholder="8자리 이상 입력해주세요"
              type="password"
              required
              minLength={8}
            />
            <div className="flex w-full flex-col items-start gap-[var(--mobile-space-12)]">
              <MobileTextField
                id="confirmPassword"
                label="비밀번호 확인"
                name="confirmPassword"
                placeholder="비밀번호를 다시 입력해주세요"
                type="password"
                required
                minLength={8}
              />
              <p className="w-full pt-[2px] text-center text-[12px] tracking-[-0.24px] text-[var(--mobile-color-warm-gray)]">
                ✓ 8자 이상&nbsp;&nbsp;&nbsp;✓ 영문, 숫자 포함 권장
              </p>
            </div>
          </div>

          {/* Figma에 에러 상태 디자인 없음(재확인 완료) — 최소한의 처리로 넣음. */}
          {state.error ? (
            <p role="alert" className="w-full text-center text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-notification)]">
              {state.error}
            </p>
          ) : null}

          <MobileButton type="submit" variant="filled-muted">
            비밀번호 등록 완료
          </MobileButton>

          <p className="pt-[2px] text-center text-[12px] tracking-[-0.24px] text-[var(--mobile-color-hint)]">
            비밀번호를 잊으셨나요? 관리자에게 문의하세요
          </p>
        </div>
      </form>
    </div>
  );
}
