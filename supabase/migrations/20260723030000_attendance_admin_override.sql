-- 관리자 근태 강제 수정. 원본 attendance_events는 그대로 두고(감사 추적 보존),
-- attendance_records에 관리자 오버라이드 컬럼을 얹는 방식으로 구현한다 —
-- employees_with_leave(연차 자동계산)와 동일한 패턴("원본 테이블은 그대로, VIEW가
-- 조회 시점에 우선순위를 정한다"). "상태"(status)는 원래도 이벤트가 아니라
-- attendance_records 자체에 직접 저장되는 값이라(체크인 시점에 present로 set 등),
-- check_in_at/check_out_at처럼 파생 컬럼이 필요 없이 그냥 UPDATE로 덮어쓴다.
-- "비고"도 이미 있는 note 컬럼을 그대로 쓴다(지금까지 앱 코드 어디서도 쓴 적 없는
-- 컬럼이었음 — attendance.ts가 이미 `row.note?.trim() || NOTE_FALLBACK[...]`로
-- 읽고 있어서 새 컬럼 없이 그대로 재사용 가능).
--
-- CD 승인 사항 2가지:
-- 1) 기록 자체가 없는 날짜도 관리자가 새로 생성할 수 있다(attendance_records upsert).
-- 2) 검토대기(pending_review) 이벤트가 있는 날짜는 오버라이드를 막고 에러로 유도한다
--    (자동 확정 처리하지 않음 — 확정은 기존 confirmAttendanceReview로만).
--
-- 전체 문을 다시 실행해도 안전하도록(idempotent) if not exists/drop-then-create를 쓴다
-- — 최초 시도에서 CREATE OR REPLACE VIEW가 "컬럼명을 바꿀 수 없다"는 에러(42P16)로
-- 실패했었다: ar.*가 새로 추가된 admin_override_* 두 컬럼까지 함께 확장되면서, 기존
-- 뷰에서 check_in_at/check_out_at이 있던 자리(컬럼 순번)에 다른 이름이 오게 돼 Postgres가
-- "이름이 바뀐 컬럼"으로 오인했다(CREATE OR REPLACE VIEW는 컬럼 개수가 늘어나는 것만
-- 허용하고, 기존 컬럼의 순서/이름은 그대로여야 한다) — DROP 후 CREATE로 바꿔서 해결.

alter table attendance_records
  add column if not exists admin_override_check_in_at timestamptz,
  add column if not exists admin_override_check_out_at timestamptz;

create table if not exists attendance_record_edits (
  id uuid primary key default gen_random_uuid(),
  attendance_record_id uuid not null references attendance_records (id) on delete cascade,
  edited_by uuid not null references admin_profiles (id),
  edited_at timestamptz not null default now(),
  before jsonb,
  after jsonb not null,
  reason text not null
);

create index if not exists attendance_record_edits_record_id_idx on attendance_record_edits (attendance_record_id);

alter table attendance_record_edits enable row level security;

-- VIEW 재정의 — 오버라이드가 있으면 그 값을, 없으면 기존 이벤트 기반 계산값을 쓴다.
drop view if exists attendance_records_with_times;

create view attendance_records_with_times as
select
  ar.*,
  coalesce(
    ar.admin_override_check_in_at,
    (
      select min(ae.occurred_at)
      from attendance_events ae
      where ae.attendance_record_id = ar.id
        and ae.event_type = 'check_in'
        and ae.review_status = 'confirmed'
    )
  ) as check_in_at,
  coalesce(
    ar.admin_override_check_out_at,
    (
      select max(ae.occurred_at)
      from attendance_events ae
      where ae.attendance_record_id = ar.id
        and ae.event_type = 'check_out'
        and ae.review_status = 'confirmed'
    )
  ) as check_out_at
from attendance_records ar;

grant select on attendance_records_with_times to service_role;

-- 생성(기록 없는 날)과 수정(기존 레코드)을 한 함수로 처리한다 — 둘 다 "이 직원의 이
-- 날짜에 이 값을 확정한다"는 같은 작업이고, 존재 여부만 다르다. pending_review
-- 이벤트가 있으면(수정 케이스에서만 가능 — 생성 케이스는 애초에 이벤트가 없음)
-- 예외를 던져서 막는다.
create or replace function edit_attendance_record(
  p_employee_id uuid,
  p_work_date date,
  p_check_in_at timestamptz,
  p_check_out_at timestamptz,
  p_status attendance_status,
  p_note text,
  p_reason text,
  p_admin_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record_id uuid;
  v_pending_count int;
  v_before jsonb;
  v_after jsonb;
begin
  select id into v_record_id
  from attendance_records
  where employee_id = p_employee_id and work_date = p_work_date
  for update;

  if v_record_id is not null then
    select count(*) into v_pending_count
    from attendance_events
    where attendance_record_id = v_record_id and review_status = 'pending_review';

    if v_pending_count > 0 then
      raise exception 'pending_review_exists';
    end if;

    select jsonb_build_object(
      'checkInAt', admin_override_check_in_at,
      'checkOutAt', admin_override_check_out_at,
      'status', status,
      'note', note
    ) into v_before
    from attendance_records
    where id = v_record_id;

    update attendance_records
    set admin_override_check_in_at = p_check_in_at,
        admin_override_check_out_at = p_check_out_at,
        status = p_status,
        note = p_note
    where id = v_record_id;
  else
    v_before := null;

    insert into attendance_records (
      employee_id, work_date, status, note,
      admin_override_check_in_at, admin_override_check_out_at
    )
    values (p_employee_id, p_work_date, p_status, p_note, p_check_in_at, p_check_out_at)
    returning id into v_record_id;
  end if;

  v_after := jsonb_build_object(
    'checkInAt', p_check_in_at,
    'checkOutAt', p_check_out_at,
    'status', p_status,
    'note', p_note
  );

  insert into attendance_record_edits (attendance_record_id, edited_by, before, after, reason)
  values (v_record_id, p_admin_id, v_before, v_after, p_reason);

  return v_record_id;
end;
$$;

-- RLS enable과 별개로 service_role GRANT를 항상 같이 포함(CLAUDE.md 하우스 룰).
grant select, insert on attendance_record_edits to service_role;
grant execute on function edit_attendance_record(
  uuid, date, timestamptz, timestamptz, attendance_status, text, text, uuid
) to service_role;
