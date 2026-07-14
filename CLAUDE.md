@AGENTS.md

- Supabase 스키마 작성 시 각 테이블에 RLS enable 하는 것과 별개로, service_role에 대한 GRANT(테이블/시퀀스/함수 + default privileges)를 항상 같이 포함할 것. RLS만 켜고 GRANT를 빠뜨리면 service_role 키로도 permission denied가 발생함.

## 진행 상황

- **관리자 웹(A01~A15): 완료.** 전 화면 Supabase 연동 + 실제 로그인 세션까지 끝남. Supabase Auth
  세션 기반 로그인/비밀번호 재설정(`token_hash`+`type` 콜백 방식)이 붙어 있고, 이전에 임시로
  걸어뒀던 Basic Auth(`proxy.ts`)와 `ADMIN_ACTION_SECRET` 환경변수 게이트는 완전히 제거됨.
  `admin-guard.ts`가 세션 검사(`getUser()`)로 동작하고, `leave_requests` 승인/반려의
  `processed_by`도 로그인한 관리자 id로 채워짐.
- **사용자 앱(모바일) 그룹0 — 공용 디자인 시스템: 완료.** Figma "byWORK 근태 APP design"
  (`Cb5ZQsPWOScDxrjw8eojvI`, `Design_Front` 페이지) S01~S16을 전수 조사해 `--mobile-*` 접두사
  토큰(`src/app/globals.css`, 어드민 `--color-*`/`--text-*`/`--space-*`/`--radius-*`와 이름
  충돌 0건 검증됨)과 공용 컴포넌트 15종(`src/components/mobile/`)을 만들었음. 상세 내역은
  `design.md` 참고. 실제 화면(라우트)은 아직 하나도 만들지 않은 상태 — 다음 단계는 S01부터
  순서대로 퍼블리싱하는 것.
- **S04~S06 결번 이슈: 해결됨.** 처음 조사했을 때는 Figma 파일에 S04/S05/S06 프레임이 아예
  없어서 `design.md`에 결번으로 기록했었는데, 이후 Figma 쪽에서 홈 화면 상태 변형들을
  재정리하면서 채워짐 — 지금은 `Design_Front` 페이지에 실제로 존재함(S04 홈 근무 중, S05 홈
  외출 중, S06 홈 외근 중; 기존에 S03 하위 상태로 뭉쳐 있던 프레임들이 재배치된 것). S01~S16
  전체가 빠짐없이 존재하는 상태.

## 다음 작업

- 기존 `byWORK_와이어프레임_최종본.html`을 위 Figma 재조사 결과(S03~S08, S13/S14 등)에 맞춰
  다시 그리는 작업 — 채팅에서 별도 진행 예정.
- 사용자 앱 화면을 `design.md`의 공용 셸/컴포넌트를 써서 S01부터 순서대로 실제 라우트로
  퍼블리싱.
