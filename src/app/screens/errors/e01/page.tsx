import { notFound } from "next/navigation";
import { MobileErrorState, MobileErrorSymbol, MobileErrorMessageIcon } from "@/components/mobile/ErrorState";

/**
 * E01 — 초대링크 만료/오류 (dark 테마). 아직 실제 초대 플로우(/auth/confirm)에는
 * 미연결(로직 연결 없음, 리뷰용). dev-screen-index에서만 노출.
 */
export default function E01Screen() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <MobileErrorState
      theme="dark"
      symbolIcon={<MobileErrorSymbol color="white" />}
      messageIcon={<MobileErrorMessageIcon color="accent" />}
      title={["초대 링크가", "만료됐어요"]}
      description={["링크 유효기간이 지났습니다.", "관리자에게 재발급을 요청해주세요."]}
      primaryAction={{ label: "관리자에게 문의하기", variant: "outline-soft" }}
    />
  );
}
