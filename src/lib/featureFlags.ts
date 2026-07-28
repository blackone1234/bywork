/**
 * 생체인증(WebAuthn) 로그인은 그룹F(A~E 이후 우선순위)로 미뤄졌다 — 별도 라이브러리,
 * DB 스키마, 세션 발급 브릿지가 필요해서 이번 그룹(S01/S02 이메일·비밀번호 인증) 범위
 * 밖으로 뺐다. 구현 착수 전까지 S01의 "생체인증으로 로그인" 버튼(+ 구분선)을 숨긴다 —
 * 컴포넌트는 그대로 두고 이 플래그만 true로 바꾸면 다시 노출된다.
 */
export const BIOMETRIC_LOGIN_ENABLED = false;

/**
 * S03~S07 홈 헤더의 알림 종 아이콘은 onClick도 없고 연결된 알림 데이터도 없는
 * 정적 장식(hasAlert도 항상 true로 하드코딩)이었다 — 실제 알림 기능(목록/읽음처리/
 * 데이터 소스)이 만들어지기 전까지 숨긴다. 컴포넌트(MobileHomeHeader/BellIcon)는
 * 그대로 두고 이 플래그만 true로 바꾸면 다시 노출된다.
 */
export const NOTIFICATION_BELL_ENABLED = false;
