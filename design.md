# byWORK 사용자 앱(모바일) 디자인 시스템

Figma "byWORK 근태 APP design" (`Cb5ZQsPWOScDxrjw8eojvI`, 페이지 `Design_Front`)의 S01~S16 프레임을
`get_design_context`/`get_screenshot`로 전수 조사해 확정한 공용 컴포넌트와 디자인 토큰 기록.
화면을 하나씩 퍼블리싱하기 전에 먼저 끝내야 하는 사전 작업 결과물이며, 실제 화면(라우트)은
아직 만들지 않았다.

## 0. 조사한 프레임 / 빠진 프레임

Figma 파일에 존재하는 프레임은 아래 13개 화면(홈은 3개 상태 변형 포함 총 15개 프레임)뿐이다.
**S04, S05, S06은 Figma 파일에 아예 존재하지 않는다** (검색해도 결과 없음 — 아직 디자인되지
않았거나 결번). 화면 퍼블리싱을 S01~S16 순서로 진행할 계획이라면 이 3개가 채워질 때까지
근태 캘린더(S08) 이전 구간 일부가 비어 있다는 점을 감안해야 한다.

| 코드 | 이름 | node id | 테마 |
| --- | --- | --- | --- |
| S01 | 로그인 | 79:1413 | dark |
| S02 | 비밀번호 등록 | 79:1541 | light |
| S03 | 홈 (출근 전 / 출근 중 / 외출 중, 3개 상태) | 2:251 / 61:1088 / 79:1244 | dark |
| S07 | 홈 (퇴근 후) | 81:1811 | dark |
| S08 | 근태 캘린더 | 86:442 | light |
| S09 | 근태 날짜 상세 | 82:2091 | light |
| S10 | 휴가 현황 | 82:3093 | light |
| S11 | 휴가 신청 | 88:703 | light |
| S12 | 휴가 내역 | 88:848 | light |
| S13 | 월간 통계 | 92:1224 | light |
| S14 | 연간 통계 | 92:1408 | light |
| S15 | 마이페이지 | 103:1781 | light |
| S16 | 비밀번호 변경 | 103:1948 | light |

## 1. 듀얼 테마 구조

어드민 웹과 가장 큰 차이점: 이 앱은 화면마다 **어두운 테마와 밝은 테마가 섞여** 있다.

- **dark**: S01(로그인), S03·S07(홈의 모든 상태)뿐. 검은 배경, 흰 텍스트, 노란 강조색
  (`--mobile-color-accent`).
- **light**: 나머지 전부(S02, S08~S16). 흰 배경, 검은 텍스트, dark-gray 강조.

버튼/하단 네비게이션의 "활성/강조" 색이 테마마다 다르다 (§3, §4 참고). 이 점이 컴포넌트
설계에서 가장 중요한 분기 조건이다.

## 2. 디자인 토큰

`src/app/globals.css`의 같은 `@theme inline` 블록 안에 `--mobile-` 접두사로만 추가했다.
Tailwind가 자동 유틸리티를 만드는 네이티브 네임스페이스(`--color-*`, `--text-*`, `--radius-*`,
`--spacing-*`)를 전혀 쓰지 않으므로(기존 어드민의 `--space-*`와 동일한 방식), 전부
`bg-[var(--mobile-color-black)]`처럼 arbitrary value로만 참조된다 → 어드민 토큰과 겹칠 방법이
구조적으로 없다.

### 2.1 색상 (`--mobile-color-*`)

| 토큰 | 값 | 용도 | 어드민 동일 값 토큰(참고용, 이름은 다름) |
| --- | --- | --- | --- |
| `--mobile-color-black` | `#000000` | dark 배경, light 테마 텍스트 | — |
| `--mobile-color-white` | `#ffffff` | dark 테마 텍스트, light 배경 | — |
| `--mobile-color-warm-gray` | `#9c9c9c` | 인풋 테두리/placeholder, outline 버튼(dark) | `--color-line` |
| `--mobile-color-soft-gray` | `#757575` | 보조 텍스트, 비활성 아바타 이니셜 | `--color-muted` |
| `--mobile-color-light-gray` | `#c7c7c7` | 구분선, 비활성 네비 텍스트 | `--color-divider` |
| `--mobile-color-line-gray` | `#e0e0e0` | dark 테마 인풋 라벨 | — |
| `--mobile-color-dark-gray` | `#4a4a4a` | light 테마 primary 버튼/활성 네비/칩 선택 | `--color-sidebar-active` |
| `--mobile-color-input-bg` | `#f5f5f5` | light 테마 인풋/텍스트에어리어 채움 | — |
| `--mobile-color-avatar-bg` | `#f8f8f8` | 아바타 원 배경 | — |
| `--mobile-color-track-bg` | `#f8f8f8` | 진행 바 트랙 | — |
| `--mobile-color-accent` | `#ffcc01` | dark 테마 primary 버튼, 탭 활성 점 | `--color-accent` |
| `--mobile-color-mint` | `#0dddb1` | 경과시간 텍스트, 진행 바 채움 | — |
| `--mobile-color-state-work` | `#c0f0c3` | 출근/승인 | `--color-status-work` |
| `--mobile-color-state-late` | `#ffe09e` | 지각/대기 | `--color-status-outside` |
| `--mobile-color-state-leave` | `#77c9ff` | 연차 | `--color-status-leave` |
| `--mobile-color-state-holiday` | `#ffc5c5` | 공휴/반려 | `--color-status-absent` |

### 2.2 타이포그래피 (`--mobile-text-*`, Pretendard, 항상 -2% letter-spacing)

| 토큰 | 크기 | 용도 |
| --- | --- | --- |
| `--mobile-text-badge` | 12px | 뱃지, 네비 라벨 |
| `--mobile-text-caption` | 13px | 인풋 라벨, 캡션 |
| `--mobile-text-body` | 14px | 본문, textarea |
| `--mobile-text-subtitle` | 16px | 인풋 값, 버튼 텍스트 |
| `--mobile-text-heading-sm` | 20px | 탭 루트 헤더(캘린더 월 표시 등) |
| `--mobile-text-heading` | 24px | 탭 루트 헤더(MY, 통계) |
| `--mobile-text-display` | 32px | 드릴인 화면 큰 타이틀 |
| `--mobile-text-hero` | 72px | 홈 화면 출퇴근 시각 표시 |

### 2.3 spacing / radius

`--mobile-space-{8,10,12,14,16,20,24,30}`, `--mobile-radius-{chip:8px, card:10px, input:14px,
pill:30px, badge:40px, avatar:200px}`. 값은 어드민의 `--space-*`/`--radius-*`와 일부 겹치지만
(둘 다 같은 Figma 8pt 그리드 습관을 쓰는 디자이너 산출물이라 자연스러운 우연) **변수 이름은
전부 다르다.**

### 2.4 충돌 검증

`grep`으로 `globals.css`의 모든 커스텀 프로퍼티 이름을 추출해 `--mobile-`로 시작하는 것과
아닌 것을 나눠 교집합을 구했다 — **결과 0건.** (admin 42개 / mobile 46개, 완전 분리 확인.)

## 3. 공용 컴포넌트 (`src/components/mobile/`)

| 파일 | 컴포넌트 | 설명 | 출처 프레임 |
| --- | --- | --- | --- |
| `Button.tsx` | `MobileButton` | 4 variant: `filled-accent`(dark 테마 primary, 노랑), `outline-warm`(dark 테마 secondary), `outline-dark`(light 테마 primary), `filled-muted`(S02 전용, 비활성처럼 보이는 회색 채움) | S01,S02,S03,S07,S11,S15,S16 |
| `TextField.tsx` | `MobileTextField`, `MobileTextArea` | 인풋 2종 — `bg="transparent"`(로그인류) / `bg="filled"`(날짜선택 등), textarea는 항상 filled | S01,S02,S11,S16 |
| `Chip.tsx` | `MobileChip` | 3지선다 세그먼트 칩 (연차/반차) — `"use client"` (선택 상태 토글) | S11 |
| `StatusBadge.tsx` | `MobileStatusBadge`, `MobileHeaderBadge` | 전자는 목록용 색상 칩(대기/승인/반려/정상 등), 후자는 dark 헤더 위 흰 필(근무중/퇴근완료) | S03,S07,S08,S09,S10,S12 |
| `TabBar.tsx` | `MobileTabBar` | 점+밑줄 탭(전체/대기중/승인/반려, 월간/연간) — `"use client"` | S12,S13,S14 |
| `ListRow.tsx` | `MobileListRow` | 날짜+설명 / 우측 뱃지, 하단 구분선 있는 목록 한 줄 | S10,S12 |
| `InfoBox.tsx` | `MobileInfoBox`, `MobileInfoRow`, `MobileFieldRow` | 앞 둘은 신청정보류 라벨/값 박스, `MobileFieldRow`는 마이페이지의 rounded-14 항목 행(chevron 포함 가능) | S11,S15 |
| `StatCard.tsx` | `MobileStatCard`, `MobileSummaryRow` | 전자는 통계 2열 카드, 후자는 캘린더 "N월 요약" 같은 세로 구분선 요약 행 | S08,S13,S14 |
| `CalendarCell.tsx` | `MobileCalendarCell`, `MobileCalendarWeekdayHeader` | 42×42 날짜 셀 (`work/late/leave/holiday/muted/empty` 상태) | S08 |
| `ProgressBar.tsx` | `MobileProgressBar` | 주간 누적 근무시간 바 | S03,S07 |
| `Avatar.tsx` | `MobileAvatar` | 이니셜 원형 아바타 | S15 |
| `BottomNav.tsx` | `MobileBottomNav` | 5탭 GNB, `theme="dark"\|"light"`로 활성색 자동 전환 | 전 화면 공통 셸 |
| `Header.tsx` | `MobileHomeHeader`, `MobileGreeting`, `MobileSubPageHeader`, `MobileTabRootHeader`, `MobileMonthPager` | §4 참고 — `"use client"` (뒤로가기/페이저 onClick) | 전 화면 공통 셸 |
| `Divider.tsx` | `MobileDivider` | 얇은 구분선 | 다수 |
| `icons.tsx` | `HomeIcon` 등 11종 | **임시 라인 아이콘.** Figma 원본 SVG는 7일 만료 임시 URL이라 담을 수 없었음 — 화면별 퍼블리싱 시 실제 아이콘 asset으로 교체 필요 (로고 워드마크도 현재 텍스트로 대체 중) | 전 화면 공통 |

Button의 `filled-muted` variant는 S02에서만 관찰됐다. 다른 상태 값이 없어 "폼 미검증 상태의
비활성 느낌 primary 버튼"으로 해석해 남겨뒀다 — 실제 화면 구현 시 폼 유효성에 따라
`outline-dark`/`filled-accent`와 전환하는 용도로 쓰일 가능성이 높다.

## 4. 공용 셸 구조 (헤더 + 하단 네비)

### 4.1 하단 네비게이션 (`MobileBottomNav`)

5개 탭 고정: 홈 / 근태 / 휴가 / 통계 / 마이. **핵심 발견**: 활성색은 화면의 배경 테마를
따른다 — dark 홈 화면(S03/S07)만 노란색(`--mobile-color-accent`)이고, 나머지 light 화면
전부(S08, S11, S12, S15, S16 코드로 대조 확인) dark-gray(`--mobile-color-dark-gray`)다.
스크린샷만 보면 근태 탭 활성색이 노란색처럼 보이는 착시가 있었는데, `get_design_context`로
실제 코드를 대조해 dark-gray가 맞다는 걸 확인했다.

### 4.2 헤더 3종 (`Header.tsx`)

1. **`MobileHomeHeader` + `MobileGreeting`** — S03/S07 전용. 어두운 배경, "by WORKS" 워드마크
   + 알림종, 그 아래 "안녕하세요 / OOO 님" 인사말 + 오늘 날짜. 홈 탭에만 쓰인다.
2. **`MobileSubPageHeader`** — 뒤로가기 아이콘(세로로 타이틀 위에 쌓임) + 32px ExtraBold
   타이틀(+선택적 서브타이틀). 드릴인/폼 화면(S02, S09, S11, S12, S16)에서 쓴다.
3. **`MobileTabRootHeader`** / **`MobileMonthPager`** — 뒤로가기 없이 탭 루트에 바로 오는
   화면(S10, S13, S14, S15)의 헤더. 20~24px 타이틀만 있거나(`size="sm"|"md"`), 캘린더(S08)처럼
   좌우 화살표로 기간을 넘기는 형태(`MobileMonthPager`)로 갈린다.

### 4.3 화면 레이아웃 뼈대

모든 화면 공통: 좌우 패딩 `--mobile-space-30`(30px), 상단 안전영역 `pt-[60px]`, 섹션 간
`gap-30`. 페이지 바디는 `헤더 → #Contents(스크롤 영역) → MobileBottomNav` 3단 구조.
실제 라우트 구현 시 권장 구조:

```
src/app/(mobile)/
  layout.tsx        # 테마별(dark/light) 배경색 + MobileBottomNav를 공통으로 얹는 셸
  m/page.tsx         # S03/S07 홈 (dark)
  m/attendance/...    # S08/S09 (light)
  m/leave/...         # S10/S11/S12 (light)
  m/stats/...          # S13/S14 (light)
  m/my/...             # S15/S16 (light)
```

로그인(S01)·비밀번호 등록(S02)은 하단 네비가 없는 인증 전 플로우라 이 셸 밖에 별도로 둔다.

## 5. 남은 작업 (이 문서 범위 밖)

- S04~S06 프레임이 Figma에 채워지는 대로 재조사.
- `icons.tsx`의 임시 아이콘과 로고 워드마크를 실제 Figma SVG export로 교체.
- 위 컴포넌트 인벤토리를 바탕으로 화면을 S01부터 하나씩 실제 라우트로 퍼블리싱.
