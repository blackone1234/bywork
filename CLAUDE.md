@AGENTS.md

- Supabase 스키마 작성 시 각 테이블에 RLS enable 하는 것과 별개로, service_role에 대한 GRANT(테이블/시퀀스/함수 + default privileges)를 항상 같이 포함할 것. RLS만 켜고 GRANT를 빠뜨리면 service_role 키로도 permission denied가 발생함.

## 진행 상황

- **연차 신청 취소 기능(대기중 철회 + 승인건 취소): 완료(2026-07-27).** CD가 "연차는
  승인 시점에 차감된다"는 사실을 확인한 뒤 "그럼 취소 기능이 아예 없는데 필요하지
  않냐"고 설계 요청 → 설계안 검토(반려 vs 취소 개념 분리, 컷오프 규칙, 알림 범위 등)
  후 승인받아 구현.
  - **설계 확정 사항(CD 결정)**: (1) 관리자 취소는 컷오프 예외 — 언제든 가능(운영상
    사후 정정 필요할 수 있음). (2) 컷오프 = "연차 시작일 전날, 회사 표준 퇴근시각까지"
    (직원 셀프취소에만 적용) — 나중에 규칙이 바뀔 수 있다는 전제로, 판단 로직을 SQL
    `leave_cancel_deadline()` 함수 하나 + TS `computeLeaveCancelDeadline()` 하나에만
    담아서 나중엔 그 두 곳만 고치면 되게 설계(하드코딩 없음, `getStandardEndTime()`
    신규 — `getStandardStartTime()`과 동일 패턴, A09 설정값 참조). (3) "알림"은 본인에게
    보여주는 결과 메시지(관리자=Toast, 사용자앱=`window.alert()`)로 한정 — 상대방에게
    실시간으로 알리는 인프라(notifications 테이블 등)는 이 앱에 아예 없어서 범위 밖으로
    명시. (4) 모바일 취소 버튼은 조건(대기중이거나, 승인+컷오프 이전) 미충족 시 완전히
    숨김.
  - **스키마**(`20260727000000_leave_request_cancellation.sql`, CD가 Supabase 대시보드
    SQL Editor에서 직접 실행): `leave_request_status` enum에 `'cancelled'` 추가(반려와는
    다른 개념 — 반려=관리자가 거부, 취소=신청자 본인 또는 관리자가 이미 확정된/대기중인
    요청을 철회). 신규 `leave_request_cancellations` 감사로그 테이블 — 근태 강제수정 때
    만든 `attendance_record_edits`와 동일 패턴이되, 취소 행위자가 직원 본인일 수도 관리자일
    수도 있어 `cancelled_by_employee_id`/`cancelled_by_admin_id` 두 FK 중 정확히 하나만
    채워지는 구조(`num_nonnulls(...) = 1` 체크 제약)로 분리. `cancel_leave_request(
    p_request_id, p_actor_employee_id, p_actor_admin_id, p_reason, p_bypass_deadline)`
    RPC — `approve_leave_request`와 동일하게 행 잠금(`for update`)으로 동시성 보호,
    현재 상태가 pending/approved 아니면 거부(`already_finalized`), 본인 소유 아니면
    거부(`not_owner`, 관리자 호출은 이 검사 생략), 컷오프 초과 시 거부
    (`cancel_deadline_passed`, `p_bypass_deadline=true`면 생략), `previous_status=
    'approved'`였을 때만 `employees.used_leave_days`를 자동 복원 후 감사로그 INSERT.
    기존 `leave_requests_no_overlap` EXCLUDE 제약(`where status in ('pending','approved')`)은
    수정 불필요 — `cancelled`는 반려와 같은 위치라 자동으로 겹침 검사 대상에서 빠짐(취소
    후 같은 기간 재신청 가능, 실측 확인).
  - **앱 코드**: `getStandardEndTime()`(companySettings.ts, 신규) + `leaveCancellation.ts`
    (신규, `computeLeaveCancelDeadline` 순수함수 — SQL의 `leave_cancel_deadline()`과
    같은 공식을 미러링, 목록 행마다 매번 DB 조회 안 하려고 순수 계산으로 분리).
    `employeeLeaveRequests.ts`에 `MyLeaveRequestRow.canCancel`(서버에서 미리 계산해서
    내려줌, `attendance.ts`의 `hasPendingReview` 패턴과 동일) + `cancelMyLeaveRequest`
    (본인 요청인지 서버에서 재확인 후 RPC 호출, 이 프로젝트 전반의 직원별 데이터 격리
    원칙). `leaveRequests.ts`/`LeaveStatusBadge.tsx`에 `cancelled`/"취소" 추가(배지 색은
    "퇴사" 배지와 같은 `status-terminated` 중립 회색 재사용, 새 토큰 안 만듦).
  - **UI — A06**: 필터탭에 "취소" 4번째로 추가. "승인" 상태 행의 "처리" 컬럼에 인라인
    텍스트 대신 "취소" 버튼 추가 → `CancelLeaveRequestModal`(신규, `EditAttendanceRecordModal`/
    `TerminateButton`과 동일한 `createPortal` 확인 모달, 사유 필수) → 제출. `useActionState`
    훅은 `LeaveRequestsTable`(테이블 전체를 감싸는 컴포넌트) 레벨에서 소유(기존 승인/반려와
    동일 이유 — 처리된 행 마크업이 바뀌어도 훅이 안 죽음), 모달 닫힘은 모달 자신의
    `useEffect(state.success → onClose)`가 처리하고 토스트는 테이블의 별도 effect가
    처리하도록 분리(**최초 구현에서 두 개를 한 effect에 합쳤다가 `react-hooks/set-state-
    in-effect` eslint 에러로 즉시 발견 → 분리해서 해결**).
  - **UI — S10/S12**: `MobileListRow`에 `action`(optional) prop 신규 추가(기존 배지용
    `trailing`과 별개로 행 아래에 조건부 노출, 다른 화면 회귀 없음 — 이 컴포넌트는
    S10/S12 전용이라 안전 확인 후 진행). `CancelLeaveRequestButton`(신규,
    `src/app/m/leave/`) — Figma에 없는 신규 UI라 `outline-warm` 계열 톤 낮춘 작은
    버튼으로 구현.
  - **라이브 버그 발견 + 수정(모바일 전용)**: 최초 구현은 admin과 동일하게
    `useActionState` + `<form action>` + `useEffect(state.success → window.alert)`
    패턴을 썼는데, **실측 테스트에서 취소 자체(DB 반영)는 정상 동작하는데 성공
    알럿이 전혀 안 뜨는 것을 발견**(Playwright dialog 캡처로 확인 — confirm은
    잡히는데 alert는 로그에 없음). 원인 분석: 이 버튼은 admin의 `LeaveRequestsTable`
    (안정적으로 계속 마운트된 채 남는 테이블-레벨 컴포넌트)과 달리, 부모인 S10/S12
    page.tsx(서버 컴포넌트)가 매 행마다 `r.canCancel ? <CancelLeaveRequestButton/> :
    undefined`로 **컴포넌트 자체의 렌더 여부**를 결정하는 구조였음 — 취소 성공으로
    `revalidatePath`가 발동해 서버에서 새 데이터(`canCancel: false`)를 다시 그리는
    순간, 이 컴포넌트 인스턴스 자체가 트리에서 사라지면서(unmount) `state.success`를
    기다리던 `useEffect`가 미처 못 뜨는 것으로 추정 — A08 "확인완료"에서 이미 겪었던
    "unmount가 피드백을 죽이는" 버그의 모바일/서버컴포넌트 버전. **수정**:
    `useActionState`+선언적 `<form action>` 바인딩을 걷어내고, 서버 액션을 폼 없이
    **직접 호출**(`await cancelLeaveRequestAction(...)`)하는 방식으로 교체 —
    `window.confirm` → `startTransition(async () => { await 액션(...); window.alert(...) })`
    구조라, alert 호출이 React가 취소 결과로 트리를 다시 그리기(그래서 이 컴포넌트를
    없애기) **전에** 같은 콜백 안에서 동기적으로 먼저 실행되므로 경쟁 자체가 사라짐.
    재배포 후 재검증(아래)에서 confirm+alert 둘 다 정상 캡처됨.
  - **라이브 검증**: 완전히 새로운 합성 테스트 직원(`휴가취소테스트직원`) + 임시 관리자
    계정으로 DB 레벨 RPC 시나리오 7개 전부 개별 검증 — (1) 대기중 취소: 복원 없음,
    감사로그 `previous_status='pending'`/`days_restored=0` 정확. (2) 승인 취소(컷오프
    이전): `used_leave_days` 정확히 복원, 감사로그 `days_restored`=신청일수와 일치.
    (3) 승인 취소를 컷오프 경과 후 직원이 시도 → `cancel_deadline_passed`로 정확히
    거부(상태 그대로 approved 유지). (4) 같은 요청을 관리자가 취소 → 컷오프 무시하고
    성공, `used_leave_days` 정확히 복원, 감사로그 `cancelled_by_admin_id`만 채워짐.
    (5) 타인이 남의 요청 취소 시도 → `not_owner`로 거부. (6) 이미 취소된 요청 재취소
    시도 → `already_finalized`로 거부. (7) 취소 후 같은 기간 재신청 → EXCLUDE 제약에
    안 걸리고 정상 접수. 이어서 UI 레벨로 모바일(S10 최근내역/S12 전체이력, 위 버그
    수정 전/후 둘 다 실측) + 관리자(A06 승인탭 취소 모달, 사유 없이 제출 시 `required`
    검증으로 막히는 것, 사유 입력 후 제출 시 토스트+목록에서 사라짐) 전부 실제 클릭
    흐름으로 재확인. 테스트 계정/데이터(직원 1명, 관리자 1명, 그에 딸린 leave_requests
    8건 + 감사로그 8건) 전부 삭제 후 재조회로 확인, **이동석의 실제 승인된 휴가
    요청(08.10~08.11)은 조회에만 노출되고 전혀 안 건드림**(`used_leave_days=2.0`,
    `updated_at` 이번 세션 이전 시각 그대로 재확인), 재직 직원 목록도 이동석+
    하이브리드테스트 2명으로 정확히 원상태. `tsc`/`eslint`/`next build` 클린,
    프로덕션 배포 완료.

- **A06(휴가승인) 연도 드롭다운 — 테이블 겹침(+탭 버튼 잘림 현상) 수정: 완료(2026-07-24).**
  CD가 실기기(모바일 Safari) 스크린샷으로 "연도 드롭다운을 펼치면 아래 테이블(날짜/상태/
  처리)과 겹쳐서 텍스트가 뒤섞이고, 좌측 첫 탭 버튼도 텍스트 없이 빈 회색 박스로 잘려
  보인다"고 보고 — A07/A08에서 이미 겪었던 것과 정확히 같은 `.stagger-item` 스태킹
  컨텍스트 버그(`animation-fill-mode:both`가 애니메이션 종료 후에도 identity matrix
  transform을 남겨 스태킹 컨텍스트를 만들고, DOM 순서상 나중인 테이블 `.stagger-item`이
  필터 행 위에 그려짐)인데 `src/app/(admin)/leave-requests/page.tsx`만 그때 확산에서
  빠져있었음(grep으로 재확인 — A01/A02/A04/A07/A08/A09~A12엔 이미 있는 `relative z-10`이
  A06 필터 행에는 없었음). 필터 탭+연도 드롭다운을 감싸는 첫 `.stagger-item`에 동일하게
  `relative z-10` 추가로 수정. **탭 버튼이 "빈 회색 박스"로 보였던 것도 별도 버그가 아니라
  같은 스태킹 겹침의 시각적 부작용으로 판단**(수정 후 재현 안 됨, 아래 검증 참고).
  라이브 검증(임시 관리자 테스트 계정, CD의 실제 뷰포트와 동일한 393×852, Chromium+WebKit
  둘 다): 드롭다운 닫힌 상태/펼친 상태 각각 스크린샷 확인 — "전체" 탭 텍스트 정상 노출
  (박스 100×42px, 잘림 없음), 드롭다운 펼쳤을 때 테이블과 섞이지 않고 흰 배경 위에 깔끔히
  z-50으로 올라오는 것 확인. 테스트 계정은 실데이터 쓰기 없이(읽기 전용) 삭제 및 재조회
  확인. `tsc`/`eslint`/`next build` 클린, 프로덕션 배포 완료.
- **관리자 근태 강제 수정 — "반영 안 되는" 버그(비고 stale-value) + 모달 시간필드 겹침
  진단/수정: 완료(2026-07-24).** CD가 "이동석 7/22 레코드를 수정했는데 반영이 안
  되는 것 같다"고 보고, 지시대로 DB 오버라이드 컬럼 직접 조회부터 시작.
  - **1번 — 비고(note) stale-value 버그**: DB 조회 결과 `admin_override_check_out_at`은
    16:50로 정확히 저장돼 있었고 `attendance_records_with_times` VIEW도 이를 정확히
    반영 — 오버라이드 자체는 처음부터 문제 없었음. 실제 A08 화면을 열어 재확인한
    결과 **체크아웃 시간은 정확히 16:50으로 나오는데 "비고"만 "근무중"으로 남아있어
    "퇴근"이 안 되는 것**을 발견 — 이게 CD가 "반영이 안 된다"고 느낀 실체였음.
    원인: `EditAttendanceRecordModal.tsx`의 "비고" 입력란이 매번 **현재 표시값을
    그대로 defaultValue로 미리 채워놓고 있어서**, 관리자가 그 필드를 건드리지 않고
    저장하면 그 시점의 문구가 문자 그대로 DB에 다시 저장됨 — `src/lib/attendance.ts`의
    `defaultNote()`(퇴근시간 유무로 "근무중"/"퇴근" 자동 판정)는 `note` 컬럼이
    **비어있을 때만** 작동하므로, 한 번이라도 값이 채워지면 그 뒤로는 체크아웃
    시간을 바꿔도 비고가 예전 값에 영구히 고정됨(모달 캡션이 약속하는 "자동 결정"이
    사실상 최초 1회만 유효했던 구조적 버그). **수정**: 비고 입력란을 항상 빈 값에서
    시작하도록 변경(현재 값은 placeholder로만 힌트 제공, 모달 상단 "원본값" 요약줄에서도
    확인 가능) — 비워서 제출하면 서버가 `null`로 저장하고 화면이 매번 최신 상태 기준으로
    다시 계산하므로, 관리자가 직접 다른 문구를 입력하지 않는 한 항상 자동 추적됨.
  - **2번 — 모달 출근/퇴근 시간 입력란 겹침**: `flex + flex-1`로 배치돼 있던 두
    `<input type="time">`을 1차로 `grid grid-cols-2`로 교체(A02/A07 모바일 레이아웃
    수정 때와 동일 원칙 — Tailwind의 `grid-cols-N`은 자동으로 `minmax(0,1fr)` 트랙을
    만들어 자식이 실제로 줄어들 수 있게 강제). 배포 후 Chromium/WebKit 헤드리스로는
    320~375px 전부 겹침 없음(gap 12px 정확히 분리, 그리드 트랙도 `getComputedStyle`로
    150.5px/150.5px 균등 분할 확인)까지 재확인하고 CD에게 완료 보고했는데, **CD가
    쿠키 삭제 + 브라우저 새로 열어서 재확인해도 실기기(iOS Safari)에서 여전히 겹친다고
    재보고** — 캐시 문제가 아니라 실제 코드 레벨 문제였음. **2차 원인 파악**: 그리드
    트랙 크기 계산 자체는 정확해도(`minmax(0,1fr)`), 그 위에 그려지는 `<input
    type="time">` **네이티브 위젯의 실제 렌더링 폭**이 트랙보다 커지면(iOS Dynamic
    Type 등 접근성 글자 크기 설정으로 네이티브 컨트롤 폰트가 커지는 경우 등, 로케일이
    "오후 4:55" 같은 한국어 12시간제라 영어보다 폭이 더 필요하기도 함) `overflow:
    visible`이 기본값이라 그 내용물이 박스 경계를 넘어 옆 칸을 침범할 수 있음 — 이건
    박스 자체 크기(트랙/그리드) 문제가 아니라 그 안에 그려지는 네이티브 콘텐츠가
    박스보다 큰 문제라 `grid`/`min-w-0`로는 애초에 막을 수 없는 종류였음. **최종
    수정**: 좁은 화면(기본, `grid-cols-1`)에서는 두 필드가 폭을 나눠 갖지 않고
    각자 전체 폭을 쓰도록 세로로 쌓고, `sm:`(≥640px, 데스크톱) 이상에서만
    `grid-cols-2`로 좌우 배치 — 애초에 폭을 두고 경쟁하는 구조 자체를 모바일에서
    없애버려서, 네이티브 위젯이 얼마나 넓게 그려지든 옆 필드를 침범할 여지 자체를
    구조적으로 차단.
  - **2번, 3차 수정(최종) — `<input type="time">` 자체를 걷어냄**: 세로 스택으로
    바꾼 뒤에도 CD가 실기기에서 여전히 버그라고 재보고(스크린샷: 두 시간 필드 모두
    오른쪽 경계가 모달/화면 밖으로 살짝 삐져나옴). Playwright로 재확인한 결과
    `document.documentElement.scrollWidth`/`getBoundingClientRect()` 등 DOM/CSS
    레벨 측정치는 전부 정상(box 313px, 뷰포트 393px, 여유 40px)이라 **레이아웃
    자체는 문제가 없고, 그 위에 그려지는 iOS 네이티브 시간 피커(UIKit)의 실제 렌더링이
    CSS 박스 폭을 무시하고 그 바깥까지 그려지는 것으로 결론** — 이건 grid/flex 같은
    레이아웃 기법으로는 원천적으로 통제 불가능한 영역(박스 크기는 맞는데 그 안에
    그려지는 네이티브 콘텐츠 자체가 박스보다 큼, `overflow`도 폼 컨트롤의 네이티브
    chrome엔 안 먹힐 수 있음). **최종 해결**: 네이티브 `<input type="time">`를 완전히
    걷어내고 `<input type="text" inputMode="numeric">` 기반의 커스텀 시간 입력
    (`TimeTextField`, 신규)으로 교체 — 숫자만 타이핑하면 자동으로 콜론이 삽입되고
    (`formatTimeInput`: "1655" 입력 시 "16:55"로), `pattern` 속성으로 HH:MM 형식만
    허용. 이러면 OS/브라우저가 자체적으로 그리는 네이티브 피커 UI 자체가 없어져서,
    이런 종류의 렌더링 불일치가 애초에 발생할 수 없는 구조가 된다(평범한 텍스트
    박스는 모든 브라우저/기기에서 CSS 박스 모델을 그대로 따름). 서버 액션
    (`editAttendanceRecord`)에도 동일한 정규식(`TIME_PATTERN`) 검증을 추가해서
    JS 우회/폼 직접 조작 경로까지 방어(2중 방어 — 클라이언트는 `pattern` 속성으로
    네이티브 폼 검증이 먼저 막고, 서버는 그와 별개로 한 번 더 검증).
  - **라이브 검증(3차)**: 합성 테스트 직원으로 "0900"/"1830" 타이핑 → 자동으로
    "09:00"/"18:30"로 포맷되는 것 확인 → 저장 → 목록에 정확히 반영("퇴근" 자동
    판정까지) 확인. 형식 오류 유도(JS로 "99:99" 강제 주입 후 제출) → 브라우저 native
    `pattern` 검증이 제출 자체를 막는 것 확인(서버까지 요청이 안 감 — 정상 동작).
    WebKit 393px에서 두 필드 다 313px 박스, 겹침/삐져나옴 없이 깔끔한 일반 텍스트
    박스로 렌더링되는 것 스크린샷 확인. 테스트 직원/관리자 계정 전부 삭제 및
    재조회 확인, 재직 직원 목록 이동석+하이브리드테스트 2명으로 원상태 재확인.
    `tsc`/`eslint`/`next build` 클린, 프로덕션 배포 완료.
  - **2번, 4차 수정(최종 확정) — 텍스트 입력 되돌리고 A09 방식(네이티브 피커, auto
    width)으로 통일**: CD가 "같은 기능인데 A09 근무설정 시간입력이랑 다른 게 이상하다"고
    지적 — A09(`WorkSettingsTabs.tsx` 기본근무 탭 시작/종료시간)도 여전히 네이티브
    `<input type="time">`를 쓰고 있었는데, 이번 근태수정 모달만 3차 수정으로 일반
    텍스트입력으로 바뀌어 있어 둘의 UX가 달라진 상태였음. CD가 "직접입력보다 네이티브
    피커가 낫다"며 A09 방식으로 통일 요청 — 단, 네이티브 피커로 되돌리면 방금 고친
    실기기 겹침 버그가 재현될 위험이 있어 **먼저 A09 자체를 실기기로 테스트**하기로
    합의(CD 선택). **CD가 A09를 실기기(iOS Safari)에서 확인한 결과 겹침 없음**
    (스크린샷: "오전 9:00"/"오후 6:00" 트리거 버튼이 나란히 깨끗하게 렌더링, 탭하면
    뜨는 iOS 휠 피커 시트도 정상). **결정적 차이를 코드로 재확인**: A09의 `<input
    type="time">`는 `width`를 전혀 강제하지 않고(auto/intrinsic 크기, `flex items-
    center gap-[10px]`) 순수 `<input>` 태그를 직접 씀 — 근태수정 모달은 공용
    `TextField` 컴포넌트를 썼는데 이 컴포넌트는 `variant` 상관없이 **항상
    `width:100%`를 강제**하는 구조였음(`fullWidth` prop은 `max-w-[500px]` 유무만
    결정, `w-full` 자체는 항상 붙음). **재해석**: 3차 수정 때 "네이티브 위젯이 박스보다
    넓게 그려져서 못 막는다"고 결론 내렸던 게 부정확했음 — 실제로는 "네이티브 시간
    위젯에 CSS `width:100%`를 강제로 씌우는 것 자체가 WebKit 렌더링과 충돌"이었던
    것으로 재확인(세로로 쌓아서 옆에 경쟁 요소가 전혀 없었던 2차 수정본에서도 여전히
    겹쳤던 게 이 설명과 정확히 들어맞음 — "옆 필드 침범"이 아니라 "강제된 폭 자체의
    문제"). **최종 구현**: `TextField` 대신 A09와 동일하게 순수 `<input type="time">`
    + 폭 강제 없는 `TIME_INPUT_CLASSNAME`(A09 스타일 그대로 재사용, `flex items-
    center gap-[10px]`)로 교체. 3차 수정에서 만들었던 텍스트입력 방식(`TimeTextField`
    로컬 컴포넌트, 공용 컴포넌트로 뽑아뒀던 `src/components/admin/TimeTextField.tsx`
    포함)은 전부 삭제(미사용 코드 방치 안 함). 서버 액션의 `TIME_PATTERN` 정규식
    검증은 그대로 유지(네이티브 `type="time"`이면 사실상 항상 유효한 값만 오지만,
    폼을 거치지 않는 요청 경로에 대한 최종 방어선으로는 여전히 유효).
  - **라이브 검증(4차)**: 합성 테스트 직원 + WebKit 393px로 재확인 — 두 필드가 각각
    121px(auto width)로 나란히 렌더링, 313px 사용가능 폭 중 252px만 사용해서 여유
    있음(3차 수정 때의 313px 강제폭과 대조). "09:00"/"18:30" 저장 → 목록에 정확히
    반영("퇴근" 자동 판정 포함)까지 재확인. 최종 실기기 판정은 CD 몫 — A09가 이미
    실기기에서 검증됐고 근태수정 모달을 A09와 완전히 동일한 코드 패턴으로 맞췄으므로
    같은 결과가 나올 것으로 예상되나, 확정은 CD의 실기기 재확인 후. 테스트 직원/관리자
    계정 전부 삭제 및 재조회 확인, 재직 직원 목록 이동석+하이브리드테스트 2명으로
    원상태 재확인. `tsc`/`eslint`/`next build` 클린, 프로덕션 배포 완료.
  - **라이브 검증**: 합성 테스트 직원으로 "출근만 입력→비고 근무중" → "퇴근시간 추가,
    비고 안 건드림→비고 자동으로 퇴근" → "퇴근시간 다시 제거→비고 자동으로 근무중"
    3단계 왕복 전부 정확히 재계산되는 것 확인(수정 전이었으면 3단계 다 "근무중"에
    고정돼 있었을 상황). 이후 **이동석의 실제 7/22 레코드에 같은 기능으로 직접
    적용**(CD의 안전 지시에 따라 별도 테스트로 먼저 검증한 뒤, 실데이터는 이 1건만
    최소한으로 건드림) — 출근/퇴근 시간은 전혀 안 바꾸고 비고 필드만 비워서 저장 →
    "근무중"→"퇴근"으로 정확히 정정, DB 감사로그(`attendance_record_edits`)의
    before/after로 checkInAt/checkOutAt은 완전히 동일하고 note만 "근무중"→`null`로
    바뀐 것 확인. 모달 레이아웃도 이동석의 실제 화면에서 Chromium+WebKit ×
    320px/375px 4가지 조합 전부 겹침 없음(gap 12px) 재확인. **정리**: 진단용 임시
    관리자 계정으로 이동석의 실제 레코드를 정당하게 수정했기 때문에
    `attendance_record_edits.edited_by` 감사로그 FK가 이 계정을 참조하게 됨 —
    감사 추적 무결성을 위해 계정 자체(`admin_profiles`)는 삭제하지 않고, 로그인만
    막기 위해 `auth.users` 비밀번호를 랜덤값으로 무효화(완전 삭제 대신 이 방식을
    쓴 것은 이번이 처음 — 이전 세션들의 테스트 계정은 전부 실데이터에 감사로그를
    남긴 적이 없어 그냥 삭제가 가능했었음). 합성 테스트 직원/레코드는 전부 삭제 후
    재조회로 확인. 이동석 `employees` 행 자체(`updated_at`)는 이번 세션에서 전혀
    안 건드림(공백/외출/근무시간 등 다른 필드 무변경) 재확인, 재직중 직원 목록도
    이동석+하이브리드테스트 2명으로 정확히 원상태. `tsc`/`eslint`/`next build`
    클린, 프로덕션 배포 완료.
- **CD(blackds@by-bk.com) 사용자앱 로그인 실패 — 임시 비밀번호 재발급으로 해결
  (2026-07-22/23, 근본원인 미확정).** CD가 `/m/login`(사용자앱, 관리자 `/login`
  아님)에서 아이디/비밀번호 정확히 입력했는데도 반복 실패 보고. 진단 결과:
  - 계정 자체(잠금/이메일미인증 등)·`employees.auth_user_id` 연결·
    `employment_status`(active) 전부 정상 — 로그인을 막을 만한 설정상 이유
    없음.
  - `auth.users.updated_at`이 로그인 시도 시작 시각과 거의 정확히 일치해서
    "본인이 모르게 비밀번호가 바뀐 것 아니냐" 의심했으나, **CD가 비밀번호를
    바꾼 적 없다고 명확히 답변** — 이 시간 일치의 실제 원인은 끝내 특정 못함
    (세션 토큰 갱신 등 비밀번호 변경과 무관한 이유로도 이 필드가 바뀔 수 있어
    확정적 증거는 아니었음, 이번 세션에서 이 계정을 건드린 적 없음도 재확인).
  - `login()` 서버 액션(`m/login/actions.ts`)이 보안상 실패 사유를 서버 로그에
    전혀 안 남기는 구조라(의도된 설계), Vercel 로그로는 "요청이 서버까지는
    정상 도달했다"까지만 확인되고 정확한 실패 사유(비밀번호 오탈자/자동완성
    문제 등)는 끝내 특정 불가.
  - **조치**: CD 명시적 확인 받은 후 service_role로 임시 비밀번호 발급
    (`auth.users` PUT). CD가 로그인 성공 확인 완료. **CD에게 로그인 후 본인이
    기억할 수 있는 비밀번호로 바로 재설정할 것을 안내함** — 다음 세션에서
    확인 필요.
- **A01~A15 전수 재확인(7번) + A04 "요일" 하드코딩 수정: 완료(2026-07-22).**
  A01(대시보드) 재작업 이후 "다른 화면에도 A01 같은 빠진 게 더 있을 수 있다"는
  우려로, "이미 확인된 화면"이라고 넘기지 말고 A01~A15 각 페이지 파일을 전부
  직접 열어서 재조사. **결과: A04의 "요일" 필드 하나만 진짜 하드코딩**(나머지
  13개 화면은 전부 실쿼리/실제 서버 액션 확인 — A03/A05/A13/A14는 폼 전용이라
  애초에 조회할 데이터가 없는 구조, A15는 여전히 구현 자체가 없음, A12의
  "서비스 명: 공공 데이터 포털"은 고정 라벨이라 문제 아님).
  - **A04 "요일: 월~금" 하드코딩 수정**: `src/lib/companySettings.ts`에
    `formatWorkdaysLabel(workdays: number[]): string` 신규(1=월..7=일 배열을
    "월,화,수,목,금" 형태로 변환) — A09(WorkSettingsTabs.tsx)에 라벨→숫자
    매핑(`DAY_NUMBER`)은 있었지만 반대 방향(숫자→라벨) 변환은 어디에도 없어서
    신규 작성. `employees/[id]/page.tsx`에서 `getEmployee(id)`와
    `getCompanySettings()`를 `Promise.all`로 병렬 조회(서로 결과에 의존 안
    함 — waterfall 방지 기존 관례) 후 `EmployeeDetailForm`에 `workdaysLabel`
    prop으로 전달, 하드코딩 문자열을 그 값으로 교체. **직원별 "개별" 요일
    설정 기능 자체가 스키마에 없어서**(A09 안내문 "개별설정 없는 전 직원에
    일괄 적용됩니다"와 동일 전제) 회사 공통 `company_settings.workdays`를
    그대로 보여주는 자리로 구현 — 필드 라벨이 "근무설정 (개별)"이라 오해의
    소지가 있지만 실제 개별화 기능이 없다는 기존 설계 그대로, 이번 범위는
    표시값만 실데이터로 교체.
  - **라이브 검증(로컬, 임시 관리자 테스트 계정 + 영구 테스트 계정
    "하이브리드테스트")**: A09에서 실제로 요일 체크박스를 월화수목금→화목토로
    바꿔 저장(토스트 확인) → A04 상세 화면에 "화,목,토"로 정확히 반영되는 것
    확인 → 다시 월화수목금으로 복원해 A04도 원래대로 돌아오는 것까지 확인.
    이 과정 내내 "연차"(자동계산 15일)/"인증방식"(IP+GPS 하이브리드) 두 실데이터
    필드는 전혀 안 바뀌고 그대로 유지되어 회귀 없음 확인. `company_settings.
    workdays` DB값도 최종적으로 원래 `[1,2,3,4,5]`로 정확히 복원된 것 재조회로
    확인. 테스트 관리자 계정 삭제 및 재조회 확인, "이동석" `updated_at` 불변
    재확인. `tsc`/`eslint`/`next build` 클린, 프로덕션 배포 완료.
- **IP 인증 실패 에러 메시지 개선(네트워크 상태 감지 가능 여부 조사 후 톤 완화):
  완료(2026-07-22).** 착수 전 `navigator.onLine`으로 실제 네트워크 상태를 감지해서
  조건부 문구를 보여줄 수 있는지 웹 조사부터 진행 — **iOS Safari는 오프라인이어도
  `navigator.onLine`이 거의 항상 `true`만 반환하는 알려진 WebKit 버그가 있음을
  확인**(bugs.webkit.org #171277 "navigator.onLine always returns true on iOS",
  #225645 "Safari 14 navigator.onLine returns true despite wifi turned off" —
  둘 다 실제 버그 트래커에서 확인). MDN도 "Chrome/Safari는 로컬 네트워크/라우터
  연결 자체가 안 될 때만 false, 그 외(우리가 겪은 IP 화이트리스트 불일치 같은
  케이스 포함)는 전부 true"라고 명시. **결론: 감지 불가능으로 판단**, 조건부
  분기 대신 기존 문구에 톤 완화 문구를 추가하는 방향으로 확정.
  `src/lib/attendanceEvents.ts`의 `ip_mismatch` 메시지를 "등록된 사내 IP에서만
  처리할 수 있습니다."에서 "...일시적인 네트워크 문제일 수 있으니 잠시 후 다시
  시도해주세요."를 덧붙이는 것으로 수정 — 앞서 CD가 실사용 중 겪었던 사례(기기가
  사내 wifi로 완전히 전환되기 전 클릭했을 가능성, 2026-07-22 진단 기록)를 그대로
  반영. 라이브 검증(로컬, 신규 ip_only 테스트 직원): 화이트리스트에 없는 IP로
  출근 시도 → 새 문구 정확히 노출 + 스크린샷으로 레이아웃(두 줄로 자연스럽게
  줄바꿈) 확인. 테스트 데이터 삭제 및 재조회 확인, "이동석" 미접촉 재확인.
  `tsc`/`eslint`/`next build` 클린, 프로덕션 배포 완료.
- **E03(세션만료) 배너 통일 + E06(404)/E07(500) 실제 연결: 완료(2026-07-22).** 직전
  E01~E07 조사 리포트에서 "실제로 연결이 의미 있는 건 E03(부분)/E06/E07뿐"이라고
  판단한 결과를 CD 승인 받아 바로 구현.
  - **E03 — 세션만료 배너 통일**: `proxy.ts`가 `/m/*` 미인증 시 조용히
    `/m/login`으로만 보내던 것을 `?error=세션이 만료됐어요. 다시 로그인해주세요.`를
    붙이도록 수정(관리자 쪽 `/login` 리다이렉트는 지시대로 이번 범위 밖, 그대로 둠).
    `MobileLoginNotice`는 기존에 이미 임의의 `?error=`를 범용으로 읽어서 배너로
    보여주는 컴포넌트라 그 자체는 수정 불필요. `getCurrentEmployee()`가 null일 때
    (세션은 있지만 employees에 매칭 없음) `m/page.tsx` 등 **/m 밑 8개 page.tsx가
    전부 각자 다른 즉석 하드코딩 `<div>`를 반복하고 있던 것**(m/page.tsx,
    attendance/page.tsx, attendance/[date]/page.tsx, my/page.tsx, stats/page.tsx,
    leave/page.tsx, leave/new/page.tsx, leave/history/page.tsx)을 전부
    `redirect('/m/login?error=...')`로 통일 — 문구가 화면마다 흩어지지 않도록
    `employeeAccount.ts`에 `EMPLOYEE_SESSION_EXPIRED_MESSAGE` 상수를 신규로 뽑아
    8곳이 전부 같은 곳을 참조하게 함. `actions.ts` 3개(m/actions.ts,
    my/password/actions.ts, leave/new/actions.ts)는 서버 액션이라 리다이렉트가
    안 맞아 기존 `{error}` 반환 패턴 그대로 유지(변경 안 함). `adminAccount.ts`의
    `assertAdminRequest()` throw 지점들은 지시대로 이번 범위 밖, 손 안 댐. E03
    화면 자체(`e03/page.tsx`)도 지시대로 코드 변경 없이 리뷰 전용으로 유지.
  - **E06 — 404**: `src/app/not-found.tsx`(루트, 관리자/공용 — Figma에 관리자용
    404 디자인이 없어서 dashboard/error.tsx와 톤을 맞춰 새로 구성) +
    `src/app/m/not-found.tsx`(E06 마크업 그대로 이식) 신규. **원본
    `screens/errors/e06/page.tsx`는 "이동" 지시대로 삭제**하고 `/screens`
    인덱스의 E06 카드 링크는 실제 404를 트리거하는 존재하지 않는 `/m` 경로로
    바꿈. **구현 중 발견한 함정**: Next.js 문서(`not-found.md`) 재확인 결과
    "root app/not-found.js... handle any unmatched URLs" — nested
    `not-found.tsx`는 세그먼트 내부에서 **명시적으로 `notFound()`가 호출됐을
    때만** 적용되고, URL 자체가 아예 매치 안 되는 진짜 404는 nested 여부와
    무관하게 항상 루트로 간다는 걸 실측으로 처음 확인(`/m/존재안함` 접속 시
    루트 문구 "대시보드로 이동"이 잘못 뜨는 걸 스크린샷으로 포착). 해결책으로
    `src/app/m/[...catchAll]/page.tsx`(신규, `notFound()`만 호출하는 catch-all
    동적 라우트) 추가 — `/m/*` 중 기존 명시적 라우트에 안 걸리는 모든 경로가
    이 파일에 매치되고, 그 안에서 명시적으로 `notFound()`를 던지므로 그제서야
    `m/not-found.tsx`가 정확히 적용됨.
  - **E07 — 500**: `src/app/error.tsx`(루트, 관리자/공용 fallback) +
    `src/app/m/error.tsx`(E07 마크업 재사용 — 원본은 "이동" 지시가 없어서
    리뷰용으로 그대로 남김) + `src/app/global-error.tsx`(루트 layout 자체가
    깨지는 극히 드문 경우의 최종 fallback, 자체 `<html>/<body>` +
    globals.css import 필요, 문서 확인) 신규. `unstable_retry` 콜백명은 앞서
    A01 작업 때 이미 문서로 확인된 것 재사용. **m/error.tsx는 Figma(E07)
    원본이 버튼 1개("홈으로 이동")뿐이라, `unstable_retry`를 받기만 하고
    버튼으로 노출은 안 함**(임의로 "다시 시도" 버튼을 추가하려다가 pixel-accurate
    원칙에 안 맞다고 판단해 되돌림).
  - **라이브 검증(로컬, 임시 관리자 테스트 계정 + 영구 테스트 계정
    "하이브리드테스트")**: (1) 실제 세션 쿠키를 손상시켜 `/m` 재접속 →
    `/m/login?error=세션이 만료됐어요...`로 정확히 리다이렉트+배너 확인.
    (2) 관리자 세션으로 `/m` 접근(= employees 미매칭 케이스) → 8개 페이지
    전부 `/m/login?error=로그인 정보를 확인할 수 없습니다...`로 통일 리다이렉트
    확인(전 페이지 개별 실측). (3) 관리자/모바일 양쪽에서 존재하지 않는 경로
    접속 → 관리자는 "대시보드로 이동", 모바일은 정확히 E06 문구("홈으로 이동")로
    분리 확인, 둘 다 실제 HTTP 404 상태코드 확인. (4) A01(dashboard/error.tsx
    재검증)/A02 직원관리(루트 error.tsx)/m/attendance(m/error.tsx) 3곳에서
    각각 강제 예외 발생시켜 서로 다른 올바른 에러 화면이 뜨는 것 확인(A01은
    사이드바 유지, A02/모바일은 각자 스타일로 정확히 분리). **디버깅 삽질**:
    처음엔 페이지 최상단에 무조건 `throw`를 넣는 방식으로 500을 재현하려
    했는데, 이러면 TypeScript가 그 이후 코드의 null-narrowing을 이상하게
    풀어버려서(`employee`가 다시 `possibly null`로 잡힘) 빌드가 깨짐 —
    강제 throw 대신 실제 Supabase 쿼리를 존재하지 않는 테이블명으로 바꿔
    "진짜 쿼리 실패"를 재현하는 방식으로 우회. (5) E01(초대링크 만료,
    `/auth/confirm`에 잘못된 토큰)과 E02(GPS 거부, 신규 gps_only 테스트
    직원) 둘 다 기존 인라인 처리 그대로 정상 동작(회귀 없음) 확인, E04는
    앞선 3)에서 이미 함께 확인. 테스트 데이터/계정 전부 삭제 및 재조회 확인,
    "이동석" `updated_at` 불변 재확인, 활성 직원 2명으로 정확히 원상복구
    확인. `tsc`/`eslint`/`next build` 클린, 프로덕션 배포 완료.
- **A01 대시보드 "퇴근완료" 전용 배지 추가(모바일 앱과 매칭): 완료(2026-07-22).**
  바로 위 항목에서 `check_out` 이벤트를 관리자 배지 4종뿐이라 "근무중"으로 합쳐
  뒀는데, CD가 "모바일 앱(S07)엔 퇴근완료로 뜨는데 대시보드는 근무중이라 매칭이
  안 맞는다"고 재지적 — 이번엔 CD가 Figma를 직접 수정해서 5번째 State variant
  ("퇴근완료", node `226:1777`)를 새로 추가해준 뒤 재확인 요청. get_design_context로
  실측한 결과 배경색 `var(--light-gray,#c7c7c7)`가 이 프로젝트 `--color-divider`
  토큰과 정확히 같은 hex라 새 색상 정의 없이 `bg-divider text-black`로 재사용
  가능함을 확인.
  - `StatusBadge.tsx`의 `AttendanceState`에 `"퇴근완료"` 추가, `STATE_STYLES`에
    `bg-divider text-black` 매핑 추가(AttendanceState를 참조하는 다른 소비처가
    `dashboard.ts` 하나뿐이라 exhaustive-switch 등 회귀 위험 없음을 grep으로
    재확인 후 진행).
  - `src/lib/dashboard.ts`의 `EVENT_TO_STATE`에서 `check_out: "근무중"`을
    `check_out: "퇴근완료"`로 변경. **"출근중" 카드는 여전히 5개뿐**(퇴근완료
    전용 카드는 Figma에도 없음)이라, 카드 집계 로직은 "근무중" 또는 "퇴근완료"
    상태 둘 다 `working` 카운트에 포함되도록 분리(배지 표시(state)와 카드
    집계(working count)를 서로 다른 기준으로 유지 — 배지는 세분화, 카드는
    "출근했다"는 상위 개념으로 합산).
  - **라이브 검증(로컬, 임시 관리자 테스트 계정)**: 오늘 이미 외출→복귀→퇴근을
    마친 "하이브리드테스트"가 이번엔 정확히 "퇴근완료"(회색 배지)로 표시되고,
    "이동석"은 그대로 "근무중"(초록 배지) 유지, 출근중 카드는 여전히 2명으로
    정확히 집계되는 것 스크린샷으로 확인. 테스트 계정 삭제 및 재조회 확인,
    "이동석" `updated_at` 불변 재확인. `tsc`/`eslint`/`next build` 클린,
    프로덕션 배포 완료.
- **A01 대시보드 "현재상태" 버그 수정 — status 컬럼 대신 이벤트 기반 판정으로 전환:
  완료(2026-07-22).** CD가 실사용 중 발견: 하이브리드테스트 계정이 근태데이터(A08)엔
  퇴근(체크아웃 시각 있음)으로 나오는데 대시보드(A01)엔 계속 "외출중"으로 뜸.
  - **원인**: 방금 만든 A01 구현이 `attendance_records.status`로 상태를 판정했는데,
    이 컬럼은 **한 번 외출(go_out)하면 그날 내내 'remote'로 고정**되는 히스토리성
    플래그다(그날 무슨 일이 있었는지 요약 — A08 "비고"가 "외출/외근"을 계속 보여주는
    게 정확히 이 용도라 의도된 동작. 복귀/퇴근 이벤트 어디에도 status를 다시
    'present'로 되돌리는 코드가 없음, 직접 확인). 반면 대시보드의 "현재상태"는
    **지금 이 순간의 라이브 상태**를 보여줘야 하는데 같은 컬럼을 잘못 재사용한 것 —
    모바일 홈(S03~S07, `src/app/m/page.tsx`의 `LAST_EVENT_TO_STATE`)은 이미
    "오늘의 마지막 확정 이벤트 타입" 기준으로 라이브 상태를 정확히 판정하고
    있었는데, A01만 그 패턴을 안 따르고 새로 잘못 만든 셈.
  - **수정**: `src/lib/dashboard.ts`에 `EVENT_TO_STATE` 매핑 신규(모바일의
    `LAST_EVENT_TO_STATE`와 동일 원리) — 오늘자 `attendance_records`의 마지막
    confirmed `attendance_events.event_type`으로 상태 판정(check_in/return/
    check_out→근무중, go_out_personal/go_out_business→외출중, 이벤트 없음→미출근).
    관리자 배지는 4종뿐이라 모바일의 5번째 상태("퇴근후")는 별도 배지가 없어
    "근무중"으로 합침(외출중처럼 진행형이 아니라 그날 정상 근무를 마쳤다는 점에서
    근무중과 같은 묶음).
  - **연쇄로 발견한 별도 버그(같은 로직 재작성 중 확인, 사용자가 보고한 것과는
    별개)**: "휴가중" 판정도 원래 `attendance_records.status='on_leave'`를 썼는데,
    **이 값은 코드 어디에서도 실제로 set되지 않는 죽은 값**(grep으로 재확인 —
    on_leave는 타입 정의와 표시(NOTE_FALLBACK 등)에만 쓰이고 쓰기 경로가 전혀
    없음, S08 모바일 캘린더의 연차 배지도 같은 컬럼을 참조해서 잠재적으로 같은
    문제를 안고 있어 보이지만 이번 수정 범위 밖이라 손 안 댐). 그대로 뒀으면
    A01의 "휴가" 카드/배지가 실제로는 늘 0으로만 뜨는 잠재 버그였음 — 대신
    `leave_requests`에서 `status='approved'`이고 오늘이 `[start_date, end_date]`
    안에 들어가는지로 직접 판정하도록 변경.
  - **라이브 재검증(로컬, 임시 관리자 테스트 계정)**: 오늘 이미 외출→복귀→퇴근을
    전부 마친 "하이브리드테스트"로 재확인 — 수정 전엔 "외출중"으로 잘못 뜨던 것이
    수정 후 정확히 "근무중"으로 표시(체크인/체크아웃 시각·주간근무시간은 그대로
    08:55/15:06/6h 유지), 카드도 출근중 2명/외출·외근 0명으로 정확히 재계산됨을
    확인. "휴가중" 로직은 완전히 새로운 합성 테스트 직원 + 오늘 날짜 포함하는
    승인된 휴가 신청 1건으로 별도 검증 — 휴가 카드 1명, 해당 직원 행이 정확히
    "휴가중"(출퇴근시각/주간근무시간 전부 "-"/0h)으로 뜨는 것 확인. 테스트 데이터
    전부 삭제 및 재조회 확인, "이동석" `updated_at` 불변 재확인. `tsc`/`eslint`/
    `next build` 클린, 프로덕션 배포 완료.
- **A01 대시보드 — 실데이터 연동: 완료(2026-07-22).** `src/lib/dummy-data.ts`의
  `dashboardStats`/`todayAttendance`/`dashboardNotice`(+전용 타입 `TodayAttendanceRow`)를
  전량 제거하고 신규 `src/lib/dashboard.ts`의 Supabase 쿼리로 교체. 착수 전 Figma
  node `111:3158`(A01, get_design_context)로 실측 확인한 것들:
  - **상태값 매핑**: State 컴포넌트의 표시 라벨이 근무중/외출중/휴가중/미출근으로
    이미 기존 관리자 `StatusBadge.tsx`의 `AttendanceState`와 정확히 일치(색상
    토큰도 `--color-status-work/outside/leave/absent` 그대로) — 컴포넌트 자체는
    안 건드림. DB `attendance_records.status`(present/remote/absent/on_leave)를
    그대로 1:1 매핑(present→근무중, remote→외출중, on_leave→휴가중, absent→미출근)
    했고, **오늘 attendance_records row 자체가 없는 직원(아직 아무 버튼도 안 누름)도
    미출근으로 취급** — A07/A08과 같은 DB 상태값 기준을 그대로 쓰되, "기록 없음"의
    처리만 대시보드에서 새로 정의(기존 두 화면엔 없던 케이스라 신규 판단
    필요했음).
  - **"외출/외근" 컬럼**: Figma 실측 결과 컴포넌트 variant가 아니라 각 예시 행마다
    값이 들쭉날쭉(근무중 행은 "-", 외출중/휴가중 행은 둘 다 "외출중"으로 표기,
    미출근 행은 "-")해서 컴포넌트 재사용이 아니라 단순 mock 데이터 불일치로 판단—
    실제로는 `state === "외출중" ? "외출중" : "-"`로 상태 배지와 같은 문구를
    중복 표기하는 것으로 정리(Figma가 실제로 그렇게 하고 있었음).
  - **"52h 초과" 배너**: Figma에 별도 variant 컴포넌트가 없음(get_design_context로
    확인 — notice 박스가 재사용 컴포넌트가 아니라 텍스트만 있는 단일 정적 프레임)
    → 스타일 변경 없이 문구만 카운트에 따라 동적으로 바뀌도록 구현
    (`이번 주 52h 초과 직원 없음` / `이번 주 52h 초과 직원 N명`).
  - **주간근무시간 집계**: A07(`listMonthlyAttendance`)·S13/S14
    (`employeeAttendanceStats.ts`)에 이미 있는 로직(Monday~Sunday 범위로 인접
    달까지 넉넉히 조회 후 `hoursBetween` 합산)과 완전히 동일한 공식을 새로
    작성(모듈이 전부 per-employeeId 단일 조회 설계라 "활성 직원 전원 이번 주"용은
    재사용이 안 돼서 신규 구현했지만, 이 프로젝트가 기존에 각 파일마다 동일 로직을
    따로 갖고 있던 관례를 그대로 따름 — 공유 유틸로 뽑아내는 리팩터링은 이번
    범위 밖).
  - **로딩/에러**: 이 프로젝트 Next.js 버전 문서 먼저 확인(AGENTS.md 지시대로,
    `node_modules/next/dist/docs/.../10-error-handling.md`) — **`error.tsx`의
    재시도 콜백 prop 이름이 표준 문서의 `reset`이 아니라 `unstable_retry`로
    바뀐 버전**이라는 걸 미리 확인 안 했으면 틀리게 구현할 뻔함. `loading.tsx`
    (Suspense 기반 스켈레톤, PageHeader는 그대로 즉시 노출)와 `error.tsx`
    (`unstable_retry` 콜백 + "다시 시도" 버튼) 신규 추가 — 이 프로젝트에서 첫
    번째 loading/error 파일(다른 관리자 화면엔 아직 없음, A01만 이번에 요청받음).
  - **라이브 검증 중 발견한 스켈레톤 시각 버그**: 최초 구현에서 스켈레톤 블록
    색을 `bg-page`로 썼는데, 페이지 배경 자체도 `bg-page`라 테두리 없는 블록
    (배너/테이블)이 화면에 안 보이는 버그를 스크린샷으로 발견 → `bg-divider`로
    수정 후 5카드+배너+날짜라벨+테이블(헤더+4행) 전부 시각적으로 보이는 것 재확인.
  - **실시간 반영 라이브 검증**: 임시 관리자 테스트 계정으로 대시보드 baseline
    확인(전체 2명 — 이동석/하이브리드테스트) → 영구 테스트 계정 "하이브리드테스트"로
    실제 GPS 좌표(company_settings에 저장된 CD의 실제 사무실 좌표, 이번에 변경
    안 하고 그대로 읽기만 함) 기준 외출하기→복귀하기→퇴근하기 실행 → **매 단계
    직후 대시보드 카드/행이 실시간으로 정확히 반영**(외출 클릭 즉시 출근중
    2명→1명, 외출/외근 0명→1명; 퇴근 후 checkOut 시각·weeklyHours 갱신, 상태는
    remote 고정 규칙대로 "외출중" 유지) 확인. **A07/A08과 교차검증**: 같은
    직원·같은 날짜에 대해 A08 "비고"가 "외출/외근"(NOTE_FALLBACK.remote와 일치,
    A01의 "외출중"과 같은 DB status에서 파생돼 표현만 다름 — 모순 아님)로 정확히
    일치, **주간근무시간이 A01/A07/A08 세 화면 전부 "6h"로 문자 그대로 일치**
    확인. 이 과정에서 A07의 "상태" 컬럼("정상"/"검토필요")이 present/remote와
    무관하게 검토대기 여부만 나타낸다는 걸 재확인(처음엔 다른 값으로 보여서
    불일치로 오인했다가, A07 코드 재확인으로 실제로는 서로 다른 정보를 나타내는
    컬럼이라 모순이 아님을 확인 — 착오였음).
  - **정리**: 테스트 관리자 계정 삭제 및 재조회 확인. "이동석" `updated_at` 불변
    재확인(내 세션에서 조작 없음, 이동석 본인의 실제 사용 활동이 대시보드에
    자연스럽게 반영되는 것만 관찰). `company_settings` GPS 값도 읽기만 하고
    변경 없음 재확인. `tsc`/`eslint`/`next build` 클린, 프로덕션 배포 완료.
- **A06 토스트 적용 + 전역 토스트 스택 구조 설계: 완료(2026-07-22).** 지금까지
  각 화면(A04/A08/A09~A11/A12)이 자기 위치에 로컬 `<Toast>` 하나씩만 직접
  렌더링하던 구조(A11 파일럿 때 기록해둔 "폼 2개를 2.5초 안에 연달아 저장하면
  토스트가 겹친다"는 기존 한계)를 배열 기반 전역 스택으로 승격.
  - **`src/components/admin/ToastProvider.tsx` 신규**: `ToastContext` +
    `useToast()` 훅(`showToast(message)`만 노출) + 내부 `toasts: {id, message}[]`
    state. 각 토스트는 `crypto.randomUUID()`로 고유 id를 받고, `ToastItem`
    컴포넌트가 각자 독립적인 `setTimeout(2500ms)`으로 스스로를 배열에서 제거한다
    (다른 토스트의 타이머와 무관 — 하나가 새로 추가돼도 기존 것들의 타이머는
    안 건드림). **새 토스트는 배열 맨 앞에 추가**(newest-on-top) — top-right
    앵커라 새 토스트가 모서리에 더 가까운 상단에 나타나고 기존 토스트들이
    아래로 밀려나는 쪽이 "지금 막 도착했다"는 감각과 더 맞다고 판단해서 이렇게
    정함(반대 방향도 가능했지만, 구현하면서 이 쪽으로 확정). 기존 단일
    `Toast.tsx`는 삭제.
  - **마운트 위치**: `src/app/(admin)/layout.tsx`(관리자 전체 공용, `/login`
    등 인증 화면은 별도 트리라 영향 없음) 최상단에서 `<ToastProvider>`로
    감싸서, A01~A12 전체가 스택 하나를 공유. 화면별 컴포넌트는 더 이상 자기
    위치에 토스트를 렌더링하지 않고 `useToast().showToast(message)`만 호출.
  - **기존 4개 소비처(A04/A08/A09~A11/A12) 전부 이 구조로 마이그레이션**:
    로컬 `useSuccessToast`(dismissedState 참조비교 트릭) + `<Toast>` 렌더링을
    걷어내고, `useEffect(() => { if (state.success) showToast(...) }, [state,
    showToast])`로 대체 — `useActionState`의 state가 제출마다 새 레퍼런스를
    갖는다는 특성 덕분에 이 effect가 실제 새 제출 결과에서만 실행되고
    초기 마운트(빈 INITIAL_STATE)에는 안전하게 무해하다. dismissedState
    트릭이 통째로 불필요해짐(전역 스택이 각 토스트의 생명주기를 알아서
    관리하므로 로컬에서 show/dismiss를 더 이상 안 맞춰도 됨) — 세 화면
    분량의 중복 보일러플레이트가 사라진 부수 효과.
  - **A06(휴가승인)**: `approveLeaveRequest`/`rejectLeaveRequest`를
    `useActionState` 시그니처로 전환(RPC 자체 로직은 기존 검증된 것 그대로,
    검증/에러 반환 방식만 throw→`{error}`로 변경). **A08과 동일한 이유로
    신규 `LeaveRequestsTable.tsx` 클라이언트 컴포넌트를 만들어 두 훅
    (승인/반려) 전부 테이블을 감싸는 이 컴포넌트 레벨에 둠** — 행마다 뒀으면
    처리된 행이 "대기중" 버튼에서 "승인완료"/"반려완료" 텍스트로 바뀌며
    그 행 컴포넌트가 unmount, 토스트 트리거도 같이 사라지는 A08 버그가
    똑같이 재발했을 것. `recordId` 대신 `requestId`를 hidden input(FormData)
    으로 넘기는 것도 동일 패턴.
  - **라이브 검증(로컬, 임시 관리자 테스트 계정)**: **A06 스택 검증** —
    완전히 새로운 합성 테스트 직원에 pending 휴가 신청 3건을 만들어 각
    행을 정확히 타겟팅해서(요청ID 기반 selector, `.first`류 애매한 셀렉터는
    첫 시도에서 행 정렬 순서 오판으로 잘못된 행을 클릭하는 시행착오를 겪은
    뒤 수정) 0.4초 간격으로 승인→반려→승인 연속 처리 → **토스트 3개가
    동시에 화면에 떠서 y좌표 20/98/176으로 정확히 안 겹치고 쌓이는 것과
    문구가 각각 "승인했습니다"/"반려했습니다"/"승인했습니다"로 정확히
    매칭되는 것을 스크린샷으로 확인**, 이후 개별 타이머대로 전부 사라지는
    것까지 확인(폴링으로 3→3→...→0 전환 시점 확인). **기존 적용 화면
    회귀 확인**(전역 훅 구조가 바뀌었으므로 필수) — A04(하이브리드테스트
    재제출)/A08(신규 합성 데이터로 확인완료)/A09·A11(근무설정 3탭 중
    기본근무/휴가정책 재제출)/A10(인증설정 탭 GPS 재제출)/A12(공휴일갱신,
    ~13초 소요) 전부 단일 토스트가 정상적으로 뜨고 2.5초 후 사라지는 것
    개별 확인 — 스택 구조 전환 후에도 회귀 없음. 테스트 데이터
    (A06/A08용 employees+leave_requests+attendance_records+attendance_events,
    임시 관리자 계정) 전부 삭제 및 재조회 확인, "하이브리드테스트"
    auth_method 불변·"이동석" `updated_at` 불변 재확인. `tsc`/`eslint`/
    `next build` 클린, 프로덕션 배포 완료.
- **A12 공휴일 갱신 — 로딩 상태 + 중복 방어(락): 완료(2026-07-22).** 바로 위 토스트
  2단계 확산에서 A12가 외부 API 특성상 ~45초 걸린다는 게 드러난 뒤 이어서 진행.
  - **프론트**: `useActionState`의 3번째 반환값 `isPending`으로 버튼을
    `disabled` 처리 + 라벨을 "갱신 중..."으로 교체 + 인라인 스피너(`animate-spin`
    + `border-t-transparent` 트릭, 별도 아이콘 없이 CSS만으로 구현) 추가.
    소요시간 안내 문구("※ 외부 API 특성상 갱신에 최대 1분 정도 소요될 수
    있습니다")는 클릭 전에도 미리 알 수 있도록 버튼 아래 상시 노출(펜딩 중에만
    뜨는 게 아님 — 의도적 선택).
  - **백엔드 — 중복 요청 방어(락) 점검 결과**: 기존엔 락이 전혀 없었음(직접 확인).
    이 프로젝트는 DB 커넥션이 없는 REST-only 구조(AGENTS.md/과거 세션 기록 재확인)라
    Postgres advisory lock은 애초에 쓸 수 없어서(세션이 요청마다 새로 열리는
    PostgREST라 advisory lock이 요청 간에 유지 안 됨), `company_settings`
    (단일 행 설정 테이블)에 `holiday_sync_started_at timestamptz` 컬럼을 추가해
    타임스탬프 기반 락으로 구현 — 마이그레이션
    `20260722000000_holiday_sync_lock.sql`(CD가 Supabase 대시보드 SQL Editor에서
    직접 실행). **"확인 후 획득"을 조건부 UPDATE 하나(`.update().eq("id",1)
    .or("...is.null,...lt.staleBefore")`)로 원자적으로 처리** — SELECT 후 별도
    UPDATE로 나누면 그 사이 경쟁(TOCTOU)이 생겨 두 요청이 동시에 통과할 수 있어서,
    반드시 한 번의 조건부 UPDATE로 묶었다. UPDATE가 실제로 행을 갱신했는지
    (`.select("id")`로 반환된 행 수)로 락 획득 성공 여부를 판별. stale 기준은
    3분(정상 소요 ~45초보다 넉넉한 여유 — 크래시로 락이 안 풀린 경우에만 다음
    요청이 강제 재획득). 성공/실패 어느 쪽이든 `finally`에서 반드시 락 해제.
  - **라이브 검증(로컬, 임시 관리자 테스트 계정, 브라우저 컨텍스트 2개로 동시
    세션 시뮬레이션)**: 세션A가 클릭 → 300ms 뒤 "갱신 중..." 텍스트+스피너+
    소요시간 안내 문구 노출 확인 → pending 중 세션A 자신이 같은 버튼 재클릭
    시도 시 Playwright가 타임아웃(=실제로 클릭 불가, disabled 정상 동작) →
    **세션A가 처리 중인 동안(45초~90초 창 내) 완전히 별도의 세션B가 같은
    페이지에서 갱신 버튼을 클릭 → 외부 API 호출 없이 즉시 "공휴일 데이터
    갱신이 이미 진행 중입니다. 잠시 후 다시 시도해주세요." 에러로 거부되는 것
    스크린샷 포함 확인**(서버단 락이 실제로 동작한다는 증거 — 프론트 disable은
    같은 탭 안에서만 막고, 이건 별도 세션의 진짜 중복요청을 막는 것). 세션A는
    이후 89.6초 시점에 정상적으로 "공휴일 데이터가 갱신되었습니다." 토스트로
    완료, DB `holiday_sync_started_at`이 `null`로 정확히 복원된 것까지 확인.
    테스트 관리자 계정 삭제 및 재조회 확인, "이동석" 미접촉 재확인.
    `tsc`/`eslint`/`next build` 클린, 프로덕션 배포 완료.
- **토스트 컴포넌트 2단계 확산(A04 인증방식저장/A08 확인완료/A12 공휴일갱신):
  완료(2026-07-22).** A11 파일럿과 동일 패턴(`useActionState` + `{error?, success?}`
  반환, 에러는 기존 `role="alert"` 인라인 유지, 성공 시 `<Toast>`)을 세 액션에 적용.
  - **A04**: `updateEmployeeAuthMethod`를 plain FormData 액션 → `useActionState`
    시그니처로 전환(기존 `redirect(`/employees/${id}`)`는 같은 경로로의 자기
    리다이렉트였을 뿐이라 `revalidatePath`만으로 대체 가능했음). 폼 전체를
    새 클라이언트 컴포넌트 `EmployeeDetailForm.tsx`로 분리(기존엔 서버 컴포넌트
    page.tsx 안에 plain `<form>`으로 직접 있었음 — `useActionState`는 클라이언트
    훅이라 분리 필수). "비밀번호 초기화 메일 발송"(`sendPasswordResetEmail`)은
    지시 범위 밖이라 그대로 plain 액션 유지.
  - **A08**: 처음엔 A04/A12와 동일하게 행마다 `.bind(recordId, employeeId)`로
    고정한 `useActionState`를 행별 컴포넌트(`ConfirmReviewButton.tsx`)에 뒀는데,
    **라이브 테스트에서 실제 버그 발견** — 확인완료 성공 시 그 행이 "검토필요"
    배지+버튼에서 "정상" 텍스트로 바뀌면서 버튼을 렌더링하던 행별 컴포넌트
    자체가 트리에서 unmount되고, 그 안에 있던 토스트도 같이 사라짐(Playwright로
    실측: 클릭 직후 `role="status"`가 전혀 안 잡힘, 그런데 DB는 정상 확정 처리됨
    — 기능은 되는데 토스트만 안 뜨는 상태였음). **재설계**: `useActionState`
    훅을 테이블 전체를 감싸는 컴포넌트(`AttendanceReviewTable.tsx`, 신규) 하나로
    끌어올리고, `confirmAttendanceReview`도 bind 인자 대신 `recordId`/`employeeId`를
    hidden input(FormData)으로 받도록 변경 — 모든 행의 form이 같은 `formAction`
    dispatcher를 공유하므로, 개별 행 마크업이 바뀌어도 그 훅을 소유한 상위
    컴포넌트는 unmount되지 않아 토스트가 살아남는다. 에러 표시도 행별이 아니라
    테이블 하단 1곳으로 통합됨(설계 변경에 따른 트레이드오프). 기존
    `ConfirmReviewButton.tsx`는 삭제.
  - **A12**: `refreshHolidays`를 동일 패턴으로 전환. **라이브 검증 중 발견**:
    이 액션은 공공데이터포털 API를 12개월치 순차 호출(레이트리밋 회피 목적,
    기존 코드 설계)해서 실제로 약 45초가 걸림 — 처음엔 토스트가 아예 안 뜨는
    버그로 오인했다가, 대기 시간을 90초까지 늘려 재확인한 결과 45.3초 시점에
    정상적으로 토스트가 뜨는 것을 확인함(버그 아니라 기존 외부 API 특성).
  - **라이브 검증(로컬, 임시 관리자 테스트 계정)**: A04는 영구 테스트 계정
    "하이브리드테스트"의 인증방식을 기존 값 그대로 재제출(멱등, 실제 변경 없음)
    해서 "인증 방식이 저장되었습니다." 토스트 확인. A08은 완전히 새로운 합성
    테스트 직원 + 임시 pending_review 이벤트를 만들어 확인완료 클릭 → "검토가
    확정되었습니다." 토스트 확인 + 검토필요 배지 0건으로 정상 전환 확인. A12는
    위 45초 대기 후 "공휴일 데이터가 갱신되었습니다." 토스트 확인. 테스트 데이터
    (A08용 employees/attendance_records/attendance_events, 임시 관리자 계정)
    전부 삭제 및 재조회로 확인, "하이브리드테스트"의 auth_method가 여전히
    "hybrid"로 안 바뀐 것과 "이동석" 레코드 `updated_at` 불변까지 재확인.
    `tsc`/`eslint`/`next build` 클린, 프로덕션 배포 완료.
- **브레드크럼 링크화 1단계 확산(A01/A02/A04/A06/A09~A12): 완료(2026-07-22).**
  A07/A08에서 만들어둔 `PageHeader`의 `BreadcrumbSegment = string | {label, href}`
  인프라를 나머지 7개 관리자 화면에 실제로 켬. **"URL 쿼리 파라미터로 필터 상태
  유지"(buildAttendanceListUrl 패턴) 부분은 이번 7개 화면엔 적용 대상이 없었음**
  — 착수 전 각 화면을 확인한 결과: A02(직원목록)의 `SearchInput`은 `onChange`/
  `value` 자체가 없는 순수 장식용 컴포넌트라 필터링 기능 자체가 없음(grep으로
  재확인), A06(휴가승인)은 `status`/`year` 쿼리 파라미터가 있지만 A07↔A08 같은
  드릴인 자식 페이지가 없어(행에 `rowHref` 없음) 브레드크럼으로 되돌아올 지점
  자체가 없음, A09~A11(근무설정 3탭)의 탭 상태는 URL이 아니라
  `WorkSettingsTabs.tsx`의 로컬 `useState`라 애초에 보존할 URL 상태가 없음.
  그래서 실제 변경은 "Dashboard"(전 화면 공통)와 A04의 "직원관리"를 각각
  `/dashboard`, `/employees` 정적 링크로 바꾸는 것뿐이었음(필터 파라미터 없이).
  A01(대시보드)은 유일한 브레드크럼 항목이자 곧 마지막 항목이라 `PageHeader`의
  "마지막 항목은 항상 비활성" 규칙에 따라 객체로 바꿔도 시각적으로는 아무 변화
  없음 — 그래도 인터페이스 일관성을 위해 형식은 맞춰둠.
  라이브 검증(로컬, 임시 관리자 테스트 계정): 6개 화면(A01/A02/A04/A06/
  A09-11/A12) 전부 "Dashboard" 링크 href 실측 확인, A04는 "Dashboard"+"직원관리"
  둘 다 링크로 뜨는 것과 "직원관리" 실제 클릭 시 `/employees`로 정확히 이동하는
  것까지 확인(대상 직원은 영구 테스트 계정 "하이브리드테스트" 사용 — "이동석"
  레코드는 목록 조회에만 포함되고 직접 열람/수정 없음). 테스트 관리자 계정 삭제,
  재조회로 삭제 확인. `tsc`/`eslint`/`next build` 클린, 프로덕션 배포 완료.
- **CD 실사용 중 "등록된 사내 IP에서만 처리할 수 있습니다" 1회성 오류: 진단 완료,
  코드 버그 아님(2026-07-22).** CD가 사내 wifi 접속 후 본인 계정("이동석",
  `blackds@by-bk.com`, `auth_method='ip_only'`)으로 "출근하기" 클릭 시 IP 인증
  실패 보고. `checkIp()`(attendanceAuth.ts)에 `[ip-debug]` 임시 로깅 추가 →
  프로덕션 배포 → CD가 재시도 → Vercel 로그로 확인한 결과 **캡처된 IP가
  `125.131.67.104`로 `ip_whitelist`의 기존 등록값(2026-07-20 임시등록분)과 정확히
  일치, 재시도는 정상 성공**. 화이트리스트 자체엔 문제 없음이 확인됨 — 최초 실패는
  기기가 사내 wifi로 완전히 전환되기 전(예: 셀룰러 데이터 상태에서 클릭)이었을
  가능성이 높음(단, 로그로 그 최초 실패 시점의 IP 자체는 캡처 못 했어서 확정은 아님,
  추정). 진단용 로깅은 확인 후 즉시 제거하고 재배포 완료(grep 잔존 0건 재확인).
  **재발하면 이번처럼 임시 로깅으로 즉시 재진단 가능** — `ip_whitelist`의 등록값
  자체는 여전히 2026-07-20에 남긴 "운영정책 확정 전까지 재검토 필요" 각주가
  유효하니 참고.
- **`/m` 전용 touch-action 핀치줌 잠금 보강: 완료(2026-07-22).** 바로 위 title/viewport
  분리 작업(`userScalable:false`)의 CSS 레벨 보강 — 일부 브라우저는 viewport meta의
  `user-scalable=no`를 완전히 존중하지 않는 경우가 있어, `touch-action: pan-x pan-y`로
  핀치줌 제스처 자체를 한 번 더 막음. **적용 범위를 관리자와 분리할지 사용자 확인
  받음**(관리자 화면도 `MobileGnb`로 터치 디바이스에서 쓰일 수 있고, 바로 전 작업에서
  "관리자는 확대 유지"로 명시적으로 갈랐던 결정과의 일관성 문제) — `/m`만 적용하는
  쪽으로 확정. `html, body` 전역 선택자로는 라우트별 스코프가 안 되므로(단일 문서,
  admin/mobile이 layout 하나를 공유), `body.mobile-touch-lock` 클래스를 CSS 조건부로
  걸고 `src/components/mobile/TouchActionLock.tsx`(신규, `"use client"`, `useEffect`로
  마운트 시 클래스 추가/언마운트 시 제거)를 `src/app/m/layout.tsx`에서만 렌더링하는
  방식으로 구현 — layout 자체는 여전히 실제 DOM 래퍼를 추가하지 않는다는 기존 원칙
  유지(`TouchActionLock`은 `null` 렌더). 라이브 검증(Playwright, 로컬+프로덕션 둘 다):
  `/m/login`에서 `computed touch-action: pan-x pan-y` 확인, `/login`(관리자)에서는
  클래스 없음+`touch-action: auto` 확인, `/m` 내부 이동(`/m/register-password`) 시
  클래스 유지 확인, `/m`에서 `/login`으로 이동 시 클래스가 정확히 제거되는 것까지
  (언마운트 cleanup 실증) 4가지 시나리오 전부 통과. `tsc`/`eslint`/`next build` 클린,
  프로덕션 배포 완료.
- **`/m` 전용 layout.tsx 신규 + title/viewport 분리: 완료(2026-07-22).** layout 구조
  조사(관리자 `(admin)/layout.tsx` vs 사용자 `/m` 밑에 layout.tsx 자체가 없어서
  루트 layout 하나만 상속) 과정에서 발견한 버그 — 루트 `metadata.title`이
  "byWORK 관리자"로 고정돼 있어서 `/m/*` 전체 브라우저 탭 제목도 "byWORK 관리자"로
  뜨고 있었음. 이번에 CD가 직접 준 코드로 수정.
  - **Next.js 메타데이터 병합 규칙 먼저 문서로 확인**(AGENTS.md 지시대로,
    `node_modules/next/dist/docs/.../generate-metadata.md:1326`): "여러 세그먼트의
    metadata/viewport 객체는 얕게 병합되고, 중복 키는 더 구체적인 세그먼트 값으로
    교체된다" — 이 규칙에 따라 `/m` 세그먼트에만 title/viewport를 덮어쓰면 그 값만
    바뀌고 나머지(관리자 등)는 루트 값을 그대로 상속한다는 걸 확인 후 진행.
  - `src/app/layout.tsx`(루트, 전체 공용)에 `viewport`(width=device-width,
    initialScale=1, 확대축소 제한 없음) 신규 추가 — 관리자(데스크톱)는 기존대로
    일반 핀치줌 허용.
  - `src/app/m/layout.tsx` 신규(지금까지 `/m` 밑에 layout.tsx가 아예 없었음) —
    `metadata.title`을 "byWORK"로 재정의(설명은 루트 값 그대로 상속), `viewport`에
    `maximumScale: 1, userScalable: false` 추가해서 네이티브 앱처럼 핀치줌을
    막는다(관리자와 다르게). 컴포넌트 자체는 `return children`만 — `/m` 밑에는
    공용 chrome(하단 네비 등)이 원래 없고 각 page.tsx가 전체 화면을 직접 그리는
    기존 구조를 그대로 유지, 이 파일은 순수하게 metadata/viewport 오버라이드
    목적으로만 존재.
  - **라이브 검증**: `curl`로 `<title>`/`<meta name="viewport">` 직접 확인 —
    `/m/login`: `<title>byWORK</title>` + `maximum-scale=1, user-scalable=no`,
    `/login`(관리자): `<title>byWORK 관리자</title>` + 확대축소 제한 없음,
    두 값 다 정확히 분리 확인. `/m/register-password`(다른 `/m` 하위 페이지)에도
    동일하게 적용되는 것 확인해서 `/m` 전체에 일관 적용됨을 재확인. 프로덕션
    배포 후 동일하게 재확인.
  - `tsc`/`eslint`/`next build` 클린.

- **성공 Toast 컴포넌트 신규 도입 + A11(근무설정) 파일럿: 완료(2026-07-22).**
  A01~A15 저장/성공 피드백 방식을 조사한 결과 공용 토스트/스낵바가 전혀 없었고
  (grep "저장되었습니다"/toast 0건), 화면마다 리다이렉트(A03/A05)/쿼리 메시지
  (A12 비밀번호변경)/완전 침묵(A04/A06/A08/A11/A12 대부분) 세 가지가 혼재했던
  것을 CD에게 먼저 보고 → 이번 요청으로 A11을 파일럿 화면으로 지정받아 진행.
  - **`src/components/admin/Toast.tsx` 신규**: `<Toast message="..." onDismiss={...} />`
    — 우측 상단 고정(`fixed top-[20px] right-[20px]`), 2.5초 후 `setTimeout`으로
    자동 `onDismiss` 호출, `role="status"`(에러의 기존 `role="alert"`와 구분).
    success 전용이라 variant prop은 아직 안 둠(필요해지면 그때 추가 — YAGNI).
    아이콘은 새로 안 만들고 기존 `ModalScreen.tsx`의 `ModalSuccessIcon`(초록
    체크, TerminateButton 재입사확인 다이얼로그에서 이미 쓰던 것) 재사용.
  - `globals.css`에 `.toast-enter`(페이드+슬라이드 200ms) 유틸 추가, `.stagger-item`과
    같은 `prefers-reduced-motion: reduce` 미디어쿼리에 묶어서 반응.
  - **`settings/work/actions.ts`의 3개 저장 액션을 `useActionState` 시그니처로 전환**
    (`saveScheduleSettings`/`saveLeavePolicySettings`/`saveGpsSettings`) — 기존
    plain `FormData` 액션 + `throw new Error(...)` 검증 방식에서, `AdminPasswordForm`
    (A12)이 이미 쓰던 `{ error }` 반환 패턴으로 통일하고 성공 시 `{ success: true }`
    추가. `addIpEntry`/`deleteIpEntry`는 이번 "3탭" 범위에 안 넣음(IP 목록이 그
    자리에서 즉시 늘어나거나 사라지는 것 자체가 이미 충분한 시각적 피드백이라
    판단, 필요하면 별도 확인 후 추가).
  - **`WorkSettingsTabs.tsx`**: 3개 폼 각각 `useActionState` 훅으로 연결, 에러는
    기존 위치 그대로 `role="alert"` 인라인 유지, 성공하면 `Toast` 렌더링.
    `useSuccessToast(state)` 작은 훅 신규 — `useActionState`의 state가 제출마다
    새 객체 레퍼런스를 갖는다는 특성(참조 비교로 재노출 판단)을 그대로 재사용
    했는데, 이건 `NewEmployeeForm.tsx`(A03)의 `dismissedState` 패턴을 그대로
    가져온 것 — 같은 값으로 다시 저장해도 토스트가 매번 새로 뜬다.
  - **라이브 검증**: 임시 관리자 테스트 계정으로 기본근무/휴가정책/GPS 3탭
    전부 "기존 값 그대로 재제출"(멱등 — 실제 설정 안 바뀜) 방식으로 성공 토스트
    노출 확인(문구 3종 각각 정확), `position:fixed / top:20px / right:20px` 실측
    확인, 첫 토스트가 2.5초 후 실제로 사라지는 것 확인. 에러 경로는 기본근무
    탭 시작/종료시간을 비워서 유도 — `role="alert"` 문구("시작/종료 시간을 모두
    입력해주세요.") 그대로 뜨고 토스트는 안 뜨는 것 확인.
  - **테스트 중 실제 운영 데이터 발견**: `company_settings`에 GPS 좌표가 이미
    실값(37.5133790, 127.0214788, 반경 30m)으로 설정돼 있었음(이전 세션들에서
    계속 null이던 것과 다름 — CD가 별도로 채워둔 것으로 보임, updated_at도
    테스트 직전 최근 시각). 원본값 백업 후 정확히 같은 값으로만 재제출해서
    실제 설정 변경 없이 성공 경로만 검증, 사후 `updated_at`만 바뀌고 값 자체는
    동일함 재확인.
  - **부수 발견(버그 아님, 참고용 기록)**: 라이브 검증 중 두 번째 폼(휴가정책)의
    토스트가 2.5초 안 지나서 사라지기 전에 세 번째 폼(GPS)을 연달아 저장하니
    토스트 2개가 같은 위치(우측 상단)에 겹쳐서 동시에 뜨는 것을 확인함 — 스택/큐잉
    로직이 없어서다. 실사용에서는 관리자가 한 폼 저장하고 2.5초 안에 다른 폼을
    또 저장하는 경우가 드물어 이번엔 손대지 않았지만, 여러 폼이 같은 화면에
    나란히 있는 화면(A11처럼)으로 확산할 땐 재검토가 필요할 수 있음.
  - 테스트 관리자 계정 삭제, 재조회로 삭제 확인. "이동석" 미접촉 재확인.
    `tsc`/`eslint`/`next build` 클린, 프로덕션 배포 완료.
  - **다음 확산 후보(미착수)**: A04(직원 인증방식 저장)/A06(휴가 승인·반려)/
    A08(확인완료)/A12(공휴일 갱신) — 전부 `message` prop만 바꿔서 그대로
    재사용 가능한 상태.

- **A07/A08 브레드크럼 뎁스 링크 + A08 "목록" 버튼(Figma 신규 반영): 완료(2026-07-21).**
  필터(검토필요/전체직원) 상태가 관리자가 명시적으로 바꾸지 않는 한 A07↔A08을
  오가도 유지되도록, 세션/로컬스토리지가 아니라 URL 쿼리 파라미터로만 처리.
  - **`PageHeader`(공용 컴포넌트, A01~A15 전체 9개 화면이 재사용) 확장**:
    `breadcrumb` prop을 `(string | { label; href })[]`로 확장 — 문자열이면 기존처럼
    클릭 불가, 객체면 링크. **하위호환 유지**: 이번엔 A07/A08 두 화면만 실제로
    객체를 넘기도록 고쳤고, 나머지 7개 화면(A01/A02/A04/A06/A09~A12)은 여전히
    문자열만 넘겨서 그대로 비활성 — 컴포넌트 인프라는 전체에 적용됐지만 "자동
    확산"은 아니고 각 화면 breadcrumb 배열을 개별적으로 바꿔야 링크가 켜짐(CD가
    이 구분을 명확히 물어봐서 인프라 vs 활성화를 분리해서 보고함, 다른 화면
    확산은 별도 확인 후 진행 예정).
  - **`src/lib/attendanceListUrl.ts` 신규**: `buildAttendanceListUrl(year, month,
    filter?)` — A07 자체의 rowHref, A08 브레드크럼의 "근태 데이터" 링크, A08
    "목록" 버튼 셋이 전부 이 함수 하나를 공유(지시대로 "같은 이동 로직 재사용").
  - A07: rowHref에 현재 filter를 실어서 A08로 넘김. A08: `searchParams.filter`를
    받아 `listUrl = buildAttendanceListUrl(year, month, filter)`로 계산해서
    브레드크럼 "근태 데이터"와 "목록" 버튼 둘 다 씀.
  - **"목록" 버튼**: Figma get_design_context 실측(border-muted, rounded-md,
    px-24/pt-13/pb-14, w-140px, text-body soft-gray) — 기존 `Button` 컴포넌트에
    끼워맞추면 `className` 오버라이드가 컴포넌트 내부 `py-*`와 특이성 충돌 위험이
    있어(순서 보장 안 됨), A07의 `FilterTabLink`와 같은 이유로 `Button`을 안 쓰고
    직접 `<Link>` 마크업으로 구현. Figma에 같이 있던 "취소" 버튼은 opacity-0(숨김
    처리)이라 미구현.
  - **라이브 검증(로컬)**: 완전히 새로운 합성 테스트 직원(검토필요 상태 유발용,
    pending_review 이벤트 1건)으로 6가지 시나리오 전부 확인 — 검토필요 필터 →
    A08 → 목록 버튼 → 필터 유지, 같은 시나리오 브레드크럼 "근태 데이터" 클릭으로도
    유지, 전체직원 필터 상태에서도 유지, 필터 파라미터 자체 없이(기본 진입) 왕복해도
    정상, Dashboard 링크(`href="/dashboard"`) 정상 이동, A08 브레드크럼 마지막
    항목이 `<span>`(비활성, `<a>` 아님) 확인. 기존 기능(검토필요 배지, 확인완료
    버튼) 회귀 없음도 재확인. **셀렉터 관련 삽질**: 테스트 데이터의 manual_reason에
    우연히 "목록"이라는 단어가 들어가서 `text=목록` 셀렉터가 툴팁 텍스트와 충돌 —
    href 속성 기반 셀렉터(`a[href*="/attendance?year="]`)로 바꿔서 해결. 사이드바
    메뉴도 전부 `<Link>`라 브레드크럼과 텍스트가 겹칠 수 있다는 것도 이번에 확인.
  - 테스트 데이터 전부 삭제, "이동석" 미접촉 재확인. `tsc`/`eslint`/`next build`
    클린, 프로덕션 배포 완료.

- **IP/GPS 인증 실패 → 사유 입력 → 관리자 확인 흐름(M1, S04~S07, S13, A07, A08):
  완료(2026-07-20/21).** 5개 버튼(출근/외출/외근/복귀/퇴근) 전부 IP/GPS 인증 실패
  (manual_approval_required) 시 "관리자에게 문의하세요" 대신 사유 입력 시트(M1)로
  분기, 제출하면 "검토대기중" 상태로만 기록되고 근태상태 메인값/통계는 관리자가
  A08에서 확인완료 처리하기 전까지 변경되지 않는다.
  - **0단계 DB 스키마**(`supabase/migrations/20260721000000_attendance_manual_review.sql`,
    CD가 Supabase 대시보드 SQL Editor에서 직접 실행 — 이 프로젝트엔 DB 직접 연결
    수단이 없어서(CLI/connection string 전무, REST용 service_role 키만 있음) 매번
    이 방식이었던 것으로 보임): `attendance_events`에 `manual_reason text`,
    `review_status attendance_event_review_status(신규 enum: pending_review/confirmed)
    not null default 'confirmed'`, `reviewed_by uuid references admin_profiles(id)`,
    `reviewed_at timestamptz` 추가 + `check(check_in_method<>'manual' or manual_reason
    is not null)` 제약. **`check_in_method`엔 새 값을 안 넣음** — 이미 있던 `'manual'`
    값(2026-07-16 마이그레이션에서 "향후 관리자 수동승인 폴백용"으로 예약해뒀던 것,
    지금까지 미사용)을 그대로 씀. review_status를 check_in_method와 분리한 이유:
    "인증 수단"과 "승인 워크플로우 상태"는 다른 축이라 하나의 컬럼에 욱여넣으면
    나중에 "수단=manual AND 상태=pending" 조회가 지저분해짐. `attendance_records_
    with_times` VIEW도 재정의해서 두 서브쿼리에 `review_status='confirmed'` 필터
    추가(검토대기 이벤트 시각이 A07/A08/통계에 확정된 것처럼 새어나가지 않도록 —
    이 한 곳에서 처리해서 개별 쿼리마다 필터 중복 불필요). `review_status` partial
    index 추가(A07 카운트/필터, A08 목록이 자주 탈 조건).
  - **1단계 — getTodayAttendanceState/순서검증 리팩토링**: `lastEventType`/순서검증
    (`NEXT_ALLOWED`)이 confirmed 이벤트만 보도록 수정 — 검토대기중 제출이 있어도
    그 전 확정 상태를 그대로 유지해서 "확정 전까지 직원은 다른 버튼 계속 사용
    가능"이 성립하게 함. `recordAttendanceEvent`(기존)와 신규
    `submitManualAttendanceEvent`(M1 제출용, verifyAttendanceAuth 재검증 안 함 —
    이미 실패했다는 걸 알고 사용자가 명시적으로 우회하는 경로라서)가
    `getLastConfirmedEventType` 헬퍼를 공유. M1 제출은 `check_in_method='manual'`,
    `review_status='pending_review'`로만 기록, `attendance_records.status`는
    안 건드림.
  - **M1 컴포넌트**(`src/components/mobile/ManualReasonSheet.tsx` 신규): Figma
    get_design_context 실측 그대로 구현(위치핀 아이콘 accent 노랑 고정색, 2줄
    안내문, textarea placeholder 2줄, 필드/취소 버튼 기존 MobileButton
    filled-accent/outline-warm 재사용). 전체화면 오버레이라 A05(TerminateButton)와
    같은 이유로 `createPortal`로 `document.body`에 렌더링. `AttendanceButtons.tsx`의
    `AttendanceActionButton`/`AttendanceWorkingButtons` 둘 다 `manual_approval_
    required`일 때만(다른 실패 사유는 기존 인라인 에러 그대로) M1로 분기하도록 수정.
  - **S04~S07 "검토대기중 N건" 마킹**: `MobilePendingReviewBadge`(신규,
    `StatusBadge.tsx`) — 기존 상태뱃지 옆 gap-6px, count=0이면 렌더링 안 함(조건부
    마킹). **S03(출근전)은 지시 범위에 없어서 제외** — S04~S07(working/out/field/done)
    4개 상태에만 적용, 대신 방어적 폴백 분기도 S03과 같은 이유로 제외.
  - **S13 "검토대기중 N건 - 확정되면 통계에 반영됩니다" 배너**: `MobilePendingReviewBanner`
    (신규, MobilePendingReviewBadge와 색은 같지만 padding/폭이 달라 별도 컴포넌트 —
    Figma 개별 실측). `getMonthlyStats`에 `pendingReviewCount` 필드 추가(attendance_
    records→attendance_events 2단계 조회로 그 달에 걸린 pending_review 이벤트 수 카운트).
    **S14(연간)는 지시에 없어서 제외.**
  - **A07 "상태" 컬럼(6번째) + "검토필요(N)"/"전체직원" 필터탭**: `listMonthlyAttendance`
    가 각 행에 `hasPendingReview` 포함하도록 수정(필터링 자체는 page.tsx에서 처리,
    쿼리 재사용). 신규 `AttendanceReviewBadge`(rounded-20px/h-30px, "검토필요"=
    status-outside 재사용, "정상"=신규 `--color-status-normal`(#0dddb1, emeral-green
    Figma 실측 — mobile의 --mobile-color-mint와 같은 hex지만 admin 네임스페이스는
    분리 유지)). 필터탭은 기존 Button 컴포넌트에 없는 활성색(amber) 조합이라 새
    `FilterTabLink`로 직접 구현.
  - **A08 "비고" 컬럼 — 검토필요 배지+사유 호버 툴팁+확인완료 버튼**:
    `getEmployeeAttendanceDetail`에 `hasPendingReview`/`pendingReason`(여러 건이면
    줄바꿈으로 이어붙임) 추가. 호버 툴팁은 Figma 실측(검은 배경, state_지각 색
    텍스트)대로 순수 CSS `group`/`group-hover:opacity-100`으로 구현(JS 없이).
    "확인완료" 버튼은 A06 승인/거부와 동일하게 `Button` 컴포넌트 재사용하되
    Figma가 dark-gray 채움이라 `variant="primary"`(기존 outline 아님). 신규
    `confirmAttendanceReview(recordId, employeeId)` 서버 액션
    (`src/app/(admin)/attendance/actions.ts`) — recordId(그 날짜)에 속한
    pending_review 이벤트 **전부를 한 번에** confirmed 처리(개별 이벤트 단위 아님,
    Figma도 날짜 행 하나에 확인완료 버튼 하나). 확정된 이벤트에 외출/외근 시작이
    있으면 라이브 체크인 경로와 동일 규칙(`recordAttendanceEvent`)으로 status를
    remote로 갱신. **처리 순서는 강제 없음**(지시대로 — 관리자가 아무 날짜나 먼저
    처리 가능, 검증 로직 없음).
  - **라이브 검증(로컬)**: 완전히 새로운 합성 테스트 직원(`auth_method='manual_
    approval'` — `gps_only`로 먼저 시도했다가 `gps_out_of_range`가 떠서 M1이
    아니라 기존 인라인 에러가 뜨는 걸 먼저 확인함, "IP/GPS 둘 다 실패"만
    manual_approval_required가 되는 게 맞는 동작이라 인증방식을 바꿔서 재시도)로
    5개 버튼 전부 실패→M1→사유 미입력 얼럿("사유를 입력해주세요.")→사유 입력 후
    제출→검토중 기록 확인, 관리자 확인완료 후 실제 근태상태 확정(출근→근무중,
    외출→외출중, 복귀→근무중, 외근→외근중, 퇴근→퇴근완료) 전부 확인. **"검토중인
    동안 다른 버튼 사용 가능"**: 외출 검토중 상태에서 홈이 여전히 "근무중"으로
    유지되고 외근하기/퇴근하기 버튼이 정상 노출되는 것 확인(단, 외근중 상태에서
    바로 퇴근은 안 됨 — 이건 기존 NEXT_ALLOWED 상태머신이 원래 그렇게 설계돼 있어서,
    복귀 먼저 거쳐야 함, 이번 기능과 무관한 기존 동작). S13 배너는 임시 pending
    이벤트를 하나 더 심어서 실제 노출 확인 후 삭제. **회귀 확인**: "이동석"(기존
    실데이터 8건+CD의 실제 라이브 체크인)의 A07/A08이 VIEW 재정의 이후에도 정상
    표시(비고 컬럼 "정상"/"외출/외근"/"승인된 연차"/"-" 그대로), review_status를
    명시 안 한 insert가 기본값 confirmed로 들어가는 것도 재확인. 테스트 데이터
    전부 삭제, "이동석" 미접촉 재확인. `tsc`/`eslint`/`next build` 클린, 프로덕션
    배포 완료.
  - **부수 발견(제가 만든 변화 아님, 즉시 보고)**: 회귀 검증 중 영구 테스트 계정
    "모바일테스트"(`mobile-test-persist@by-bk.com`)가 `employment_status='terminated'`,
    `termination_date='2026-07-21'`로 바뀌어 있는 것을 발견함(`updated_at`도
    2026-07-21 05:02 — 이번 세션 작업 시간대와 겹침). confirmAttendanceReview
    등 이번에 작성한 코드 경로는 `employees.employment_status`를 전혀 건드리지
    않아서 제 코드로 인한 변화는 아님 — CD가 다른 곳에서(예: A05 퇴사처리 버튼
    라이브 확인 등) 이 계정을 직접 조작했을 가능성이 있어 보임. **임의로 되돌리지
    않고 그대로 둠** — CD 확인 필요.

- **Vercel 함수 리전 이전(iad1 → hnd1): 완료, 효과 실측 확인(2026-07-20/21).**
  waterfall 병렬화(1단계)에 이어 리전 이전(2단계)까지 완료 — Vercel Hobby 플랜도
  단일 리전 지정은 지원됨을 문서로 확인 후 진행([Configuring regions for Vercel
  Functions](https://vercel.com/docs/functions/configuring-functions/region)).
  - **1단계 — 배포 전 baseline**: Playwright의 `response.request.timing`(Chrome
    DevTools Network 탭과 동일한 소스의 실제 네트워크 타이밍 데이터, `responseStart`
    필드가 TTFB에 해당)으로 로그인된 `/m` 홈 화면 GET 요청 10회 샘플링.
    **iad1 baseline: avg 2419.2ms / median 2371.0ms / min 1670.6ms / max 3441.6ms**
    (`x-vercel-id`에 `icn1::iad1::...`로 함수 실행 리전 실측 확인).
  - **2단계**: `vercel.json` 신규 생성(`{"regions": ["hnd1"]}`) → `rm -rf .next &&
    next build` 클린 → 배포 → `vercel inspect`로 함수가 `[hnd1]`에서 빌드된 것,
    실제 인증된 요청의 `x-vercel-id`가 `icn1::hnd1::...`로 바뀐 것까지 확인.
  - **3단계 — 배포 후 전체 재확인**: 관리자/모바일 로그인 각 1회(임시 관리자
    테스트 계정 재사용) 정상, S13/S14 통계·S15 마이페이지 에러 없이 정상 렌더링.
    **휴가 신청→승인**: 모바일테스트 계정으로 1일 연차 신청 → 임시 관리자 계정으로
    승인 → `leave_requests.status='approved'`, `processed_by` 정확, `employees.
    used_leave_days` 1.0 반영까지 DB로 확인 후 정리(0으로 복원).
    **체크인(hybrid 폴백 경로)**: 신규 `auth_method='hybrid'` 테스트 직원으로 먼저
    일반 클릭 시도 → IP 1차 경로로 즉시 성공(이 세션 환경의 공인 IP가 CD 사무실
    IP `125.131.67.104`와 우연히 같아서 — Cloudflare 5xx 에러 페이지에서 그 사실이
    이미 노출된 적 있음). **GPS 폴백까지 실제로 타려면 그 화이트리스트 등록을
    일시 비활성화해야 해서, 사용자 승인 받고 진행**: `ip_whitelist` 해당 행
    일시 삭제 → `company_settings` GPS 임시 설정(서울시청, B-1/B-2 등 기존 세션과
    동일 좌표/패턴) → Playwright `geolocation` 컨텍스트 권한으로 같은 좌표 모킹 →
    체크인 클릭 → `attendance_events.check_in_method='gps'`로 실제 GPS 폴백 경로
    성공 확인 → 즉시 `ip_whitelist`(같은 id/내용으로 재등록)와 GPS(null) 원상복구,
    재조회로 원복 확인.
    **IP 화이트리스트 x-forwarded-for 코드 레벨 재확인**: Vercel 공식 문서
    ([Request headers](https://vercel.com/docs/headers/request-headers))에
    `x-forwarded-for`는 엣지 네트워크가 클라이언트의 실제 공인 IP로 채우는
    헤더로, 함수가 어느 리전에서 실행되는지와는 무관하다고 명시돼 있음(리전
    정보는 별도의 `x-vercel-id` 헤더가 담당) — 이 아키텍처적 분리를 문서로도
    확인했고, 위 hybrid 폴백 테스트에서 리전 변경 후에도 `ip` 컬럼에 동일한
    `125.131.67.104`가 기존과 같은 형식으로 정확히 기록된 것으로 실측 재확인함.
    **결론: IP 화이트리스트 로직은 리전 변경의 영향을 받지 않는다** — 다만 실제
    사무실 네트워크에서의 재현은 이전과 마찬가지로 CD가 직접 확인해야 함.
  - **4단계 — 재측정**: 같은 방식으로 10회 재샘플링.
    **hnd1 after: avg 597.6ms / median 579.0ms / min 495.3ms / max 741.4ms**.
    **개선폭: avg 기준 75.3% 감소(2419.2ms→597.6ms), median 기준 75.6% 감소
    (2371.0ms→579.0ms)** — waterfall 병렬화(1단계)만으로는 안 잡히던 리전
    자체의 왕복 지연이 지배적 원인이었음을 실측으로 확정.
  - **정리**: 테스트 관리자 계정, hybrid 테스트 직원, 임시 휴가 신청 전부 삭제
    및 재조회 확인. `ip_whitelist`/`company_settings` GPS 원상복구 확인.
    "이동석" 레코드 미접촉 재확인.
  - **문제 발생 시 롤백 방법(참고, 이번엔 미사용)**: `vercel.json`의 `regions`를
    `[]`로 바꾸거나 파일 자체를 삭제하고 재배포하면 Vercel 기본 리전(iad1)으로
    되돌아간다.

- **속도 저하 waterfall 진단 1단계(병렬화) 적용: 완료(2026-07-20).** 앞서 리전(iad1
  vs Supabase Tokyo)/waterfall 진단 리포트에서 제안한 수정안 중 waterfall 부분을
  실제로 적용. 리전 이전(`vercel.json` regions 지정)은 이번 범위에서 제외 — 별도
  결정 필요.
  - `src/app/m/page.tsx`: `getStandardStartTime()`이 `employee.id`에 의존하지
    않는데도 나중 `Promise.all` wave까지 밀려있던 것을, `getCurrentEmployee()`
    호출과 동시에 시작하도록 최상위로 끌어올림(promise를 미리 만들어두고 나중
    wave의 `Promise.all`에서 재사용).
  - `src/lib/employeeLeaveRequests.ts`의 `getLeaveBalance()`: 내부 `employees`/
    `leave_requests` 조회 2개가 서로 독립적인데 순차 await였던 것을 `Promise.all`로
    병렬화.
  - `src/app/(admin)/attendance/[id]/page.tsx`(A08): `getEmployee(id)`와
    `getEmployeeAttendanceDetail(id, year, month)`가 둘 다 route param만
    필요하고 서로 결과에 의존 안 하는데 순차 await였던 것을 `Promise.all`로
    병렬화(직원이 없는 경우 `getEmployeeAttendanceDetail`도 같이 실행되지만
    빈 배열만 반환하고 에러 없음 — `notFound()` 분기 전에 미리 실행돼도 무해).
  - **가장 큰 구조적 수정**: `src/lib/adminAccount.ts`의 `getCurrentAdmin()`과
    `src/lib/employeeAccount.ts`의 `getCurrentEmployee()`를 React `cache()`로
    래핑 — `assertAdminRequest()`가 관리자 쪽 거의 모든 lib 함수에서 개별
    호출되는 구조라, 캐싱 없이는 한 페이지에서 보호된 lib 함수를 2개 이상 부르면
    (A08처럼) "Auth `getUser()` 왕복 + `admin_profiles`/`employees` 조회"가
    매번 새로 실행되고 있었음. `node_modules/next/dist/docs/01-app/02-guides/
    caching-without-cache-components.md`의 "Deduplicating requests" 섹션에
    이 프로젝트 Next.js 버전이 공식 권장하는 정확히 이 패턴(non-fetch 데이터
    접근을 `cache()`로 감싸기)이 있어서 그대로 적용(AGENTS.md 지시대로 사전에
    문서 확인). `src/proxy.ts` 미들웨어의 `getUser()}`는 별개 요청 스코프라
    이 캐싱 대상이 아님 — 그대로 둠.
  - **라이브 검증(로컬)**: 기존 영구 모바일 테스트 계정("모바일테스트")으로
    S03 홈 재확인 — "09:00" 정규 출근 시간 정상 표시(병렬화된
    `standardStartTime`), S10 휴가현황 총부여15/사용0/잔여15 DB와 정확히 일치
    (병렬화된 `getLeaveBalance`). 임시 관리자 테스트 계정으로 A04/A08을
    **"이동석" 레코드로 읽기 전용 조회**(변경 없음, 조회 후 `updated_at`
    타임스탬프 불변 재확인)해서 병렬화된 A08이 실제 근태 데이터(총 근무일
    5일/36h/연차사용 1일/결근 1일, 날짜별 출퇴근 기록)를 정확히 표시하는 것
    확인. 테스트 관리자 계정 삭제, 재조회로 삭제 확인.
  - `rm -rf .next && next build` 클린(라우트 목록 정상), `npx tsc --noEmit`/
    `npx eslint` 클린. 프로덕션 배포 완료.
  - **남은 것**: 리전 이전(`vercel.json`에 `hnd1` 지정) — Vercel 플랜 제약
    재확인 필요, 아직 미착수. `getTodayAttendanceState()`의 `attendance_records`
    →`attendance_events` 2단계 조회를 nested select로 1쿼리화하는 선택적
    최적화도 미착수(진단 리포트에서 "선택 사항"으로 분류했던 항목).

- **파비콘 교체(Figma "파비콘512" 원본 → favicon.ico/icon.png/apple-icon.png/icon-512.png): 완료(2026-07-20).**
  Figma `Cb5ZQsPWOScDxrjw8eojvI` node `207:1802`("파비콘512", 512×512 프레임)에서
  `download_assets`로 원본 PNG를 받아 Pillow(Lanczos)로 리사이즈: `src/app/favicon.ico`
  (16×16+32×32 멀티사이즈 ico), `src/app/icon.png`(192×192), `src/app/apple-icon.png`
  (180×180), `public/icon-512.png`(512×512, PWA용 — 아직 manifest 파일 자체가
  프로젝트에 없어서(grep 0건) Next.js가 자동 링크하진 않음, 향후 manifest 작성 시 참조용으로만
  준비해둔 상태). `download_assets` 원본과 `get_screenshot` 렌더링을 Pillow
  `ImageChops.difference`로 픽셀 비교해 완전 동일(diff bbox: None) 확인. 이 프로젝트
  Next.js 버전(AGENTS.md 지시대로 `node_modules/next/dist/docs/.../app-icons.md` 확인)도
  표준 파일 컨벤션 그대로라 별도 대응 불필요. `next build` 결과 `/icon.png`,
  `/apple-icon.png`가 정적 라우트로 정상 생성됨을 확인, dev 서버 `<head>` 실측으로
  `<link rel="icon" href="/favicon.ico" sizes="32x32">`/`<link rel="icon"
  href="/icon.png" sizes="192x192">`/`<link rel="apple-touch-icon" href="/apple-icon.png"
  sizes="180x180">` 자동 생성 확인. 실제 서빙 파일도 `file` 커맨드로 픽셀 사이즈 재확인
  (16×16+32×32 ico / 192×192 / 180×180). 프로덕션 배포 후 `bywork-teal.vercel.app/icon.png`
  200 응답(3998바이트, image/png) 확인. **미검증 항목**: iOS "홈 화면에 추가" 렌더링은
  실기기가 필요해 이 세션에서 확인 못 함 — CD가 실기기로 직접 확인 필요.
- **모바일 서브페이지 헤더(S09/S11/S12/S16) 뒤로가기 버튼 무반응 버그: 발견 + 수정
  완료(2026-07-20).** CD가 S09(근태상세)에서 좌측상단 클릭이 안 된다고 보고, 코드
  확인 결과 `MobileSubPageHeader`(`src/components/mobile/Header.tsx`)의 `onBack` prop을
  **실제 사용처 4곳(S02/S09/S11/S12/S16) 전부 단 한 곳도 넘긴 적이 없어서**(grep으로
  재확인, 정의부 외 호출 0건) 버튼의 `onClick`이 처음부터 `undefined`였던 시스템 전반의
  버그였음 — S09에서만 보고됐지만 실제로는 뒤로가기 버튼이 있는 모든 서브페이지가
  동일하게 죽어있었음. `useRouter().back()`을 기본 폴백으로 추가(`onBack` prop을 넘기면
  그 커스텀 동작 우선, 안 넘기면 브라우저 history back) — 이미 `"use client"` 컴포넌트라
  추가 리팩토링 없이 훅만 추가하면 됐음. 라이브 검증(로컬, 기존 영구 테스트 계정
  "모바일테스트" 재사용, 이번 확인용으로 오늘자 근태 기록 1건 임시 시드): S08→S09
  드릴인 후 뒤로가기 클릭 → `/m/attendance`로 정확히 복귀 확인(스크린샷 포함),
  S10→S12, S10→S11, S15→S16 3개 조합도 전부 뒤로가기로 정상 복귀 확인. 시드했던
  attendance_records/events 삭제, 재조회로 삭제 확인, "이동석" 레코드 미접촉 재확인.
  `npx tsc --noEmit`/`npx eslint` 클린, 프로덕션 배포 완료.

- **관리자 로그인(A13) "아이디 저장" 체크박스: 완료(2026-07-20).** Figma
  `Cb5ZQsPWOScDxrjw8eojvI` node `127:2712`(A13 — 관리자 로그인) 기준, 체크박스 컴포넌트
  자체는 node `202:4550`/`202:4551`(checked/unchecked variant)에서 정확한 SVG(체크:
  24x24, rx=3, black stroke-width 2 rect+checkmark path)와 CSS(미체크: 2px
  `border-divider` #c7c7c7, `rounded-[4px]`)를 그대로 추출해 구현함
  (`src/components/admin/Checkbox.tsx`). **비밀번호는 앱 코드에서 저장하지 않음** —
  이메일만 `localStorage`(`bywork_admin_saved_email` 키)에 저장하고, 실제 비밀번호
  자동완성/저장은 `autoComplete="username"`/`"current-password"` 속성으로 브라우저
  자체 비밀번호 관리자에 위임(CD와 사전에 이 방식으로 합의). 라이브 검증(Playwright,
  로컬): 최초 접속 시 미체크+빈칸 → 체크+이메일 입력 후 새 탭(재접속 시뮬레이션)에서
  이메일 자동 채움+체크 유지 확인 → 체크 해제 시 `localStorage` 즉시 삭제 → 재접속 시
  다시 빈칸으로 돌아오는 것까지 5단계 전부 확인. 체크/미체크 상태 스크린샷도 Figma
  원본과 대조 확인. `src/app/login/page.tsx`(컨트롤드 이메일 state) 수정, 프로덕션
  배포 완료.
- **사용자 앱 로그인(S01) "아이디 저장" 체크박스: 완료(2026-07-20).** 위 관리자용과
  동일한 기능·같은 원칙(비밀번호는 앱 코드에서 절대 저장 안 함, `autoComplete`로
  브라우저에 위임)을 모바일에도 적용. Figma node `79:1413`(S01 — 로그인)의 체크박스
  인스턴스(`203:1768`) → 컴포넌트 정의 `203:1758`(Default)/`203:1762`(Active)에서
  실측한 결과 **어드민과 색이 다르다** — 미체크 테두리/라벨 색은 `warm-gray`(#9c9c9c,
  어드민은 `soft-gray` #757575였음), 체크 시 박스 테두리+체크마크 색은 검정이 아니라
  **accent 노랑(#ffcc01)** — 같은 컴포넌트라도 화면(테마)마다 실제 값이 다르다는
  `figma-pixel-accurate` 원칙이 이번에도 그대로 재확인됨. `src/components/mobile/
  Checkbox.tsx` 신규, `src/app/m/login/page.tsx`(`MobileMarkField`에 value/onChange/
  autoComplete 패스스루 추가) 수정. `localStorage` 키는 `bywork_mobile_saved_email`로
  관리자용과 분리(같은 브라우저에서 관리자/직원 두 계정을 각각 기억할 수 있어야 하므로).
  라이브 검증(Playwright, 로컬) 5단계 전부 통과 + 체크 상태 스크린샷으로 노란 체크박스
  렌더링까지 확인, 프로덕션 배포 완료.

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
    리다이렉트(307→`/m/login`) 확인. 실제 `inviteUserByEmail`로 발송된 초대 메일을 **사용자가
    직접 메일함에서 클릭해서** `/auth/confirm`→`/m/register-password`→비밀번호 설정→로그인
    성공까지 완료 — `auth.users.updated_at`(비밀번호 변경 시각)과 `last_sign_in_at`(로그인
    시각)이 초대 발송 5분여 뒤 같은 타임스탬프로 찍힌 걸로 DB 레벨에서 재확인함(제가 대신
    클릭한 게 아니라 실제 사람이 메일 링크를 눌렀다는 증거). 테스트로 만든 employees/auth
    레코드는 전부 정리 완료(원래 상태 복원, `이동석` 레코드만 남음).
  - S03~S16(체크인/휴가신청/통계 등)은 여전히 백엔드 미연동 — 그룹B부터 순서대로 예정.
- **사용자 앱 백엔드 연동 — 그룹B(S03~S09, 체크인/근태 핵심 로직): 완료.**
  - **hybrid 인증 판정 로직의 출처**: `byWORK_관리자웹_최종개발명세서.md:63`(섹션 "## 4.
    인증 방식 — IP/GPS 하이브리드")에 있는 **원문 그대로 인용**함(추정/재구성 아님):
    > 요건정의서에 확정된 "IP 1차 + GPS 2차 + 관리자 수동 승인 폴백" 로직의 화면 구현.

    이 문장 자체가 "요건정의서에 확정된"이라고 말하고 있어 최초 출처는 이 저장소에 없는
    별도 "요건정의서" 문서로 보임 — `최종개발명세서.md`는 그걸 인용한 2차 문서. 이 문구를
    근거로 hybrid = **순차 폴백**(IP 먼저 검사 → 실패 시 GPS 검사 → 그것도 실패 시 관리자
    수동승인)으로 구현하기로 사용자 확인받음(단순 AND/OR가 아님).
  - **관리자 수동승인 폴백/`manual_approval` 모드는 그룹B 범위에서 완전히 제외**하기로
    확인받음 — `attendance_status` enum에 "승인대기" 상태가 없고(present/remote/absent/
    on_leave 4개뿐), 관리자 쪽에 승인 큐/버튼 UI가 어디에도 없어(grep 0건) 새 UI+스키마
    상태가 필요한 별도 규모의 작업으로 판단됨. hybrid에서 IP/GPS 둘 다 실패하거나
    `auth_method='manual_approval'`인 직원이 체크인 시도 시 → attendance_records에 아무것도
    쓰지 않고 안내 메시지만 표시("관리자에게 문의하세요").
  - **attendance_records row 생성 시점**: 배치/스케줄러가 전혀 없음(grep 0건, `supabase/`에
    functions 디렉토리 자체가 없음)을 확인한 뒤 사용자 확인받아 **"출근하기" 클릭 시
    get-or-create(upsert)** 방식으로 결정. 부작용: 아무 버튼도 안 누른 진짜 결근일은
    row 자체가 안 생겨서 근태 목록에서 누락됨 — "배포 전 확인 필요"에 별도 기록.
  - **순서 위반 방어**: 그날의 마지막 이벤트 타입 기준 상태머신으로 최소한의 서버 검증을
    넣기로 판단(사용자 확인 없이 직접 결정, 근거는 아래). 홈 화면이 실제 상태 기반으로
    유효한 버튼만 보여주므로 UI만으로 대부분 막히지만, 여러 탭/느린 네트워크로 화면이
    오래된 상태를 보여줄 수 있어 서버 쪽 최종 방어선이 필요하다고 판단(`src/lib/
    attendanceEvents.ts`의 `NEXT_ALLOWED`). 위반 시 DB 쓰기 없이 사유별 메시지만 반환 —
    라이브 테스트로 5가지 위반 케이스 전부 DB 미변경 확인함.
  - **구현 파일**: `src/lib/employeeAccount.ts`(세션→직원 조회, adminAccount.ts와 동일
    패턴), `src/lib/attendanceEvents.ts`(상태조회/순서검증/이벤트기록 핵심 로직),
    `src/app/m/actions.ts`(서버 액션), `src/app/m/AttendanceButtons.tsx`(geolocation 수집 +
    액션 호출 클라이언트 컴포넌트). `src/app/m/page.tsx`(S03~S07), `src/app/m/attendance/
    page.tsx`(S08, 실제 월 데이터 + holidays 테이블 연동 + 날짜별 드릴인 링크 추가),
    `src/app/m/attendance/[date]/page.tsx`(S09, 실제 이벤트 나열 — 외출→복귀 반복도
    고정 4행이 아니라 실제 발생한 만큼 표시)까지 전부 정적 목업에서 실데이터로 전환.
  - **라이브 테스트로 발견한 버그 1건**: `MobileRecordCard`(공용 컴포넌트,
    `src/components/mobile/InfoBox.tsx`)가 React key로 `row.label`을 쓰고 있었는데, S09
    근무기록에서 외출→복귀를 두 번 하면 "복귀" 라벨이 중복되면서 key 충돌 경고가 남 —
    index 기반 key로 수정. 이 컴포넌트는 S10(신청내역)에서도 쓰이므로 같은 버그가 잠재해
    있었던 것(이번에 처음 라벨 중복 케이스로 실사용해서 드러남).
  - **범위 밖으로 남겨둔 것(의도적)**: "이번 주 근무현황"/"잔여 연차"(주간 집계 별도 후속
    작업), S09 "SSID 자동체크"(스키마에 대응 컬럼 없음, "적용" 고정 표시), S08 "지각" 상태
    (판정 기준 없음 — 범례에서도 제거함). 근태 상태별 순서위반 에러 메시지는 이벤트
    타입별로 1개씩만 있어(`SEQUENCE_ERROR_MESSAGE`) 일부 엣지케이스(예: 이미 퇴근 완료한
    날 퇴근 재시도 시 "출근 기록이 없어..." 메시지가 뜸)에서 사유가 부정확할 수 있음 —
    기능은 정확히 막지만 문구가 최적은 아님.
- **사용자 앱 백엔드 연동 — 그룹C(S10~S12, 휴가 신청/조회): 완료.** 승인 로직
  (`approve_leave_request`/`reject_leave_request` RPC)은 기존에 검증 완료된 상태라
  전혀 건드리지 않음 — 이번 그룹은 "신청"과 "조회"만 채움.
  - **잔여 연차 검증 시점**: `employees.annual_leave_days`/`used_leave_days` 확인 결과
    `used_leave_days`는 승인 시에만 증가하고, 신청/승인 어디에도 초과 여부 검증이
    전혀 없었음(승인 RPC도 무검증)을 확인한 뒤 사용자 확인받아 **신청(제출) 시점에
    서버에서 차단**하기로 결정 — 잔여 = `annual_leave_days - used_leave_days - (그
    직원의 pending 상태 leave_requests.days 합)`. pending까지 빼는 이유는 대기중인
    신청들끼리 합이 총부여를 넘는 것도 신청 시점에 막기 위함(`src/lib/
    employeeLeaveRequests.ts`의 `getLeaveBalance`).
  - **날짜 중복 방지는 애플리케이션 코드가 아니라 DB 레벨로 구현**하라는 사용자 지시에
    따라 `btree_gist` + partial EXCLUDE 제약으로 처리(`20260716010000_leave_requests_
    no_overlap.sql`) — 그룹B의 attendance_records 동시성 이슈와 같은 이유로, 앱 코드의
    "SELECT로 겹침 확인 후 INSERT" 방식은 두 요청이 거의 동시에 들어오면 둘 다 통과할
    수 있어서다. `employee_id` 동일 + `daterange(start_date, end_date, '[]')` 겹침을
    `status in ('pending','approved')`인 행에만 적용(rejected는 재신청 막을 이유 없어 제외).
    위반 시 Postgres가 `23P01`(exclusion_violation)을 던지는데, 이 raw 에러가 화면에
    그대로 노출되지 않도록 `submitLeaveRequest`에서 "같은 기간에 이미 신청한 휴가가
    있습니다"로 번역 — 라이브 테스트로 사람이 읽을 수 있는 문구로 뜨는 것까지 스크린샷
    확인함.
  - **구현 파일**: `src/lib/employeeLeaveRequests.ts`(잔여연차/중복검증/제출/조회 로직 —
    관리자용 A06 로직인 `src/lib/leaveRequests.ts`와 이름이 겹쳐서 처음에 덮어쓸 뻔했다가
    별도 파일로 분리함), `src/lib/leaveTypes.ts`(휴가 종류 상수 — 클라이언트 컴포넌트도
    쓰는데 `employeeLeaveRequests.ts`는 `server-only`라 분리 안 하면 빌드 에러 남),
    `src/app/m/leave/new/actions.ts`+`LeaveNewForm.tsx`(S11, Figma의 "날짜 선택 +
    날짜 추가"를 "시작일 + 선택적 종료일(기간 확장)"로 해석해 실제 동작하는 날짜
    입력으로 구현 — DB가 연속 기간 하나만 표현 가능해서 비연속 다중 날짜는 스키마상
    불가능), `src/app/m/leave/page.tsx`(S10, 요약 카드는 "총부여=사용+잔여"로 항상
    검산되는 확정 잔여(pending 미차감)를 보여주고, pending까지 뺀 엄격한 잔여는 S11
    제출 미리보기에서만 씀 — 의도적으로 다른 두 숫자), `src/app/m/leave/history/
    page.tsx`+`LeaveHistoryList.tsx`(S12, 탭 필터는 페이지 이동 없이 클라이언트에서).
  - **라이브 테스트로 발견한 버그 1건**: `MobileTextField`/`MobileTextArea`에 `id`를
    안 넘기면 label의 `htmlFor`가 비어서 label-input이 프로그래밍적으로 연결이 안 됨
    (접근성 문제 + `get_by_label` 테스트 불가) — S11의 날짜/사유 필드에 `id` 추가해서
    고침. S01/S02/S16의 기존 TextField 사용처도 같은 패턴(id 없음)이라 잠재적으로 같은
    문제가 있지만, 이번 그룹 범위 밖이라 손대지 않음.
  - **라이브 테스트 전부 완료**: 잔여일수 초과(20일/잔여 15일) 신청 → `insufficient_
    balance`로 거부 + DB 미쓰임 재확인 → 겹치는 기간(09/01~09/05 승인 후 09/03~09/04
    재신청) → EXCLUDE 위반이 "같은 기간에 이미 신청한 휴가가 있습니다"로 정상 번역
    표시(스크린샷 확인, DB에 두 번째 행 안 생김) → 정상 신청(5일) → `approve_leave_
    request` RPC로 승인 → S10 요약(총부여 15/사용 5/잔여 10)과 S12 배지(승인)에
    즉시 반영까지 end-to-end 확인. 테스트 계정/데이터 전부 삭제, 이동석 레코드 미접촉.
- **사용자 앱 백엔드 연동 — 그룹D(S13~S14, 통계) + 그룹B leftover: 완료.**
  - **"지각" 지표는 S08과 동일하게 범위에서 제외**(사용자 확인) — `company_settings.
    standard_start_time`(09:00 기본값) 컬럼 자체는 있지만, 유예시간 정책이 스키마
    어디에도 없어서 "무조건 09:00 초과=지각"으로 구현하면 정책을 임의로 만드는 셈이라.
    S13 월간 통계의 "지각" 카드를 그냥 제거함(대체 카드 없음 — "연차" 카드가 혼자
    한 행을 차지하게 됨, S08 범례에서 "지각" 뺀 것과 같은 처리 방식).
  - **"순 근무시간" 계산은 불필요, 대신 그룹B/S09의 라벨-계산 불일치 버그 발견**:
    S13/S14 mock 라벨이 전부 "총 근무시간"(gross)이라 go_out/return 구간 매칭 집계가
    새로 필요 없었음. 대신 이걸 확인하려고 S09를 다시 보다가, "순 근무 시간" 필드가
    라벨과 다르게 실제로는 gross 값(외출시간 미차감)을 쓰고 있던 버그를 발견해서
    고침(`attendance/[date]/page.tsx`) — `총 근무시간 - 외출시간` 계산으로 수정,
    라이브로 07-15 데이터(9h gross - 1h 외출 = 8h 순) 재확인함. S13/S14는 gross
    전용이라 이 net 계산과 겹치는 부분이 없어 공용 함수로 뺄 필요는 없었음.
  - **구현 파일**: `src/lib/employeeAttendanceStats.ts`(월간/연간/이번주 집계 — admin
    A07의 `attendance.ts`와 같은 주 경계 처리 패턴을 재사용하되 관리자 인증 없는
    별도 파일로 분리), `src/app/m/stats/page.tsx`+`StatsView.tsx`(S13/S14, 탭 전환은
    페이지 이동 없이 클라이언트 상태이므로 월간/연간 데이터를 서버 컴포넌트에서
    한 번에 다 받아옴). 52시간제 판정(`weeksOver52`)과 목표 대비 퍼센트(주 40h/월
    120h — 원래 mock 값 그대로 유지)도 전부 실데이터 기반으로 계산.
  - **그룹B leftover 처리**: `src/app/m/page.tsx`(S03/S07)의 "이번 주 근무현황"과
    "잔여 연차" 고정값을 각각 `getThisWeekWeekdayHours`(S13용 집계 로직 재사용)와
    `getLeaveBalance`(그룹C에서 만든 것 재사용)로 교체. 원래 리포트에는 없었지만
    바로 옆의 "주간 누적"(`MobileWeeklyProgress`, 27h21m/52h 고정값) 위젯도 같은
    범주의 leftover라 판단해 같이 실데이터로 교체함(52h는 노동법 주간 상한과 동일한
    숫자라 그대로 목표값으로 재사용).
  - **라이브 테스트**: 테스트 직원 1명에 6월 한 주(6일×9h=54h, 52h 초과 케이스
    의도적으로 포함) + 7월 4일치 근태(6h/9h/9h/외출 낀 9h) + 연차 1일(승인)을 직접
    시드해서, S03(이번주 9h/9h/9h/-/-, 잔여 14일)/S09(총9h0m-외출60m=순8h0m)/
    S13(총근무일4일, 총33h, 연차1일, 주별 1주6h·2주27h)/S14(연간 총87h, 52h초과
    1주, 연차현황 15/1/14) 전부 스크린샷으로 수동 계산값과 표로 대조해 전항목 일치
    확인. 테스트 계정/데이터 전부 삭제(정리 후 재조회 결과 이동석 계정 백필 데이터
    8건만 남은 것까지 확인 — 내 테스트 데이터 아님).
- **사용자 앱 백엔드 연동 — 그룹E(S15~S16, 계정관리) + 접근성 부채 정리: 완료.**
  이걸로 사용자 앱(S01~S16) 백엔드 연동 전체가 끝났다(그룹A~E 전부 완료 — 남은 건
  그룹F(WebAuthn 생체인증, 별도 우선순위)와 배포 전 QA 재실행뿐).
  - **0단계 — "생체인증 설정" 행 확인**: `href` 자체가 없는 순수 `<div>`라 눌러도 죽은
    링크나 에러 화면으로 가지는 않음(원래도 안전) — 다만 chevron 화살표가 "누르면
    이동한다"는 착각을 줘서, WebAuthn 로직 없이 trailing을 "준비중" 텍스트로 바꿈
    (`src/app/m/my/page.tsx`).
  - **로그아웃**: `href="/m/login"` 순수 네비게이션이라 세션이 안 지워지던 걸,
    그룹A 때 이미 만들어져 있었지만 어디서도 안 쓰이던 `logout()` 서버 액션
    (`src/app/m/login/actions.ts`)에 연결만 하면 됐음 — 새로 구현한 게 아니라
    기존에 죽어있던 코드를 실제로 연결한 것. 라이브로 로그아웃 후 쿠키에 auth 토큰
    0개 남는 것과, 이후 `/m` 재접근 시 proxy가 다시 `/m/login`으로 리다이렉트하는
    것까지 확인함.
  - **비밀번호 변경(S16)**: 관리자용 `changeAdminPassword`(adminAccount.ts)는
    service_role로 남의 비밀번호를 강제 리셋하는 관리자 기능이라 현재 비밀번호
    검증이 없는데, S16은 본인이 본인 비밀번호를 바꾸는 자기서비스 플로우라 그 패턴을
    그대로 가져오면 안 됨 — `signInWithPassword`로 현재 비밀번호를 먼저 재인증하고
    성공해야만 `updateUser`로 실제 변경하도록 구현(`src/app/m/my/password/
    actions.ts`). 라이브로 틀린 현재 비밀번호 거부 확인 → 정상 변경 → 옛 비밀번호
    로그인 실패 확인 → 새 비밀번호 로그인 성공 확인까지 전부 완료.
  - **TextField/TextArea id 누락(그룹C에서 발견한 부채) 정리**: S01(`MobileMarkField`
    내부 커스텀 `<label>`에 `htmlFor` 추가), S02(`newPassword`/`confirmPassword`에
    `id` 추가), S16(신규 구현하면서 처음부터 `id` 포함) — S11은 그룹C에서 이미 고침.
    "고쳤다"는 시각적 확인이 아니라 Playwright `get_by_label()`로 4곳(S01 이메일·
    비밀번호, S02 새 비밀번호·비밀번호 확인, S11 시작일, S16 현재·새·새 비밀번호
    확인) 전부 실측 확인함 — label이 input과 프로그래밍적으로 연결 안 돼 있으면
    `get_by_label`이 아예 찾지 못하므로 이 자체가 접근성 검증. S01/S02는 그룹A 때
    "완료" 처리됐던 화면이라, id 추가 후 실제 로그인/비밀번호등록 라이브 플로우가
    여전히 정상 동작하는지도 같이 재확인(회귀 없음 — 그룹B 때 Button 56px 전역변경
    후 재검수했던 것과 같은 원칙 적용).
  - **범위 밖으로 남겨둔 것**: S15의 프로필 표시(이름/이메일/입사일/근무시간/근무지)는
    여전히 하드코딩 — 이번 그룹은 "로그아웃/비밀번호변경/접근성"만 요청받아서 실데이터
    연동은 손대지 않음.
- **에러 화면 E01~E07 퍼블리싱: 완료.** 전부 `/screens/errors/e0N` 미연결 라우트로만
  존재(실제 로직에는 미연결 — E02/E04는 이미 인라인으로 연결된 기존 로직을 그대로
  두고 건드리지 않음). `MobileErrorState`(`src/components/mobile/ErrorState.tsx`)
  공유 템플릿 + `MobileErrorSymbol`/`MobileErrorMessageIcon` 공유 서브컴포넌트로 구현.
  **"공유 템플릿이라도 화면마다 값은 실측"** 원칙을 7개 전체에 적용한 결과 아래 표처럼
  화면마다 실제로 색이 다 달랐다 — 다음에 비슷한 화면을 또 만들 때 참고할 것.

  | 화면 | 테마 | 심볼색 | 메시지아이콘색 | 버튼(보이는 것) | 하단 패딩 | 비고 |
  |---|---|---|---|---|---|---|
  | E01 초대링크 만료 | dark | white | accent(#ffcc01) | outline-soft(#757575) | 160 | |
  | E02 GPS 권한거부 | dark | white | accent | outline-white + outline-soft(2개 다 실제) | 160 | 유일하게 버튼 2개 다 보임 |
  | E03 세션 만료 | dark | white | accent | outline-warm(#9c9c9c) | **140**(대칭) | 타이틀 1줄 |
  | E04 퇴사자 로그인 | dark | white | accent | (버튼 없음, 문의 텍스트 2줄) | 160 | 타이틀 1줄, 설명 2번째 줄 투명 |
  | E05 네트워크 오류 | light | light-gray(#c7c7c7) | light-gray | outline-dark(#4a4a4a) | 160 | |
  | E06 404 | light | light-gray | light-gray | outline-dark | 160 | |
  | E07 500 오류 | light | light-gray | light-gray | outline-dark | 160 | |

  - **심볼/버튼 색은 절대 테마로 자동추론하지 말 것** — "dark=white, light=dark-gray"
    같은 2분류 짐작이 실제로 한 번 틀렸다(E06이 light인데 light-gray를 씀, dark-gray
    아님). 메시지아이콘 색만 유일하게 "dark 테마=accent, light 테마=light-gray"로
    깔끔하게 2분류가 맞아떨어졌다(7개 전부 실측 완료, 예외 없음).
  - **메시지아이콘은 돋보기가 아니라 스타일라이즈된 큰따옴표(") 모양** — 7개 화면
    전부 path가 byte-identical, 색만 다름(`MobileErrorMessageIcon`으로 공유).
  - **`MobileButtonVariant`에 `outline-soft`(#757575)/`outline-white`(#ffffff) 신규
    추가** — 기존 4개(filled-accent/outline-dark/outline-warm/filled-muted) 중
    이 두 색과 일치하는 게 없었음.
  - **실측 중 발견해서 고친 레이아웃 버그**: 버튼 슬롯 2개가 "숨김 스페이서 + 실제
    버튼 1개" 조합일 때는 스페이서의 고정폭(`w-[333px]`)이 우연히 flex 컨테이너
    너비를 잡아줘서 문제가 안 드러났는데, E02처럼 둘 다 `w-full`(퍼센트) 버튼이면
    고정폭 기준점이 없어서 flex 컨테이너가 content-size로 쪼그라들고 버튼도
    148.66px로 쪼그라드는 버그가 있었음 — `getBoundingClientRect()` 실측으로만
    발견 가능했음(스크린샷 육안으로는 안 보일 정도의 차이). 버튼 wrapper div에
    `w-[333px]`를 명시해서 고침.
  - **사용자 스크린샷 지적으로 발견한 2번째 레이아웃 버그**: 타이틀이 1줄인 화면
    (E03/E04)에서 버튼이 2줄 화면보다 위로 딸려 올라가 있었음 — Message 블록을
    content-driven 높이로 만들어서, 타이틀이 짧으면 블록 자체가 줄어들고 그만큼
    버튼도 따라 올라간 것. `get_metadata` 재조회 결과 Figma의 실제 "Message" 컴포넌트는
    **고정 높이 233.193px**를 가지고 있어서(E01=233.193, E03=233.19 — 타이틀 줄 수와
    무관하게 동일), 다음 버튼 블록도 항상 `message.y + 373.193`에 고정되는 걸 확인함.
    Message wrapper에 `h-[233.193px]`를 명시해서 고침 — 재측정 결과 7개 화면 전부
    버튼이 `y=667.19`로 통일됨(직접 Figma 실측값과 일치). 2줄 타이틀 화면(content
    243.19 > box 233.193)은 10px 정도 박스 밖으로 살짝 넘치지만 clip 안 해서 시각적
    문제 없고, 이것도 Figma 원본과 동일한 실제 동작(다음 형제 위치는 넘친 content가
    아니라 고정 박스 기준으로 계산됨).
  - **E04 각주**: footer의 이메일 "blackds@by-bk.com"은 Figma에 박힌 텍스트를 그대로
    옮긴 것 — 실제 로직 연결 시엔 특정 개인이 아니라 회사 대표/관리자 연락처로
    바뀌어야 할 가능성 있음(이번엔 퍼블리싱만이라 그대로 둠).
  - **전 화면 대조표(실측 기준) 요약**: padding/gap(140/40/16/8 등)·타이틀
    (30px/800/-0.6px/42px)·설명(16px/600/-0.32px)·버튼(14px/600/-0.28px/30px
    radius/56px 높이) 전부 7개 화면에서 100% 일치 확인 — 위 표에 없는 값은
    E06 작업 때 확정한 공통값 그대로.
- **`/auth/confirm` 리다이렉트 버그(E01 조사 중 발견): 수정 완료.** 이 라우트는
  관리자용(`next=/reset-password`)과 모바일 직원용(`next=/m/register-password` —
  초대/A04 비번초기화/재입사 전부 이 경로) 링크가 같이 거친다. 토큰 검증 실패 시
  `next` 값과 무관하게 무조건 `/login`(관리자 데스크톱 화면)으로만 보내던 버그가
  있었음 — 모바일 초대 링크가 만료돼도 393px 화면이 아니라 관리자 로그인 화면이
  뜸. `next.startsWith("/m/")`로 분기해서 `/m/login` vs `/login`을 나누도록 수정
  ([auth/confirm/route.ts](src/app/auth/confirm/route.ts)).
  - **부수 발견**: `/m/login`이 애초에 `?error=` 쿼리 파라미터 자체를 안 읽고 있었음
    (관리자 `/login`은 `LoginNotice` 컴포넌트로 이미 읽고 있었는데 모바일 쪽엔 그
    대응이 없었음) — 리다이렉트 경로만 고치면 도착은 하되 에러 메시지는 안 뜨는
    상태였을 것. `MobileLoginNotice.tsx`를 관리자 `LoginNotice`와 동일한 패턴
    (`useSearchParams` + Suspense 경계)으로 신설해서 같이 고침.
  - **라이브 검증**: 코드를 일부러 되돌려서 버그 재현 먼저 확인(`next=/m/register-
    password`인데 `/login`으로 감, 회귀 방지용 기록) → 재적용 후 4가지 실제 호출
    조합 전부 재확인 — 모바일 초대(type=invite)→`/m/login` ✓, 관리자 비번재설정
    (`next=/reset-password`)→`/login`(회귀 없음) ✓, `next` 없음(기본값 `/dashboard`)
    →`/login`(회귀 없음) ✓, 재입사/A04 재설정(type=recovery, `next=/m/register-
    password`)→`/m/login` ✓. 브라우저로 실제 화면까지 열어서 두 경로(`/m/login`,
    `/login`) 다 에러 메시지가 시각적으로 뜨는 것까지 스크린샷 확인.
  - **grep 재확인**: 이 라우트를 실제로 타는 호출부는 정확히 3곳뿐 —
    `login/actions.ts`(관리자 본인 비번재설정), `employees/actions.ts`의
    `createEmployee`(신규 초대)와 `sendPasswordResetEmail`(A04 버튼 + `rehireEmployee`
    재입사가 이 함수 하나를 공유) — 새로 발견된 4번째 호출부는 없었음.
- **사용자 앱(S01~S16 백엔드 연동 + 에러페이지) 배포 전 최종 QA: 완료, 🔴 없음.**
  통합 시나리오(로그인→체크인 전종류→S08/S09/S13/S14 반영→휴가 신청/승인→로그아웃→
  재로그인 연속성→실제 만료 초대링크 재현), 보안 재점검(서버전용 모듈 노출 0건,
  `attendance_events`/`leave_requests` GRANT+RLS 재확인, 타 직원 데이터 접근 시도로
  서버단 employee_id 격리 실측 확인, `auth/confirm`류 공유 라우트 추가 발견 0건) 전부
  통과. 상세 결과는 이 QA를 요청한 대화 세션에 한 번에 보고함(리포트 원문은 이 파일에
  중복 기록하지 않음 — 아래 항목들이 그 리포트의 핵심 결론). IP 화이트리스트 실환경
  검증(Vercel 배포+실제 사무실 네트워크)은 이 세션 능력 밖이라 미검증 상태로 남음.
  테스트 계정("QA최종테스트" 등) 전부 정리 완료, `company_settings` GPS 값 null로
  원복 확인, 이동석 레코드 미접촉 재확인.
- **프로덕션 배포 진행 중(2026-07-20 시작)**: Vercel `goory78` 계정에 `bywork` 프로젝트
  신규 생성, 프로덕션 URL은 `https://bywork-teal.vercel.app`(커스텀 도메인
  `bywork.by-bk.com` 연결은 아직 — DNS는 CD가 별도 진행 예정, `by-bk.com` 네임서버는
  카페24). 환경변수 5개(SUPABASE_URL/SERVICE_ROLE_KEY/ANON_KEY, HOLIDAY_API_KEY/
  ENDPOINT) 프로덕션에 등록 완료. **배포 중 발견/수정한 버그**: Vercel이 CLI로 프로젝트를
  새로 만들 때 Framework Preset이 "Other"로 잘못 잡혀서 전체 라우팅이 깨져 있었음(모든
  경로가 Vercel 플랫폼 레벨 `NOT_FOUND`) — `vercel project update --framework nextjs`로
  수정 후 재배포로 해결. 배포 직후 확인(루트 `/`→`/login` 리다이렉트, `/screens`+
  `/screens/errors/e01~e07` 전부 404, 관리자·모바일 로그인 라이브 테스트) 전부 통과.
  **IP 화이트리스트 실환경 검증: 완료(2026-07-20).** CD가 사무실 wifi에서
  `/m/login`에 접속 → `src/lib/attendanceAuth.ts`/`src/proxy.ts`에 임시로 붙인
  `x-forwarded-for`/`x-real-ip` 로깅으로 실제 공인 IP(`125.131.67.104`) 확인 →
  `ip_whitelist`에 등록(`label`에 "실환경 검증용 임시등록, 운영정책 확정 전까지
  재검토 필요"라고 명시 — **운영 정책(회사에 IP가 여러 개일 수 있는지, 유동IP
  대응 등)이 아직 정해지지 않은 상태로 넣은 값이라 실배포 전 CD 재검토 필수**).
  이후 `auth_method='ip_only'`인 완전히 새 합성 테스트 직원("IP검증테스트")을
  만들어 CD가 직접 로그인 → 체크인 시도 → 로그로 `ip_whitelist 매칭 여부: true`
  확인 → DB로 `attendance_events`에 `event_type=check_in`,
  `check_in_method='ip'`, `ip='125.131.67.104'`, `attendance_records.status=
  'present'`까지 실제로 기록되는 것 확인. 테스트 계정/데이터 전부 삭제, 임시
  로깅 코드 제거 후 재배포 완료(grep으로 잔존 0건 재확인). **`ip_whitelist`의
  임시 등록 행 자체는 남겨둠**(다음 실환경 테스트나 실제 운영에 필요 — 삭제하지
  않았음, 정책 확정 시 재검토).
- **Supabase Site URL이 `localhost:3000`으로 방치돼 있던 버그: 발견 + 수정 완료
  (2026-07-20).** 프로덕션 배포 후 `blackds@by-bk.com` 비밀번호 재설정 메일을 클릭하면
  `localhost:3000/login#error=access_denied&error_code=otp_expired&...&sb=` 로 떨어지는
  증상으로 발견됨 — 이 URL 형태(프래그먼트 + `sb=` 파라미터) 자체가 저희 앱의
  `/auth/confirm` 라우트가 만드는 게 아니라 **Supabase가 자체 호스팅하는
  `*.supabase.co/auth/v1/verify` 페이지가 만드는 리다이렉트**라는 게 결정적 단서였음.
  원인: Supabase 대시보드 Authentication → URL Configuration의 **Site URL이 개발 초기
  `localhost:3000`으로 남아있었고, Redirect URLs 허용목록에 `bywork-teal.vercel.app`이
  없어서**, 코드가 보낸 `redirectTo`가 무시되고 옛 Site URL로 대체되고 있었음. CD가
  Site URL을 `https://bywork-teal.vercel.app`로 변경 + Redirect URLs에 추가 후,
  `service_role`로 생성한 실제 recovery 토큰으로 전체 체인(`/auth/confirm` → `/reset-
  password`) 라이브 재검증 완료 — 최종 도착 도메인 `bywork-teal.vercel.app`, `/reset-
  password` 폼(새 비밀번호/비밀번호 확인 필드 + 제출 버튼) 정상 렌더링, 에러 없음
  전부 스크린샷으로 확인함. **나중에 `bywork.by-bk.com` 커스텀 도메인 연결 시 그
  도메인도 Redirect URLs에 추가 필요**(안 하면 이 버그 재발함).
- **(2번째 버그, 연쇄 발견) Reset Password 이메일 템플릿이 `{{ .ConfirmationURL }}`을
  써서 `/auth/confirm`이 `token_hash`를 아예 못 받던 문제: 발견 + 수정 완료(2026-07-20).**
  위 Site URL 버그를 고친 뒤에도, CD가 메일함 완전 정리 + 브라우저 캐시 삭제 후 **딱 1개
  메일만 받아서 26초 안에 즉시 클릭**했는데도 여전히 저희 앱 자체의 "만료되었거나 유효하지
  않은 링크입니다" 에러가 떴음 — 여러 번 요청으로 인한 토큰 무효화 가능성을 배제한
  깨끗한 재현이었다는 게 핵심. `/auth/confirm/route.ts`는 `token_hash`+`type` 쿼리
  파라미터가 URL에 직접 있어야만 검증을 시도하는 구조인데, Reset Password 템플릿이
  기본값 `{{ .ConfirmationURL }}`을 쓰면 메일 링크가 저희 앱이 아니라 **Supabase 자체
  호스팅 검증 페이지(`*.supabase.co/auth/v1/verify`)로 먼저 가서 토큰을 그쪽에서
  소모하고, `redirect_to`로 `token_hash`를 안 붙여서 넘김** — 그 결과 실제 토큰
  유효성과 무관하게 저희 라우트는 항상 "만료" 분기로 떨어짐(초대 메일 템플릿은 이미
  `{{ .TokenHash }}` 직결 방식으로 돼 있어서 그룹A 때는 이 문제가 안 보였던 것으로 추정).
  CD가 대시보드 Authentication → Email Templates → Reset Password를
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-
  password` 형태로 수정 후, 실제 이메일 재발송 → 클릭 → `/reset-password` 정상 도달까지
  라이브로 재검증 완료(스크린샷 확인, 에러 없음). 진단에 썼던 `/auth/confirm`의 임시
  로깅(`[confirm-debug]`)은 확인 후 제거하고 재배포함.
- **"이동석"(`blackds@by-bk.com`) 정체 확정(2026-07-20, CD 확인)**: **CD 본인, byBLACK 대표
  계정**. `employees` 테이블에는 `employment_status='terminated'`, `auth_user_id=null`인
  더미/시드 성격의 행으로 남아있는 것과는 별개로, 같은 이메일로 **실제로 살아있는 관리자
  계정**(`admin_profiles`, `auth.users.id=a4cb4658-8fff-40e0-8c7b-74119779833d`, 생성
  2026-07-13, 로그인 이력 있음)이 존재 — CD가 실제로 쓰는 관리자 웹 로그인이 바로 이 계정.
  정상적인 `createEmployee` 플로우가 아니라 수동/시드로 만들어진 이유는 **2026-07-13
  A03/A04 초기 테스트 중 생성+퇴사처리 테스트한 잔재로 추정, active로 복원 완료
  (2026-07-20)**. 근거: `terminateEmployee` 서버 액션(`src/app/(admin)/employees/
  actions.ts:193`)은 `termination_date`를 관리자가 고르는 게 아니라 버튼 클릭
  시점의 `new Date()`로 자동 채우는데, 이 행은 `termination_date='2026-07-13'`이었고
  `updated_at`도 `2026-07-13T04:22:37Z`(=13:22:37 KST)로 그 이후 한 번도 안 바뀌었으며
  `created_at`도 같은 날 00:56:10 UTC(3.5시간 전)라 "생성 직후 같은 날 퇴사 버튼까지
  눌러본 초기 개발 테스트"로 보는 게 가장 설명이 맞음. 전용 audit 로그 테이블은
  스키마에 없어서(확인 완료, `updated_at` 범용 트리거뿐) 이 이상 정밀한 시점 특정은
  불가. CD 지시로 `employment_status='active'`, `termination_date=null`로 복원
  완료(service_role PATCH, 200 확인) — `admin_profiles`/`auth.users` 쪽 실제 로그인
  계정(CD 본인)과는 별개로 `employees` 행 자체도 이제 정상 재직 상태.
- **커스텀 SMTP(Resend) 연동: 완료, 실도착 확인됨(2026-07-20).** 기본 내장 이메일
  서비스 한계(아래 문단 참고) 때문에 배포 전 강하게 권장했던 항목을 CD가 Supabase
  대시보드에서 직접 연동 완료. 연동 전에는 `blackds@by-bk.com`(CD 본인 관리자 계정)으로
  `resetPasswordForEmail`을 시도할 때마다 **`400 email_address_invalid`**가 떴었는데
  (rate limit이 아니라 이 에러가 진짜 원인이었음 — Vercel 프로덕션 로그로 확인),
  Resend 연동 후 재시도하니 이 에러가 완전히 사라지고 정상 발송됨. 이어진 재시도는
  `email_address_invalid`가 아니라 "37초 후 재시도 가능"이라는 정상적인 재발송
  쿨다운(`429`)이었음 — 이건 버그가 아니라 Supabase의 정상 보안 정책. 실제 다음(Daum)
  메일함에 도착까지 CD가 직접 확인(스팸함 포함, 즉시 도착 확인). **이 항목은 배포를
  막던 실제 이슈였고 지금은 완전히 해결된 상태.**
- **(연동 전 있었던 문제, 참고용 기록)** Supabase 기본 내장 이메일 서비스는 발송
  한도가 낮았음 — 이번 프로젝트 기간 중 실제로 1회 초대 메일 발송 후 곧바로 재발송
  시도가 "email rate limit exceeded"로 막혔던 사례, 그리고 위에서 발견된
  `email_address_invalid`(특정 주소 발송 차단으로 추정) 사례 둘 다 겪음. 지금은
  Resend 연동으로 해결됨.
- **결근 자동감지 공백**: attendance_records row가 체크인 버튼을 누를 때만 생성되므로,
  무단결근(아무 버튼도 안 누른 날)은 근태 목록에 행 자체가 안 생겨 누락됨 — 자동 결근
  감지가 필요하면 별도 배치(Vercel Cron 등) 인프라 구축이 후속 과제로 필요함.

## 다음 작업

- 기존 `byWORK_와이어프레임_최종본.html`을 위 Figma 재조사 결과(S03~S08, S13/S14 등)에 맞춰
  다시 그리는 작업 — 채팅에서 별도 진행 예정.
- **사용자 앱 하단탭 전환 애니메이션: 완료(2026-07-20).** 범위는 CD 확인대로
  하단탭(홈/근태/휴가/통계/마이) 전환만 — 드릴인 화면 방향성 슬라이드는 이번엔 제외.
  구현 전 `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`부터
  확인(AGENTS.md 지시대로, 이 프로젝트 Next.js는 표준과 다른 버전) — React의 네이티브
  `<ViewTransition>` 컴포넌트 + `next.config.ts`의 `experimental.viewTransition: true`
  조합이 이 버전에서 실제로 지원됨. **구현 전 발견한 선행 버그**: `MobileBottomNav`
  (`src/components/mobile/BottomNav.tsx`)이 Next.js `<Link>`가 아니라 순수 `<a href>`를
  쓰고 있어서 탭 전환마다 항상 풀 페이지 리로드가 발생하던 상태였음 — `ViewTransition`은
  클라이언트 사이드 전환에서만 트리거되므로 이것부터 `Link`로 교체하지 않으면 애니메이션
  자체가 아예 작동할 수 없었음. `src/components/mobile/TabTransition.tsx` 신규(공유
  `name="mobile-tab-content"` + `share="auto"`로 5개 탭 루트 페이지 전부 같은 정체성으로
  크로스페이드, `default="none"`으로 로그인/드릴인 등 다른 네비게이션엔 영향 안 줌 —
  문서의 "Step 4: Crossfade content within the same route" 패턴을 서로 다른 route
  간 전환에도 그대로 적용). `src/app/m/{page,attendance/page,leave/page,stats/page,
  my/page}.tsx` 5곳 전부 이 래퍼로 감쌈. **라이브 검증**: dev 서버는 Next.js DevTools
  인디케이터 배지가 하필 "홈" 탭 위치(좌하단)와 겹쳐서 클릭을 가로채는 현상이 있었는데
  (실제 버그 아님, dev 전용 UI) — 프로덕션 빌드(`next build && next start`)로
  재검증해서 확인: 탭 5번 전환 전부 URL 정상 이동 + `document` 타입 네트워크 요청 0건
  (전부 클라이언트 사이드 네비게이션, 풀 리로드 없음) + `document.startViewTransition`을
  계측해서 탭 전환마다 정확히 1번씩 호출되는 것까지 확인(브라우저 View Transition API가
  실제로 트리거된다는 증거). 프로덕션 배포 완료 — 실제 체감(부드러움 정도)은 CD가
  화면으로 직접 확인 요망(자동화 테스트로는 애니메이션 자체를 시각적으로 검증 못함).
- **사용자 앱 상단 여백 전수 재실측 + 수정: 완료(2026-07-20).** S01~S16 전체를
  Figma get_metadata로 다시 실측한 결과, **9개 화면(S08~S16 중 S02 제외)이 전부
  잘못된 상단 여백을 쓰고 있었음** — `MobileSubPageHeader`/`MobileTabRootHeader`
  (드릴인·탭루트 공용 헤더)가 전부 `pt-[100px]`로 하드코딩돼 있었는데, 실제로 100px이
  맞는 화면은 S02 하나뿐이고 나머지(S09/S10/S11/S12/S13/S14/S15/S16)는 60px이 맞았음
  — 과거 어느 시점에 S02 기준값을 다른 화면에도 그대로 재사용한 것으로 추정(이전
  세션에 "pt-60→100 수정" 이력이 코드 주석에 남아있었는데, 이번 재실측으로 그게
  대다수 화면엔 안 맞았다는 게 새로 드러남 — Figma 쪽이 그 사이 개편됐을 가능성).
  `MobileSubPageHeader`에 `topPadding` prop 추가(기본값 60px, S02 사용처
  (`MobileRegisterPasswordForm.tsx`)만 `topPadding="100px"`로 예외 지정),
  `MobileTabRootHeader`는 예외 없이 100→60. `MobileMonthPager`(S08)는 Figma 실측으로는
  50px이 맞았지만, **다른 헤더들과 값을 통일하기로 사용자가 확인**해서 60px로 맞춤
  (Figma 정확도보다 헤더 간 일관성 우선 — 의도적 선택, 버그 아님). 라이브 검증:
  S08(≈60, 아이콘 자체 인셋 때문에 실측 69)/S09/S10/S13/S15 전부 재측정해서 60 확인,
  스크린샷으로 시각적 개선도 확인. **S01(로그인)만 별도 이슈로 남음** — 공유 헤더
  컴포넌트를 안 쓰고 자체 `justify-center` 레이아웃이라 원인이 다르고, 실측 결과
  Figma 대비 ~15px 차이가 있음(143 기대 vs 실측 ≈128) — 이번 그룹 수정 범위에서
  제외, 필요시 별도 조사. 프로덕션 배포 완료.
- **사용자 앱 하단 네비 고정(fixed) + 마이페이지 로그아웃 여백: 완료(2026-07-20).**
  `MobileBottomNav`가 원래 각 페이지의 `flex justify-between` 흐름 안에 있어서, 콘텐츠가
  뷰포트보다 짧을 때만 우연히 하단에 붙어 보였을 뿐 — 스크롤이 생기는 화면에서는 네비가
  콘텐츠 맨 아래로 같이 밀려 올라가 있었음(고정 아님). `fixed inset-x-0 bottom-0`로
  바꾸고, iOS 홈 인디케이터 영역까지 고려해 `padding-bottom: max(30px, env(safe-area-
  inset-bottom))` 적용. 네비가 정상 흐름에서 빠지면서 마지막 콘텐츠가 네비에 가려지지
  않도록, 네비를 쓰는 9개 화면(S03~S16, `MobileBottomNav` 사용처 전부) 전부 `pb-[110px]`로
  하단 여백 확보. **마이페이지(S16, Figma 재확인 — 프레임 이름이 "S15/S16" 순서가
  개편되면서 "마이페이지"가 지금은 S16으로 바뀌어 있었음, 실측 시 주의)**는 Figma가
  최근 개편되면서 로그아웃 버튼 하단→GNB 상단 사이에 새로 74px 여백이 생겨서, 그 화면만
  콘텐츠 wrapper에 `pb-[74px]`를 추가로 얹음(총 74+110=184px 확보, 화면에 보이는 실제
  여백은 110px가 고정 네비에 가려지고 남은 74px). 라이브 검증: 로그아웃 버튼→네비 간격
  실측 74.5px(Figma 74px과 사실상 일치), 통계 화면에서 500px 스크롤 전/후 네비
  `getBoundingClientRect()` 좌표 완전히 동일 + `position: fixed` 재확인. 프로덕션
  배포 완료. **CD가 실기기(모바일 브라우저) 스크린샷으로 하단 여백이 과하다고
  지적**해서 네비 자체의 `padding-bottom`을 30px→10px로 20px 추가로 줄임(실측
  99→79px 높이 확인). 프로덕션 재배포 완료.
- **모션 파일럿(A: 스태거 등장, B: 카운트업+바채우기): 완료(2026-07-20).**
  0단계에서 Framer Motion vs 순수 CSS를 판단 근거와 함께 제시(패키지 미설치 상태,
  모바일 앱이라 번들 크기 민감, 필요한 효과가 전부 CSS/작은 훅으로 충분)해서
  **순수 CSS + 카운트업 전용 소형 커스텀 훅**으로 확인받고 진행 — Framer Motion
  신규 설치 안 함.
  - **A(스태거)**: `globals.css`에 전역 `.stagger-item`(opacity 0→1 + translateY
    12px→0, 350ms ease-out, `prefers-reduced-motion: reduce`에서 애니메이션 제거)
    유틸 추가. 파일럿 S03(`src/app/m/page.tsx`의 "출근전" 분기만 — 다른 홈
    상태/화면은 확산 결정 전까지 그대로)와 A01(`src/app/(admin)/dashboard/
    page.tsx`)의 최상위 섹션에 0/70/140(/210)ms 스태거 간격으로 적용.
  - **B(카운트업+바채우기)**: `src/lib/useCountUp.ts` 신규 — `useCountUp(target)`(0→
    target, 값 크기별 800/1000/1200ms 차등, easeOutCubic, 정적 집계 화면이라 마운트
    1회만 재생)과 `useMotionReveal()`(막대 0%→실제% CSS transition 트리거용) 두 훅.
    `prefers-reduced-motion`이면 초기 state부터 바로 최종값/최종상태(리렌더 없이).
    S13/S14(`src/app/m/stats/StatsView.tsx`)의 큰 숫자 카드(총근무일/총근무시간/연차/
    연간 통계 전부)와 막대(주별/월별)에 적용 — `MobileHorizontalBarRow`/
    `MobileVerticalBarChart`(StatCard.tsx, S13/S14 전용 컴포넌트라 안전하게 직접
    `transition-[width] duration-[900ms] ease-out` 추가)의 채움 div만 수정,
    S08/S09/S10에서도 같이 쓰는 `MobileSummaryRow`/`MobileInfoRow` 자체는 안 건드리고
    StatsView가 이미 애니메이션된 숫자를 문자열로 만들어 그대로 넘기는 방식이라 다른
    화면엔 영향 없음.
  - **라이브 검증**: S03 `.stagger-item` `animationDelay` 4개 전부 0/70/140/210ms 확인,
    A01(임시 테스트 관리자 계정으로 확인 — 이동석 계정 미사용) 3개 전부 0/70/140ms
    확인+스크린샷으로 레이아웃 회귀 없음 확인. S13 실데이터(9시간 근무 1건 임시 시드)로
    카운트업이 0→3h(80ms)→9h(480ms, 실제값에 정확히 도달) 진행되는 것, 막대 width가
    실제 퍼센트(22.5%)로 정확히 채워지는 것 확인. `reduced_motion="reduce"` 브라우저
    컨텍스트에서 스태거 opacity 전부 `1`(애니메이션 없이 즉시 최종상태), 통계 숫자도
    50ms 만에 이미 최종값인 것 확인. 테스트 계정/시드 데이터 전부 정리, 이동석 레코드
    미접촉 재확인. `next build` 클린, 프로덕션 배포 완료.
  - **확산 여부**: 이번엔 파일럿 3개 화면(S03/A01/S13·S14)만 적용 — 나머지 31개
    화면 확산은 CD 확인 후 별도 진행.
- **모션 확산 그룹1(A: S04~S07): 완료(2026-07-20).** S03과 동일 파일(`src/app/m/
  page.tsx`)의 `HomeContent` 함수 안 다른 분기라 구조가 완전히 같음을 먼저 확인 —
  `.stagger-item` 그대로 재사용, 4개 상태(working/out/field/done) 전부 섹션 3개씩
  0/70/140ms로 적용. 라이브 검증: 4개 상태 전부 실측 delay 정확, 스크린샷 레이아웃
  정상. **GPS 임시 설정(서울시청, B-1/B-2와 동일 방식, 사용자 승인 후 진행) →
  "외출하기" 클릭 → 정상적으로 "외출중" 상태 전환까지 성공 경로 확인**(스태거
  변경이 클릭 핸들러/액션 로직을 전혀 안 건드렸다는 것 실증) → GPS 즉시 null 복원,
  재조회로 복원 확인. `next build` 클린, 프로덕션 배포 완료.
- **모션 확산 그룹2(A: S08~S16): 완료(2026-07-20).** 화면별 섹션 구조 판단 결과
  S08(3)/S09(2)/S10(3)/S11(3, 폼이지만 휴가종류·날짜+사유+신청정보·제출버튼 라벨로
  구분되는 섹션 있음)/S12(2)/S13(2, 월간)·S14(3, 연간)/S15(4) 전부 대상, **S16(비밀번호
  변경)만 "필드 3개가 하나의 폼 블록일 뿐 구분 섹션 없음"으로 제외**(임의 적용 안 하고
  이유와 함께 보고 후 확정). 헤더(`MobileSubPageHeader`/`MobileTabRootHeader`)는
  전 화면 공통으로 스태거 대상에서 제외(S03/A01 패턴 유지). 공유 컴포넌트
  (`MobileRecordCard`/`MobileSummaryRow`/`MobileTabBar` 등) 자체는 안 건드리고
  호출부(각 page.tsx)에서만 wrapper로 감싸는 원칙 유지. S12(휴가내역)는 탭 필터로
  목록 내용이 바뀌어도 컨테이너 자체가 리마운트되지 않아 애니메이션이 재생 안 되는
  구조라는 것을 `animationstart` 이벤트 카운트로 실측 확인(탭 클릭 후 새로 시작된
  애니메이션 0건). 라이브 검증: 8개 화면(S08~S13,S15,S16) 전부 `.stagger-item`
  delay 실측(S09는 그날 근태 기록 없으면 무데이터 분기라 스태거 자체가 없는 게
  정상 — 데이터 시드해서 재확인), reduced-motion 3개 화면 opacity 전부 1 확인,
  S11 실제 휴가 신청 제출→S10 반영까지 회귀 없음 확인. 테스트 데이터 전부 정리,
  이동석 레코드 미접촉. `next build` 클린, 프로덕션 배포 완료.
- **모션 확산 그룹2 재생순서 시각 검증(승인 요청): 완료(2026-07-20).** S08/S13/S14에
  5일치 실근태 데이터(45h)를 임시 시드해서 A(스태거)→B(카운트업/그래프) 순서를
  화면 녹화(Playwright `record_video_dir`)+정밀 연속 스크린샷(0/60/150/300/500/800/
  1200ms)으로 확인. S13: 60ms에 첫 섹션은 이미 카운트업 중(1일·12h)인데 둘째 섹션
  (delay 70ms)은 아직 흐릿 → 150ms엔 둘 다 보이고 숫자 계속 진행(3일·26h) → 최종
  5일·45h 정확히 수렴. S14: 탭 전환 시에도 같은 패턴 재현, 최종 45h·15/0/15로
  정확히 도달. 녹화 영상 3개를 base64 인라인 HTML Artifact로 정리해서 CD에게 전달
  (사용자가 직접 영상 재생 확인 가능 — 이 방식은 재사용 가능한 패턴으로 기록).
  검증 후 시드 데이터 전부 삭제, 재조회로 삭제 확인(`[]`), 이동석 레코드 미접촉.
- **모션 확산 그룹3(A: A02~A15): 완료(2026-07-20).** A01과 같은
  "필터/검색행 + 테이블" 레이아웃을 쓰는 화면(A02/A06/A07/A08)은 패턴 그대로
  재사용(2~3섹션). 라벨로 구분되는 섹션이 있는 화면(A04 기본정보/근무설정/버튼행 3개,
  A12 관리자계정/공휴일API 2개)도 개별 판단해서 포함. **A03(직원추가)은 라벨 구분
  섹션 없는 단일 폼이라 제외**(S02/S16과 동일 판단 기준 적용). **A11(근무설정)은
  탭 3개 구조가 서로 달라 부분 적용** — 인증설정(IP/GPS) 탭만 구분 섹션(IP화이트리스트/
  GPS설정) 있어 스태거 적용, 기본근무·휴가정책 탭은 라벨 없는 평면 폼이라 제외.
  테이블 중심 화면은 행 개별이 아니라 **테이블 전체를 섹션 하나**로 처리(행 많을 때
  개별 애니메이션이 산만해질 위험 배제). 라이브 검증: 임시 관리자 테스트 계정으로
  7개 화면(A02/A04/A06/A07/A08/A11-인증탭/A12) 전부 delay 실측 정확, A11 기본탭은
  0건(의도대로 제외) 확인, 스크린샷으로 레이아웃 회귀 없음 확인. 테스트 계정 정리,
  이동석 레코드 미접촉. `next build` 클린, 프로덕션 배포 완료.
- **그룹3 A05/A09/A10/A13/A14/A15 조사 누락 정정(2026-07-20, 사용자 지적으로 발견).**
  그룹3 조사 범위가 `find`로 찾은 `page.tsx` 9개 파일에만 한정돼 있어서, A01~A15
  전체를 대조하지 않아 6개 화면이 조사 자체에서 빠져 있었음 — Figma 프레임 이름
  전수 대조로 확인:
  - **A15(초기화 완료, 모달)**: 코드에 **아예 구현이 없음**(모달 컴포넌트 grep 0건) —
    적용할 대상 자체가 없어서 "제외"가 아니라 "해당 없음".
  - **A05(퇴사처리 확인, 모달)**: A04 "퇴사처리" 버튼이 `/employees/[id]/terminate`로
    링크돼 있는데 그 라우트에 `page.tsx`가 없음 — **죽은 링크(기존부터 있던 버그,
    이번 모션 작업과 무관하게 발견됨, 별도 수정 필요)**.
  - **A13(관리자 로그인, `/login`)/A14(비밀번호 재설정, `/reset-password`)**: 둘 다
    존재하지만 조사에서 누락됐었음 — 뒤늦게 확인한 결과 둘 다 A03과 같은 "라벨 구분
    섹션 없는 단일 폼"이라 기준대로였다면 어차피 제외 대상이었음(결과는 안 바뀜,
    조사 과정에서 명시적으로 다루지 않은 게 문제).
  - **A09/A10/A11 라벨링 오류**: `src/app/(admin)/settings/work/WorkSettingsTabs.tsx`의
    탭 3개를 전부 "A11"로 뭉뚱그려 불렀는데, Figma 실제 번호는 A09=기본근무설정 탭,
    A10=인증설정 탭(Figma 프레임 이름 자체가 "A11"로 오표기돼 있어서 헷갈림 유발),
    A11=휴가정책 탭(관리자수동계산/법정계산 2개 상태 변형). **코드 커버리지 자체는
    이미 3개 탭 전부 정확히 처리(인증탭 적용, 기본·휴가정책탭 제외)돼 있어서 재작업
    불필요 — 화면 번호 라벨만 정정.**
- **A05(퇴사처리 확인 모달) 죽은 링크 수정: 완료(2026-07-20).** 위 그룹3 조사 누락
  정정에서 발견한 버그(A04 "퇴사처리" 버튼이 존재하지 않는 `/employees/[id]/terminate`
  라우트로 링크돼 있던 것)를 CD 지시로 바로 수정.
  - **원래 의도 확인**: Figma node `118:2430`("A05 — 퇴사처리 확인 (모달)")을
    `get_design_context`로 재조회한 결과, A05는 애초에 별도 페이지가 아니라
    **클라이언트 확인 모달**로 설계돼 있었음(다크 오버레이 + 흰 카드 + 초록 체크
    아이콘 + "OO 직원을 퇴사 처리합니다 / 근태 데이터는 3년간 보존됩니다" 문구 +
    "취소"/"퇴사처리" 버튼 2개, `NewEmployeeForm.tsx`의 "재입사 확인" 다이얼로그와
    동일한 패턴). `terminateEmployee(employeeId)` 서버 액션 자체는
    `src/app/(admin)/employees/actions.ts:184`에 이미 완성돼 있었음 — 버튼만
    모달 대신 존재하지 않는 라우트로 잘못 연결돼 있던 상태.
  - **경위 추정**: `find`로 `/employees/[id]/terminate` 하위에 `page.tsx`가 전혀
    없는 것 확인 — 리팩토링 중 경로가 바뀐 흔적(다른 이름의 대체 라우트 등)은
    없어서, A04를 처음 구현할 때 모달을 실제로 만들지 않고 `href`만 임시로
    박아둔 미완성 스텁이었을 가능성이 높음(확정 아님, 커밋 이력으로 재확인은
    안 함).
  - **수정**: `src/components/admin/TerminateButton.tsx` 신규 — Figma 확인 모달을
    `NewEmployeeForm.tsx`의 재입사 확인 다이얼로그 패턴 그대로 구현, `src/app/
    (admin)/employees/[id]/page.tsx`의 죽은 `<Button href=".../terminate">`를
    `<TerminateButton employeeName={...} terminateAction={terminateEmployee.bind(null, employee.id)} />`로
    교체.
  - **라이브 검증 중 발견 + 수정한 2차 버그(중첩 `<form>`)**: 최초 구현에서
    모달의 확인/취소 버튼을 감싼 `<form action={terminateAction}>`을 그대로
    뒀더니, A04 페이지 전체가 이미 `<form action={updateEmployeeAuthMethod}>`로
    감싸져 있어서(저장 버튼용) **`<form>` 안에 `<form>`이 중첩**되는 상태였음.
    HTML 자체가 폼 중첩을 허용하지 않아 브라우저가 제출을 깨뜨리고, React가
    "A React form was unexpectedly submitted" 경고를 던지며 실제로는
    `terminateEmployee`가 전혀 실행되지 않았음(Playwright로 신규 테스트
    직원의 "퇴사처리" 확정 버튼을 클릭해도 DB `employment_status`가 `active`
    그대로인 것으로 처음 발견 — 스크린샷/모달 노출까지는 정상이라 육안으로는
    안 보이는 버그였음). `createPortal`로 모달 전체를 `document.body`에
    렌더링해 실제 DOM 상 바깥 form의 자식이 되지 않도록 수정.
  - **라이브 재검증(로컬)**: 완전히 새로운 합성 테스트 직원("A05테스트직원",
    `employment_status='active'`)과 임시 관리자 계정을 신규 생성 → Playwright로
    로그인 → 해당 직원 A04 상세 페이지 이동 → "퇴사처리" 버튼 클릭 → 모달 노출
    (직원명/보존안내 문구 정확히 포함) 확인 → 모달 내 "퇴사처리" 확정 버튼 클릭 →
    `/employees` 리다이렉트 확인 → DB 재조회로 `employment_status='terminated'`,
    `termination_date`가 당일 날짜로 정확히 설정된 것까지 확인. 수정 전(중첩
    form 상태)에는 같은 시나리오에서 리다이렉트도 DB 변경도 전혀 안 일어나는
    것을 먼저 재현해서 버그를 확정한 뒤 수정 → 재검증한 순서.
  - **정리**: 테스트 직원 row, 테스트 관리자의 `admin_profiles`+`auth.users` 전부
    삭제, 재조회로 삭제 확인. "이동석" 레코드 미접촉 재확인.
  - `npx tsc --noEmit` / `npx eslint` 둘 다 클린.
  - **정정(2026-07-20, 파비콘 작업 중 우연히 발견)**: 위 "경위 추정"이 틀렸었다.
    `find`가 `"src/app/(admin)/employees/[id]"` 안쪽만 검색해서 놓쳤을 뿐,
    `(admin)` 라우트 그룹 **밖**의 `src/app/employees/[id]/terminate/page.tsx`에
    이미 `terminateEmployee`와 정확히 연결된 정상 동작 페이지가 존재했다(라우트
    그룹은 URL에 영향 없으므로 두 트리가 같은 `/employees/[id]/...` URL
    네임스페이스를 공유함). 즉 원래 버튼의 `href`는 죽은 링크가 아니라 처음부터
    유효한 라우트를 가리키고 있었음 — "미완성 스텁이었을 가능성" 추정이 틀렸고,
    실제로는 기능하는 페이지가 이미 있었는데 못 찾아서 중복 구현을 한 것.
    CD 확인 후 기존 라우트 페이지(`src/app/employees/` 디렉토리 전체, 그 안엔
    이 파일 하나뿐이었음)를 삭제하고 `TerminateButton` 모달 쪽으로 통일 —
    `src/app/screens/page.tsx`(dev 전용 화면 인덱스)의 A05 항목도 삭제된 라우트를
    가리키고 있어서 `/employees/1`(A04, 모달이 실제로 트리거되는 곳)로 같이 수정.
    삭제 후 재검증: `.next` 캐시가 삭제된 라우트를 참조해 `tsc` 에러가 나서
    `rm -rf .next && next build`로 클린 재빌드(라우트 목록에서 `/employees/[id]/
    terminate` 사라짐 확인) → 완전히 새로운 합성 테스트 직원+관리자 계정으로
    A04→모달→확정→DB `terminated` 반영까지 재검증 → 삭제된 라우트 직접 접근 시
    404 확인 → 테스트 데이터 정리, "이동석" 미접촉 재확인. `tsc`/`eslint` 클린,
    프로덕션 배포 완료.
- **모션 확산 A(스태거) 전체 완료** — 파일럿(S03/A01) + 그룹1(S04~S07) +
  그룹2(S08~S16, S16 제외) + 그룹3(A02~A14 중 라벨구분 섹션 있는 화면, A03/A13/A14/A09/
  기본·휴가정책탭 제외, A05/A15는 미구현이라 해당 없음) 전부 배포됨.
  **B(카운트업/그래프)는 파일럿(S13/S14)만 적용된 상태 — 그룹4(S08/S09)·
  그룹5(S10~S12) 확산은 아직 미착수.**
- **실배포 진행 중** — `bywork-teal.vercel.app` 배포 완료, 비밀번호 재설정 이메일
  체인(Site URL/템플릿) 수정 완료, IP 화이트리스트 실환경 검증 완료(위 항목들 참고).
  남은 CD 액션: `bywork.by-bk.com` 커스텀 도메인 DNS 연결(연결 시 Supabase
  Redirect URLs에도 추가 필요, 위 각주 참고), 공휴일 API 키 재발급, `ip_whitelist`의
  임시 등록 IP 운영 정책 재검토, iOS/Android 실기기 GPS 검증. 그룹F(WebAuthn)는
  이 실배포 이후 우선순위로 대기.
- **S15(`/m/my`) 프로필 실데이터 연동(이름/이메일/입사일): 완료(2026-07-20).**
  `getCurrentEmployee()`에 `hireDate` 필드 추가(`src/lib/employeeAccount.ts`), `src/app/m/
  my/page.tsx`를 async 서버 컴포넌트로 바꿔 이름/이메일/입사일(상단 프로필 + "내 정보"
  목록 두 군데 다) 실데이터로 교체, 날짜 포맷은 기존 `formatDateDot`(`src/lib/
  employees.ts`) 재사용. 라이브 검증(로컬, 새 테스트 계정 "모바일테스트"로 로그인):
  아바타 이니셜/이름/이메일/입사일 전부 로그인한 계정 기준으로 정확히 표시되는 것
  스크린샷 확인, 프로덕션 배포 완료. **근무시간/근무지는 표시 정책 미정 — 하드코딩
  유지 중**(company_settings 근무시간 정책, ip_whitelist 기반 근무지 표시 방식이
  둘 다 아직 정해지지 않음, 정책 확정되면 별도 작업으로 착수).
- **S01~S16 전체 하드코딩 잔존 데이터 전수조사: 완료(2026-07-20).** "onClick/fetch/
  supabase import 0건" 전수조사(그룹A 착수 전)와 반대 방향으로, 각 `src/app/m/*/
  page.tsx`마다 DB 조회 함수 호출 여부 → 없으면 JSX 리터럴 하드코딩 여부를 확인.
  결과: 진짜 하드코딩 3건(S03 "정규 출근 시간" — 아래서 해결, S09 "SSID 자동체크"—
  스키마 부재로 기존 문서화됨, S15 근무시간/근무지 — 정책 미정으로 기존 문서화됨),
  의도적 상수 2건(S13/S14 목표 근무시간 기준선 40h/120h — `employeeAttendanceStats.ts`의
  `WEEKLY_TARGET_HOURS`/`MONTHLY_TARGET_HOURS`, 분자인 실제 근무시간은 실데이터라
  하드코딩과 성격이 다름). "지각" 지표는 하드코딩이 아니라 S08 범례/S13 카드에서
  아예 제거된 상태(그룹B/D 확인).
- **S03(홈, 출근전 상태) "09:00" 정규 출근 시간 하드코딩: 해결 완료(2026-07-20).**
  위 전수조사에서 신규 발견 — 어느 그룹 리포트에도 "범위 밖"으로 명시된 적 없는 순수
  누락이었음(`company_settings.standard_start_time` 컬럼은 이미 있었는데 모바일 쪽
  어디서도 조회한 적이 없었음, grep 0건). `getCompanySettings()`는 `assertAdminRequest()`로
  관리자 세션만 허용해서 모바일(직원 세션)에서 못 쓰길래, 관리자 게이트 없는
  `getStandardStartTime()`을 `src/lib/companySettings.ts`에 신규 추가(attendanceAuth.ts의
  `checkGps`와 같은 패턴 — 호출부가 이미 `getCurrentEmployee()`로 인증 확인하므로 여기서
  중복 검사 안 함). `src/app/m/page.tsx`의 "출근전" 상태 2곳(정상 분기 + 데이터 정합성
  방어용 폴백 분기) 전부 교체. 라이브 검증: `company_settings.standard_start_time`을
  `10:30:00`으로 바꾸면 S03 화면에 즉시 `10:30`으로 반영, `09:00:00`으로 복원하면 다시
  `09:00`으로 정확히 돌아오는 것까지 스크린샷 포함 왕복 확인(DB `HH:MM:SS` → 화면
  `HH:MM` 트림 포맷도 일치 확인). 프로덕션 배포 완료.
- "지각" 지표(S08 범례, S13 통계)는 여전히 미구현 — `company_settings.standard_
  start_time`은 있지만 유예시간 정책이 스키마에 없어 그룹B/D 모두 범위에서 제외함.
  유예시간 정책을 어디에 둘지(새 컬럼 vs 고정값) 결정되면 별도 작업으로 착수 가능.
- 그룹F(WebAuthn 생체인증, S01/S15): A~E 그룹 이후 우선순위. `BIOMETRIC_LOGIN_ENABLED` 플래그
  참고.
- **E02~E07(에러 화면 실제 로직 연결)은 여전히 미착수** — E01만 아래에서 수정 완료:
  E02(GPS 거부, 이미 인라인 로직 있음 — 교체 여부 판단 필요),
  E03(세션 만료→`proxy.ts`, 지금은 메시지 없이 조용히 리다이렉트),
  E04(퇴사자 로그인, 이미 인라인 로직 있음 — 교체 여부 판단 필요, 이메일 하드코딩 각주 위 참고),
  E05(네트워크 오류, 지금은 서버 액션 호출부에 try/catch 자체가 없음),
  E06(404→`not-found.tsx` 없음), E07(500→`error.tsx`/`global-error.tsx` 없음).
