-- IP/GPS 인증 실패 시 사유 입력으로 예외 기록을 남기고, 관리자가 확인 후 확정하는 흐름.
-- check_in_method는 이미 'manual' 값을 가지고 있다(20260716000000 마이그레이션 주석에
-- "향후 관리자 수동승인 폴백용으로 예약"이라고 명시돼 있었음, 지금까지 코드에서 실제로
-- 쓰인 적은 없음) — 이번 기능이 정확히 그 용도라 그대로 재사용한다.
--
-- review_status를 check_in_method와 별도 컬럼으로 분리하는 이유: check_in_method는
-- "어떻게 인증됐는지"(수단), review_status는 "승인 워크플로우 진행 상태"로 서로 다른
-- 축이라, 하나의 컬럼(예: check_in_method='manual_pending')에 욱여넣으면 나중에
-- "수단=manual AND 상태=pending" 같은 조회가 지저분해진다.

create type attendance_event_review_status as enum ('pending_review', 'confirmed');

alter table attendance_events
  add column manual_reason text,
  -- 기본값을 confirmed로 둬서 기존 ip/gps/legacy_backfill 이벤트는 백필 없이 자동으로
  -- 전부 확정 상태가 된다 — manual 이벤트 insert 시점에만 명시적으로 pending_review를 넣는다.
  add column review_status attendance_event_review_status not null default 'confirmed',
  -- leave_requests의 processed_by/processed_at과 동일한 패턴 — 누가 언제 확인완료
  -- 눌렀는지 감사 추적용.
  add column reviewed_by uuid references admin_profiles (id),
  add column reviewed_at timestamptz,
  -- 사유 없이 manual 이벤트가 DB에 들어가는 걸 원천 차단 — 앱단 얼럿과는 별개의 방어선.
  add constraint attendance_events_manual_reason_required
    check (check_in_method <> 'manual' or manual_reason is not null);

-- A07 "검토필요 (N)" 카운트/필터, A08 목록이 이 조건을 자주 탈 것이므로 partial index.
create index attendance_events_pending_review_idx
  on attendance_events (occurred_at)
  where review_status = 'pending_review';

-- attendance_records_with_times VIEW가 검토대기 이벤트의 시각까지 확정된 근태처럼
-- A07/A08/통계에 새어나가지 않도록, 두 서브쿼리에 review_status='confirmed' 필터를
-- 추가해서 재정의한다("확정된 기록만 통계에 반영" 요구사항을 이 한 곳에서 해결).
create or replace view attendance_records_with_times as
select
  ar.*,
  (
    select min(ae.occurred_at)
    from attendance_events ae
    where ae.attendance_record_id = ar.id
      and ae.event_type = 'check_in'
      and ae.review_status = 'confirmed'
  ) as check_in_at,
  (
    select max(ae.occurred_at)
    from attendance_events ae
    where ae.attendance_record_id = ar.id
      and ae.event_type = 'check_out'
      and ae.review_status = 'confirmed'
  ) as check_out_at
from attendance_records ar;

grant select on attendance_records_with_times to service_role;
