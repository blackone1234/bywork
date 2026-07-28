import { notFound } from "next/navigation";
import { MobileErrorState, MobileErrorSymbol, MobileErrorMessageIcon } from "@/components/mobile/ErrorState";

/**
 * E04 — 퇴사자 계정 로그인 시도 (dark 테마). 실제 퇴사자 로그인 차단 로직은 이미
 * m/login/actions.ts에 인라인으로 연결돼 있고(그룹A), 이 화면은 그 로직을 건드리지 않고
 * 별도 미연결 라우트로만 퍼블리싱한다(리뷰용).
 *
 * 다른 6개 화면과 구조가 다르다(Figma 실측):
 * - 타이틀 1줄("접근할 수 없는 계정이에요")
 * - 설명 2줄 중 두 번째("자동으로 로그아웃 되었습니다.")가 실제로는 투명(rgba(158,158,158,0))
 *   — 화면엔 안 보이지만 레이아웃 높이는 차지함. hidden:true로 그대로 재현.
 * - 버튼이 아예 없다 — 대신 문의 안내 텍스트 2줄(footer). 이메일 "blackds@by-bk.com"은
 *   Figma에 박혀있는 텍스트를 그대로 옮긴 것 — 실제 연결 시엔 특정 개인 이메일이 아니라
 *   회사 대표/관리자 연락처로 바뀌어야 할 가능성이 있어 보임(이번엔 퍼블리싱만이라 그대로 둠).
 */
export default function E04Screen() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <MobileErrorState
      theme="dark"
      symbolIcon={<MobileErrorSymbol color="white" />}
      messageIcon={<MobileErrorMessageIcon color="accent" />}
      title={["접근할 수 없는 계정이에요"]}
      description={[
        "더 이상 사용할 수 없는 계정입니다.",
        { text: "자동으로 로그아웃 되었습니다.", hidden: true },
      ]}
      footer={
        <div className="flex flex-col items-center gap-[12px] text-center">
          <p className="text-[14px] font-semibold tracking-[-0.28px] text-[var(--mobile-color-hint)]">
            문의사항은 관리자에게 연락해주세요
          </p>
          <p className="text-[16px] font-semibold tracking-[-0.32px] text-[var(--mobile-color-white)]">
            blackds@by-bk.com
          </p>
        </div>
      }
    />
  );
}
