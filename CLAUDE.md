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
  충돌 0건 검증됨)과 공용 컴포넌트를 만들었음. 상세 내역은 `design.md` 참고.
- **사용자 앱 화면 S01~S16: 전부 퍼블리싱 완료.** `src/app/m/` 아래 실제 라우트로 존재함
  (로그인/비번등록 → `/m/login`, `/m/register-password`; 홈 5states → `/m`(`?state=`로 상태
  전환); 근태 → `/m/attendance`, `/m/attendance/[date]`; 휴가 → `/m/leave`, `/m/leave/new`,
  `/m/leave/history`; 통계 → `/m/stats`(월간/연간 탭); 마이 → `/m/my`, `/m/my/password`).
  전 화면 Figma get_design_context로 스크린샷 대조 확인함. 아직 Supabase 근태/휴가/통계
  데이터에 연결되지 않은 정적 화면 단계 — `/m` 홈은 `?state=` 쿼리로, 실제 근태 상태
  대신 화면을 미리보는 임시 방편임. 다음 단계는 이 화면들을 실제 데이터에 연동하는 것
  (어드민이 A01~A15 화면 먼저 만들고 나중에 Supabase 연동한 것과 같은 순서).
- **S04~S06 결번 이슈: 해결됨.** 처음 조사했을 때는 Figma 파일에 S04/S05/S06 프레임이 아예
  없어서 `design.md`에 결번으로 기록했었는데, 이후 Figma 쪽에서 홈 화면 상태 변형들을
  재정리하면서 채워짐 — 지금은 `Design_Front` 페이지에 실제로 존재함(S04 홈 근무 중, S05 홈
  외출 중, S06 홈 외근 중; 기존에 S03 하위 상태로 뭉쳐 있던 프레임들이 재배치된 것). S01~S16
  전체가 빠짐없이 존재하는 상태.
- **사용자 앱 S01~S16 figma-pixel-accurate 정밀 재검증: 완료.** `~/.claude/skills/figma-pixel-accurate/`
  기준으로 전 화면 그룹별(S01~S03, S04~S07, S08~S09, S10~S12, S13~S14, S15~S16) 재대조 완료.
  **예외 1건**: S01 "생체인증으로 로그인" 버튼(+구분선)은 `src/lib/featureFlags.ts`의
  `BIOMETRIC_LOGIN_ENABLED = false`로 조건부 숨김 처리돼 있어 Figma 원본과 실제 렌더링이
  다름 — 이건 회귀가 아니라 아래 "사용자 앱 백엔드 연동"의 그룹F(WebAuthn) 착수 전까지의
  의도된 예외. 그룹F 시작 시 플래그만 true로 바꾸면 됨.
- **사용자 앱 백엔드 연동 — 그룹A(S01/S02 인증 플로우): 완료.** `src/app/m/` 전체가 정적
  Figma 목업(onClick/formAction/fetch/supabase import 0건)이었던 것을 전수조사로 확인한 뒤,
  최상위 의존성인 인증부터 실제로 연결함:
  - S01(`/m/login`): `signInWithPassword` + `employees.auth_user_id` 소속·`employment_status`
    검증(관리자 로그인의 `admin_profiles` 체크와 동일 패턴, `employees`는 `id`가 아니라
    `auth_user_id` 컬럼으로 연결되는 점만 다름). 세션 재검증은 프로젝트 전체 원칙대로
    `getUser()`만 사용(`getSession()` 금지).
  - S02(`/m/register-password`): 신규/재입사 직원은 **임시 비밀번호가 아니라 Supabase 초대
    링크** 방식 사용 — 관리자의 `createEmployee`/`rehireEmployee`가 이미 `inviteUserByEmail`/
    `resetPasswordForEmail`로 메일을 보내고 있었으므로, 그 `redirectTo`만 관리자용
    `/reset-password`에서 `/m/register-password`로 바꿈(`employees/actions.ts` 2곳). 이 방식
    덕분에 "최초 로그인 임시비번 판별" 로직 자체가 불필요해짐 — 비번 설정 전엔
    `signInWithPassword`가 항상 실패하므로 S01/S02 라우팅이 자연히 분리됨.
  - `proxy.ts`에 `/m/:path*` 세션 게이트 추가(`/m/login`, `/m/register-password`만 예외).
  - **라이브 테스트 전부 완료**: 로그인 실패(존재하지 않는 계정) 확인, 퇴사 계정 로그인 차단
    확인("퇴사 처리된 계정입니다. 관리자에게 문의하세요." 메시지 정확히 표시), proxy
    리다이렉트(307→`/m/login`) 확인, 실제 `inviteUserByEmail`로 발송된 초대 메일을 사용자가
    직접 클릭해서 `/auth/confirm`→`/m/register-password`→비밀번호 설정→로그인 성공까지
    end-to-end 확인. 테스트로 만든 employees/auth 레코드는 전부 정리 완료(원래 상태 복원).
  - S03~S16(체크인/휴가신청/통계 등)은 여전히 백엔드 미연동 — 그룹B부터 순서대로 예정.

## 배포 전 확인 필요

- **"이동석"(`blackds@by-bk.com`) employees 레코드 이상 상태**: `employment_status='terminated'`인데
  `auth_user_id=null`. 정상적인 `createEmployee`/`terminateEmployee` 플로우로 만들어진 행이
  아니라 시드/수동 삽입으로 보임(`supabase/seed.sql` 주석 참고 — "이 프로젝트에 등록된 첫
  번째 직원 기준"으로 attendance_records 더미 데이터를 넣을 때 쓰인 행). 실제 이 사람이
  재직 중인 직원이라면 관리자 웹에서 재입사 처리하거나 인사 정보를 다시 확인해야 하고, 테스트용
  더미 행이라면 배포 전에 삭제 검토. **이번 세션에서는 사용자 지시로 이 레코드를 건드리지
  않았음** — 배포 전 반드시 실제 인사팀/CD 확인 필요.
- **Supabase 이메일 발송 rate limit**: 기본 내장 이메일 서비스(커스텀 SMTP 미설정 —
  `.env`에 SMTP 관련 변수 없음, 프로젝트 API 키만 존재)를 쓰고 있어 발송 한도가 낮음.
  이번 세션에서 실제로 1회 초대 메일 발송 후 곧바로 재발송 시도가 "email rate limit
  exceeded"로 막혔다가 시간 경과 후(정확한 리셋 주기는 확인 못함) 재시도해서 성공한 걸
  실측함. 정확한 한도/리셋 주기는 Supabase 대시보드 Project Settings → Auth → Rate
  Limits에서 직접 확인 필요(Management API 권한 없이는 코드로 조회 불가). **여러 직원을
  동시/연속으로 초대해야 하는 실제 온보딩 시나리오라면, 배포 전 커스텀 SMTP(SendGrid/Resend
  등) 연동을 강하게 권장** — Supabase 공식 문서도 기본 내장 이메일은 프로덕션 대량 발송용이
  아니라고 명시함.

## 다음 작업

- 기존 `byWORK_와이어프레임_최종본.html`을 위 Figma 재조사 결과(S03~S08, S13/S14 등)에 맞춰
  다시 그리는 작업 — 채팅에서 별도 진행 예정.
- 사용자 앱 백엔드 연동 그룹B(S03~S09, 체크인/근태 핵심 로직) — 그룹A 완료 보고 후 사용자
  확인받고 시작. IP/GPS/hybrid 체크인 검증 로직이 프로젝트에 전혀 없는 상태(스키마 컬럼만
  존재)라 이번 그룹 중 가장 큰 작업.
- 그룹F(WebAuthn 생체인증, S01/S15): A~E 그룹 이후 우선순위. `BIOMETRIC_LOGIN_ENABLED` 플래그
  참고.
