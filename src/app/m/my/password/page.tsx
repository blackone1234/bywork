import { MobileSubPageHeader } from "@/components/mobile/Header";
import { MobileTextField } from "@/components/mobile/TextField";
import { MobileButton } from "@/components/mobile/Button";
import { MobileBottomNav } from "@/components/mobile/BottomNav";

/** S16 — 비밀번호 변경 (light, 드릴인). */
export default function MobileMyPasswordPage() {
  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-[var(--mobile-color-white)]">
      <div className="flex w-full flex-col gap-[30px]">
        <MobileSubPageHeader title="비밀번호 변경" />

        <div className="flex w-full flex-col gap-[30px] px-[var(--mobile-space-30)]">
          <div className="flex w-full flex-col gap-[20px]">
            <MobileTextField label="현재 비밀번호" placeholder="비밀번호를 입력해주세요" type="password" />

            <div className="flex w-full flex-col gap-[8px]">
              <MobileTextField label="새 비밀번호" placeholder="8자리 이상 입력해주세요" type="password" />
              <p className="w-full pt-[2px] text-center text-[12px] tracking-[-0.24px] text-[var(--mobile-color-warm-gray)]">
                ✓ 8자 이상&nbsp;&nbsp;&nbsp;✓ 영문, 숫자 포함 권장
              </p>
            </div>

            <MobileTextField label="새 비밀번호 확인" placeholder="비밀번호를 다시 입력해주세요" type="password" />
          </div>

          <MobileButton variant="outline-dark">변경하기</MobileButton>
        </div>
      </div>
      <MobileBottomNav active="my" theme="light" />
    </div>
  );
}
