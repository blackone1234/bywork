import { MobileSubPageHeader } from "@/components/mobile/Header";
import { MobileTextField } from "@/components/mobile/TextField";
import { MobileButton } from "@/components/mobile/Button";

/** S02 — 비밀번호 등록 (light, 인증 전이라 하단 네비 없음). */
export default function MobileRegisterPasswordPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-[var(--mobile-color-white)]">
      <div className="flex w-full flex-1 flex-col items-start gap-[80px]">
        <MobileSubPageHeader title="비밀번호 등록" subtitle="처음 로그인하셨습니다. 새 비밀번호를 등록해주세요." />

        <div className="flex w-full flex-col items-center gap-[var(--mobile-space-30)] px-[var(--mobile-space-30)]">
          <div className="flex w-full flex-col items-start gap-[var(--mobile-space-30)]">
            <MobileTextField label="새 비밀번호" placeholder="8자리 이상 입력해주세요" type="password" />
            <div className="flex w-full flex-col items-start gap-[var(--mobile-space-12)]">
              <MobileTextField label="비밀번호 확인" placeholder="비밀번호를 다시 입력해주세요" type="password" />
              <p className="w-full pt-[2px] text-center text-[12px] tracking-[-0.24px] text-[var(--mobile-color-warm-gray)]">
                ✓ 8자 이상&nbsp;&nbsp;&nbsp;✓ 영문, 숫자 포함 권장
              </p>
            </div>
          </div>

          <MobileButton variant="filled-muted">비밀번호 등록 완료</MobileButton>

          <p className="pt-[2px] text-center text-[12px] tracking-[-0.24px] text-[var(--mobile-color-hint)]">
            비밀번호를 잊으셨나요? 관리자에게 문의하세요
          </p>
        </div>
      </div>
    </div>
  );
}
