import { notFound } from "next/navigation";
import { MobileErrorState, MobileErrorSymbol, MobileErrorMessageIcon } from "@/components/mobile/ErrorState";

/**
 * E05 — 네트워크 연결 오류 (light 테마). 실제 네트워크 오류 처리는 현재 어디에도 없음
 * (그룹F 조사에서 "미연결"로 확인됨, 서버 액션 호출부에 try/catch 자체가 없음) — 이
 * 화면은 그 갭을 채울 후보 UI일 뿐, 아직 실제 에러 바운더리/핸들러에는 연결하지 않는다.
 */
export default function E05Screen() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <MobileErrorState
      theme="light"
      symbolIcon={<MobileErrorSymbol color="light-gray" />}
      messageIcon={<MobileErrorMessageIcon color="light-gray" />}
      title={["네트워크 연결을", "확인해주세요"]}
      description={["인터넷 연결 상태를 확인한 뒤", "다시 시도해주세요."]}
      primaryAction={{ label: "홈으로 이동", href: "/m", variant: "outline-dark" }}
    />
  );
}
