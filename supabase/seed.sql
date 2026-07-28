-- 테스트용 더미 데이터 — attendance_records + attendance_events
-- 직원용 앱에 실제 체크인 기능이 아직 없어서, A07/A08 화면을 눈으로 확인할 데이터가 없다.
-- 이 프로젝트에 등록된 첫 번째 직원 기준으로 최근 며칠치 근태 기록을 넣는다.
-- 운영 데이터가 아니므로 마이그레이션(supabase/migrations/)에는 넣지 않았다 — 필요할 때만
-- SQL Editor에서 수동으로 실행할 것.
--
-- attendance_events 도입(20260716000000_attendance_events.sql) 이후로는 attendance_records에
-- check_in_at/check_out_at 컬럼이 없다 — 대신 attendance_records를 먼저 만들고, 출퇴근
-- 시각은 attendance_events에 이벤트로 넣는다(attendance_records_with_times VIEW가 여기서
-- 파생시킨다).

with seed_employee as (
  select id from employees order by hire_date limit 1
),
inserted_records as (
  insert into attendance_records (employee_id, work_date, status, note)
  select
    (select id from seed_employee),
    work_date,
    status,
    note
  from (
    values
      ('2026-07-13'::date, 'present'::attendance_status, null::text),
      ('2026-07-10'::date, 'present'::attendance_status, null::text),
      ('2026-07-09'::date, 'present'::attendance_status, null::text),
      ('2026-07-08'::date, 'remote'::attendance_status, null::text),
      ('2026-07-07'::date, 'on_leave'::attendance_status, null::text),
      ('2026-07-06'::date, 'absent'::attendance_status, null::text)
  ) as seed(work_date, status, note)
  on conflict (employee_id, work_date) do nothing
  returning id, work_date
)
insert into attendance_events (attendance_record_id, employee_id, event_type, occurred_at, check_in_method)
select
  ir.id,
  (select id from seed_employee),
  events.event_type,
  events.occurred_at,
  'manual'
from inserted_records ir
join (
  values
    ('2026-07-13'::date, 'check_in'::attendance_event_type, '2026-07-13 09:03:00+09'::timestamptz),
    ('2026-07-13'::date, 'check_out'::attendance_event_type, '2026-07-13 18:10:00+09'::timestamptz),
    ('2026-07-10'::date, 'check_in'::attendance_event_type, '2026-07-10 09:00:00+09'::timestamptz),
    ('2026-07-10'::date, 'check_out'::attendance_event_type, '2026-07-10 18:00:00+09'::timestamptz),
    ('2026-07-09'::date, 'check_in'::attendance_event_type, '2026-07-09 09:12:00+09'::timestamptz),
    ('2026-07-09'::date, 'check_out'::attendance_event_type, '2026-07-09 18:05:00+09'::timestamptz),
    ('2026-07-08'::date, 'check_in'::attendance_event_type, '2026-07-08 09:00:00+09'::timestamptz),
    ('2026-07-08'::date, 'check_out'::attendance_event_type, '2026-07-08 17:30:00+09'::timestamptz)
) as events(work_date, event_type, occurred_at)
  on events.work_date = ir.work_date;
