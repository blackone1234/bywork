import { MobileTextField } from "@/components/mobile/TextField";
import { MobileButton } from "@/components/mobile/Button";

/** S01 — 로그인 (dark, 인증 전이라 하단 네비 없음). */
export default function MobileLoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-[var(--mobile-color-black)]">
      <div className="flex w-full flex-1 flex-col items-start justify-center gap-[70px] px-[var(--mobile-space-30)] pt-[50px]">
        <div className="flex w-full flex-col items-center gap-[var(--mobile-space-24)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mobile/logo-by-works.svg" alt="by WORKS" width={212.937} height={40} />
          <p className="pt-[2px] text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-white)]">
            by BLACK 근태관리 시스템
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-[var(--mobile-space-30)]">
          <div className="flex w-full flex-col items-start gap-[var(--mobile-space-24)]">
            <MobileMarkField label="이메일" placeholder="000000@by-bk.com" />
            <MobileMarkField label="비밀번호" placeholder="••••••••" type="password" />
          </div>

          <MobileButton variant="filled-accent">로그인</MobileButton>

          <div className="flex w-full items-center justify-center gap-[var(--mobile-space-20)] pt-[2px]">
            <div className="h-px flex-1 bg-[var(--mobile-color-warm-gray)]" aria-hidden />
            <p className="text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
              또는
            </p>
            <div className="h-px flex-1 bg-[var(--mobile-color-warm-gray)]" aria-hidden />
          </div>

          <MobileButton variant="outline-warm" compact>
            생체인증으로 로그인
          </MobileButton>

          <p className="pt-[2px] text-center text-[12px] tracking-[-0.24px] text-[var(--mobile-color-hint)]">
            비밀번호를 잊으셨나요? 관리자에게 문의하세요
          </p>
        </div>

        <div className="flex w-full items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mobile/logo-by-black-footer.svg" alt="by BLACK" width={80.15} height={16} />
        </div>
      </div>
    </div>
  );
}

/**
 * S01/S02가 공유하는 dark 로그인용 인풋 스타일 — 어드민의 warm-gray 테두리 rounded-14
 * 그대로지만, 다크 배경 위에선 라벨 색이 line-gray(#e0e0e0)로 밝아진다.
 */
function MobileMarkField({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-[var(--mobile-space-10)]">
      <label className="text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-line-gray)]">
        {label}
      </label>
      <MobileTextField placeholder={placeholder} type={type} textColor="light" />
    </div>
  );
}
