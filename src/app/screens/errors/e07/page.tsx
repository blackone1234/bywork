import { notFound } from "next/navigation";
import { MobileErrorState, MobileErrorSymbol, MobileErrorMessageIcon } from "@/components/mobile/ErrorState";

/**
 * E07 — 500 서버 오류 (light 테마). 실제 500 처리는 error.tsx/global-error.tsx 자체가
 * 프로젝트에 없어 Next.js 기본 에러 화면으로 fallback하는 상태(그룹F 조사에서 "미연결"로
 * 확인됨) — 이 화면은 그 갭을 채울 후보 UI일 뿐, 아직 실제 error.tsx에는 연결하지 않는다.
 */
export default function E07Screen() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <MobileErrorState
      theme="light"
      symbolIcon={<MobileErrorSymbol color="light-gray" />}
      messageIcon={<MobileErrorMessageIcon color="light-gray" />}
      title={["일시적인 오류가", "발생했어요"]}
      description={["잠시 후 다시 시도해주세요.", "문제가 계속되면 문의해주세요."]}
      primaryAction={{ label: "홈으로 이동", href: "/m", variant: "outline-dark" }}
    />
  );
}
