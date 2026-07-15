import { MobileTabRootHeader } from "@/components/mobile/Header";
import { MobileAvatar } from "@/components/mobile/Avatar";
import { MobileFieldRow } from "@/components/mobile/InfoBox";
import { MobileButton } from "@/components/mobile/Button";
import { MobileBottomNav } from "@/components/mobile/BottomNav";
import { ChevronRightIcon } from "@/components/mobile/icons";

/** S15 — 마이페이지 (light, 마이 탭 루트). */
export default function MobileMyPage() {
  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-[var(--mobile-color-white)]">
      <div className="flex w-full flex-col gap-[30px]">
        <MobileTabRootHeader title="MY" />

        <div className="flex w-full flex-col gap-[30px] px-[var(--mobile-space-30)]">
          <div className="flex w-full items-center gap-[20px]">
            <MobileAvatar initial="이" />
            <div className="flex flex-1 flex-col gap-[10px]">
              <p className="text-[20px] font-bold tracking-[-0.4px] text-[var(--mobile-color-black)]">이동석</p>
              <div className="flex flex-col gap-[5px]">
                <p className="text-[length:var(--mobile-text-body)] font-semibold tracking-[var(--mobile-text-body-tracking)] text-[var(--mobile-color-black)]">
                  blackds@by-bk.com
                </p>
                <p className="text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
                  입사일 : 2012.06.25
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-[8px]">
            <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
              계정설정
            </p>
            <MobileFieldRow
              label="비밀번호 변경"
              href="/m/my/password"
              trailing={<ChevronRightIcon className="h-2 w-1 text-[var(--mobile-color-black)]" />}
            />
            <MobileFieldRow
              label="생체인증 설정"
              trailing={<ChevronRightIcon className="h-2 w-1 text-[var(--mobile-color-black)]" />}
            />
          </div>

          <div className="flex w-full flex-col gap-[8px]">
            <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
              내 정보
            </p>
            <MobileFieldRow label="입사일" value="2012.06.25" />
            <MobileFieldRow label="근무시간" value="09:00 ~18:00" />
            <MobileFieldRow label="근무지" value="본사 (기본 IP)" />
          </div>

          <MobileButton variant="outline-dark" href="/m/login">
            로그아웃
          </MobileButton>
        </div>
      </div>
      <MobileBottomNav active="my" theme="light" />
    </div>
  );
}
