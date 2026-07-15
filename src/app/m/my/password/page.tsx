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
            {/* 사용자 지시로 중앙정렬 대신 좌측정렬로 강제 고정. */}
            <MobileTextField label="현재 비밀번호" placeholder="비밀번호를 입력해주세요" type="password" className="text-left" />

            <div className="flex w-full flex-col gap-[8px]">
              <MobileTextField label="새 비밀번호" placeholder="8자리 이상 입력해주세요" type="password" className="text-left" />
              {/* get_design_context 재확인: "✓ " 체크마크만 Regular(400)이고 나머지 라벨
                  텍스트는 SemiBold(600) — 코드는 전체가 400이었다. */}
              <p className="w-full pt-[2px] text-center text-[12px] tracking-[-0.24px] text-[var(--mobile-color-warm-gray)]">
                <span className="font-normal">✓ </span>
                <span className="font-semibold">8자 이상</span>
                &nbsp;&nbsp;&nbsp;
                <span className="font-normal">✓ </span>
                <span className="font-semibold">영문, 숫자 포함 권장</span>
              </p>
            </div>

            <MobileTextField label="새 비밀번호 확인" placeholder="비밀번호를 다시 입력해주세요" type="password" className="text-left" />
          </div>

          <MobileButton variant="outline-dark">변경하기</MobileButton>
        </div>
      </div>
      <MobileBottomNav active="my" theme="light" />
    </div>
  );
}
