import { MobileErrorState, MobileErrorSymbol, MobileErrorMessageIcon } from "@/components/mobile/ErrorState";

/**
 * E06 — 404. src/app/screens/errors/e06/page.tsx(리뷰 전용)의 마크업을 이 파일로
 * 옮겨서 실제 not-found.tsx로 연결했다(원본은 삭제 — /screens 인덱스는 실제 404를
 * 트리거하는 존재하지 않는 /m 경로로 링크를 바꿨다). /m/* 은 이 파일이 루트
 * not-found.tsx보다 더 가까운 경계라 여기가 우선 적용된다.
 */
export default function MobileNotFound() {
  return (
    <MobileErrorState
      theme="light"
      symbolIcon={<MobileErrorSymbol color="light-gray" />}
      messageIcon={<MobileErrorMessageIcon color="light-gray" />}
      title={["페이지를 찾을 수", "없어요"]}
      description={["요청하신 페이지가 존재하지 않거나", "삭제됐어요."]}
      primaryAction={{ label: "홈으로 이동", href: "/m", variant: "outline-dark" }}
    />
  );
}
