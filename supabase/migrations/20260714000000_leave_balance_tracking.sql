-- A06 휴가승인: 승인 시 실제 잔여연차를 차감하려면 두 가지가 빠져 있었다.
-- 1) 이 요청이 며칠짜리인지 명시하는 값. leave_type 텍스트("반차" 등)나 date range만으로는
--    반차/공휴일 제외 같은 규칙을 안정적으로 되짚을 수 없다 — 요청 시점에 명시적으로 정해야 한다.
-- 2) 직원별 배정 연차와 이미 쓴 연차. leave_policies는 회사 전체 기본값일 뿐 개인별 잔액이 아니다.

alter table leave_requests
  add column days numeric(4, 1) not null,
  add constraint leave_requests_days_positive check (days > 0);

alter table employees
  add column annual_leave_days numeric(5, 1) not null default 15,
  add column used_leave_days numeric(5, 1) not null default 0,
  add constraint employees_used_leave_days_non_negative check (used_leave_days >= 0);

-- ============================================================
-- 승인/반려를 원자적으로 처리하는 함수.
-- REST로 "상태 UPDATE" + "잔여연차 UPDATE"를 따로 호출하면 동시에 두 관리자가 같은 요청을
-- 처리하려 할 때 이중 차감되거나 상태가 어긋날 수 있어, 행 잠금(for update)으로 감싼
-- 하나의 트랜잭션으로 묶는다.
-- ============================================================

create or replace function approve_leave_request(p_request_id uuid, p_processed_by uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id uuid;
  v_days numeric;
  v_status leave_request_status;
begin
  select employee_id, days, status
    into v_employee_id, v_days, v_status
    from leave_requests
    where id = p_request_id
    for update;

  if not found then
    raise exception 'leave_request % not found', p_request_id;
  end if;

  if v_status <> 'pending' then
    raise exception 'leave_request % is not pending (current status: %)', p_request_id, v_status;
  end if;

  update leave_requests
    set status = 'approved', processed_at = now(), processed_by = p_processed_by
    where id = p_request_id;

  update employees
    set used_leave_days = used_leave_days + v_days
    where id = v_employee_id;
end;
$$;

create or replace function reject_leave_request(p_request_id uuid, p_processed_by uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status leave_request_status;
begin
  select status
    into v_status
    from leave_requests
    where id = p_request_id
    for update;

  if not found then
    raise exception 'leave_request % not found', p_request_id;
  end if;

  if v_status <> 'pending' then
    raise exception 'leave_request % is not pending (current status: %)', p_request_id, v_status;
  end if;

  -- 반려는 연차를 소비하지 않으므로 employees.used_leave_days는 건드리지 않는다.
  update leave_requests
    set status = 'rejected', processed_at = now(), processed_by = p_processed_by
    where id = p_request_id;
end;
$$;

grant execute on function approve_leave_request(uuid, uuid) to service_role;
grant execute on function reject_leave_request(uuid, uuid) to service_role;
