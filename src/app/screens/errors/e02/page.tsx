import { notFound } from "next/navigation";
import { MobileErrorState, MobileErrorSymbol, MobileErrorMessageIcon } from "@/components/mobile/ErrorState";

/**
 * E02 — GPS 위치권한 거부 (dark 테마). 실제 GPS 거부 로직은 이미 attendanceEvents.ts/
 * AttendanceButtons.tsx에 인라인으로 연결돼 있고(그룹B), 이 화면은 그 로직을 건드리지
 * 않고 별도 미연결 라우트로만 퍼블리싱한다(E06과 동일 처리 — 리뷰용).
 *
 * 7개 화면 중 유일하게 버튼 슬롯 2개가 전부 실제로 보인다(나머지는 opacity-0 스페이서 1개
 * + 실제 버튼 1개) — Figma 원본 DOM 순서 그대로 secondaryAction(위, "설정에서 권한 허용",
 * 흰색 테두리)이 먼저, primaryAction(아래, "다시시도", soft-gray 테두리)이 나중.
 */
export default function E02Screen() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <MobileErrorState
      theme="dark"
      symbolIcon={<MobileErrorSymbol color="white" />}
      messageIcon={<MobileErrorMessageIcon color="accent" />}
      title={["위치 정보 접근이", "필요해요"]}
      description={["출퇴근 체크를 하려면", "위치 권한을 허용해야 해요."]}
      secondaryAction={{ label: "설정에서 권한 허용", variant: "outline-white" }}
      primaryAction={{ label: "다시시도", variant: "outline-soft" }}
    />
  );
}
