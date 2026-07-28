-- 휴가 신청 취소 기능 — CD와 사전 확정한 설계:
--   1) 대기중(pending) 취소 = 신청 철회, 연차 차감이 없었으므로 복원 불필요.
--   2) 승인(approved) 취소 = 이미 차감된 연차를 복원해야 함.
--   3) 반려(rejected)와는 다른 개념이라 별도 상태값 'cancelled'로 분리(반려=관리자가
--      거부, 취소=신청자 본인 또는 관리자가 철회).
--   4) 취소 가능 시점: "연차 시작일 전날의 회사 표준 퇴근시각까지"만 직원 본인 취소 허용.
--      관리자는 이 컷오프 예외(운영상 사후 정정 필요할 수 있어 언제든 취소 가능) — CD 확정.
--   5) 컷오프 기준이 나중에 바뀔 수 있다는 전제 하에, 그 판단 로직을 leave_cancel_deadline()
--      함수 하나에만 담아서 나중에 CREATE OR REPLACE 한 곳만 바꾸면 되게 한다(하드코딩 금지 —
--      getStandardStartTime() 패턴과 동일한 이유).
--   6) 근태 강제수정 때 만든 attendance_record_edits와 동일한 감사로그 패턴을 재사용.

-- ============================================================
-- 1) 상태값 추가
-- ============================================================
-- IF NOT EXISTS로 재실행 안전성 확보. 주의: 이 문장은 반드시 이 트랜잭션에서 새로
-- 추가한 값을 "같은 트랜잭션 안에서 실제 DML로 사용"하지만 않으면 안전하다 — 아래
-- 함수 정의들은 'cancelled' 리터럴을 함수 본문(텍스트)에 담을 뿐 이 마이그레이션
-- 실행 시점에 그 값으로 실제 UPDATE/INSERT를 실행하지는 않으므로 문제 없음.
alter type leave_request_status add value if not exists 'cancelled';

-- ============================================================
-- 2) 취소 감사로그 — attendance_record_edits와 동일 패턴
-- ============================================================
-- 행위자가 직원 본인일 수도, 관리자일 수도 있어 attendance_record_edits(관리자 전용)와
-- 달리 두 FK 중 정확히 하나만 채워지는 구조로 분리한다.
create table leave_request_cancellations (
  id uuid primary key default gen_random_uuid(),
  leave_request_id uuid not null references leave_requests (id) on delete cascade,
  cancelled_by_employee_id uuid references employees (id),
  cancelled_by_admin_id uuid references admin_profiles (id),
  cancelled_at timestamptz not null default now(),
  previous_status leave_request_status not null,
  days_restored numeric(4, 1) not null default 0,
  reason text,
  constraint leave_request_cancellations_actor_check
    check (num_nonnulls(cancelled_by_employee_id, cancelled_by_admin_id) = 1)
);

create index leave_request_cancellations_request_id_idx
  on leave_request_cancellations (leave_request_id);

alter table leave_request_cancellations enable row level security;

-- ============================================================
-- 3) 취소 마감시각 계산 — "규칙이 바뀔 수 있다"는 전제로 이 함수 하나에만 로직을 담는다.
-- ============================================================
-- 현재 규칙: 연차 시작일 전날, 회사 표준 퇴근시각(company_settings.standard_end_time)까지.
-- 나중에 규칙이 바뀌면(예: "이틀 전"으로, 또는 "출근시각 기준"으로) 이 함수 본문만
-- CREATE OR REPLACE 하면 된다 — 호출부(cancel_leave_request RPC, 아래)는 이 함수의
-- 시그니처(start_date를 받아 timestamptz 하나를 반환)만 알면 되고 내부 규칙을 몰라도 된다.
create or replace function leave_cancel_deadline(p_start_date date)
returns timestamptz
language sql
stable
as $$
  select ((p_start_date - interval '1 day')::date + cs.standard_end_time) at time zone 'Asia/Seoul'
  from company_settings cs
  where cs.id = 1;
$$;

-- ============================================================
-- 4) 취소 처리 함수 — approve/reject_leave_request와 동일한 동시성 보호(for update)
-- ============================================================
-- p_actor_employee_id/p_actor_admin_id 중 정확히 하나만 넘긴다(호출부 서버 액션에서
-- 세션에 맞는 쪽만 채움). 관리자 취소는 p_bypass_deadline=true로 컷오프를 예외 처리한다
-- (호출부에서 관리자 세션이면 항상 true로 넘김 — CD 확정: "관리자 취소는 언제든 가능").
create or replace function cancel_leave_request(
  p_request_id uuid,
  p_actor_employee_id uuid default null,
  p_actor_admin_id uuid default null,
  p_reason text default null,
  p_bypass_deadline boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id uuid;
  v_start_date date;
  v_days numeric;
  v_status leave_request_status;
  v_deadline timestamptz;
  v_days_restored numeric(4, 1) := 0;
begin
  if num_nonnulls(p_actor_employee_id, p_actor_admin_id) <> 1 then
    raise exception 'exactly one of p_actor_employee_id/p_actor_admin_id must be set';
  end if;

  select employee_id, start_date, days, status
    into v_employee_id, v_start_date, v_days, v_status
    from leave_requests
    where id = p_request_id
    for update;

  if not found then
    raise exception 'leave_request % not found', p_request_id;
  end if;

  if v_status not in ('pending', 'approved') then
    raise exception 'already_finalized';
  end if;

  -- 본인 취소일 때만 자기 요청인지 확인(관리자는 전 직원 대상이라 이 검사 제외).
  if p_actor_employee_id is not null and p_actor_employee_id <> v_employee_id then
    raise exception 'not_owner';
  end if;

  if not p_bypass_deadline then
    v_deadline := leave_cancel_deadline(v_start_date);
    if now() > v_deadline then
      raise exception 'cancel_deadline_passed';
    end if;
  end if;

  if v_status = 'approved' then
    update employees set used_leave_days = used_leave_days - v_days where id = v_employee_id;
    v_days_restored := v_days;
  end if;

  update leave_requests set status = 'cancelled' where id = p_request_id;

  insert into leave_request_cancellations (
    leave_request_id, cancelled_by_employee_id, cancelled_by_admin_id,
    previous_status, days_restored, reason
  ) values (
    p_request_id, p_actor_employee_id, p_actor_admin_id,
    v_status, v_days_restored, p_reason
  );
end;
$$;

-- ============================================================
-- 5) GRANT (하우스 룰 — CLAUDE.md 지시, RLS enable과 항상 페어링)
-- ============================================================
grant select, insert on leave_request_cancellations to service_role;
grant execute on function leave_cancel_deadline(date) to service_role;
grant execute on function cancel_leave_request(uuid, uuid, uuid, text, boolean) to service_role;
