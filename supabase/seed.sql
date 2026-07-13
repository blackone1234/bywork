-- 테스트용 더미 데이터 — attendance_records
-- 직원용 앱에 실제 체크인 기능이 아직 없어서, A07/A08 화면을 눈으로 확인할 데이터가 없다.
-- 이 프로젝트에 등록된 첫 번째 직원 기준으로 최근 며칠치 근태 기록을 넣는다.
-- 운영 데이터가 아니므로 마이그레이션(supabase/migrations/)에는 넣지 않았다 — 필요할 때만
-- SQL Editor에서 수동으로 실행할 것.

insert into attendance_records (employee_id, work_date, check_in_at, check_out_at, status, note)
select
  (select id from employees order by hire_date limit 1),
  work_date,
  check_in_at,
  check_out_at,
  status,
  note
from (
  values
    ('2026-07-13'::date, '2026-07-13 09:03:00+09'::timestamptz, '2026-07-13 18:10:00+09'::timestamptz, 'present'::attendance_status, null::text),
    ('2026-07-10'::date, '2026-07-10 09:00:00+09'::timestamptz, '2026-07-10 18:00:00+09'::timestamptz, 'present'::attendance_status, null::text),
    ('2026-07-09'::date, '2026-07-09 09:12:00+09'::timestamptz, '2026-07-09 18:05:00+09'::timestamptz, 'present'::attendance_status, null::text),
    ('2026-07-08'::date, '2026-07-08 09:00:00+09'::timestamptz, '2026-07-08 17:30:00+09'::timestamptz, 'remote'::attendance_status, null::text),
    ('2026-07-07'::date, null::timestamptz, null::timestamptz, 'on_leave'::attendance_status, null::text),
    ('2026-07-06'::date, null::timestamptz, null::timestamptz, 'absent'::attendance_status, null::text)
) as seed(work_date, check_in_at, check_out_at, status, note)
on conflict (employee_id, work_date) do nothing;
