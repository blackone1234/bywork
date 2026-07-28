import { notFound } from "next/navigation";
import { MobileErrorState, MobileErrorSymbol, MobileErrorMessageIcon } from "@/components/mobile/ErrorState";

/**
 * E03 — 세션 만료 (dark 테마). 실제 세션 만료는 proxy.ts가 메시지 없이 조용히 리다이렉트
 * 하는 상태(그룹F 조사에서 "미연결"로 확인됨) — 이 화면은 그 갭을 채울 후보 UI일 뿐,
 * proxy.ts에는 아직 연결하지 않는다(리뷰용).
 *
 * 다른 6개 화면과 다른 점 2가지(둘 다 Figma 실측):
 * 1. 타이틀이 2줄이 아니라 1줄("세션이 만료됐어요") — title 배열 길이 1로 그대로 처리됨.
 * 2. 루트 패딩이 pt140/pb160 비대칭이 아니라 pt140/pb140 대칭(py-140) — bottomPadding=140.
 */
export default function E03Screen() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <MobileErrorState
      theme="dark"
      bottomPadding={140}
      symbolIcon={<MobileErrorSymbol color="white" />}
      messageIcon={<MobileErrorMessageIcon color="accent" />}
      title={["세션이 만료됐어요"]}
      description={["보안을 위해", "자동으로 로그아웃 되었습니다."]}
      primaryAction={{ label: "다시 로그인", href: "/m/login", variant: "outline-warm" }}
    />
  );
}
