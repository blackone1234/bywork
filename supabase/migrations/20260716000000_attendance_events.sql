-- S03~S07(모바일 홈) 출근/외출/외근/복귀/퇴근 5개 버튼을 실제로 기록하려면 하루에 여러 번
-- 오가는 이벤트를 남겨야 하는데, attendance_records의 check_in_at/check_out_at 딱 2개
-- 컬럼으로는 "외출→복귀" 같은 반복 이벤트를 표현할 수 없었다(같은 날 여러 번 나갔다
-- 들어와도 시각을 하나만 저장 가능). attendance_events를 이벤트 로그 테이블로 신설하고,
-- attendance_records는 "그 날의 상태를 담는 컨테이너"로만 남긴다.
--
-- check_in_at/check_out_at는 완전히 제거하고, attendance_records_with_times VIEW로
-- attendance_events에서 매번 파생시킨다(진실 원천을 하나로 유지 — 별도 캐시 컬럼을 두면
-- 갱신을 빠뜨렸을 때 조용히 어긋나는 버그가 생기기 쉽다는 게 이 프로젝트에서 반복적으로
-- 경계해온 패턴이다).

create type attendance_event_type as enum (
  'check_in',        -- 출근
  'go_out_personal', -- 외출 시작 (S05 — 개인 사유)
  'go_out_business', -- 외근 시작 (S06 — 업무 사유. design.md: S06은 "출근/외출/순 근무"
                      -- 3분할 정보 행이 따로 있는, S05와 구분되는 별개 홈 상태)
  'return',          -- 복귀
  'check_out'        -- 퇴근
);

create table attendance_events (
  id uuid primary key default gen_random_uuid(),
  attendance_record_id uuid not null references attendance_records (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  event_type attendance_event_type not null,
  occurred_at timestamptz not null default now(),
  check_in_method check_in_method not null,
  ip inet,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  note text,
  created_at timestamptz not null default now()
);

create index attendance_events_employee_id_idx on attendance_events (employee_id);
create index attendance_events_occurred_at_idx on attendance_events (occurred_at);

-- attendance_records_with_times VIEW가 행마다 (attendance_record_id, event_type)로
-- min/max(occurred_at)을 두 번씩 구한다 — record_id 단독 인덱스만으로는 event_type 필터를
-- 못 타서 매번 해당 레코드의 이벤트를 전부 훑게 된다. occurred_at까지 포함해 인덱스만으로
-- min/max를 바로 얻도록(index-only scan) 3컬럼 복합 인덱스로 대체한다.
create index attendance_events_record_type_occurred_idx
  on attendance_events (attendance_record_id, event_type, occurred_at);

alter table attendance_events enable row level security;

-- 기존 3개 테이블과 동일한 이유로 RLS enable과 별개로 service_role GRANT가 필요하다
-- (CLAUDE.md에 명시된 이 프로젝트의 확립된 규칙 — RLS만 켜고 GRANT를 빠뜨리면 service_role
-- 키로도 permission denied가 난다).
grant select, insert, update, delete on attendance_events to service_role;

-- drop column으로 check_in_at/check_out_at가 사라지기 전에, 기존에 이미 값이 들어있던
-- 행(예: seed.sql로 넣은 더미 근태 데이터)을 attendance_events로 백필한다 — 안 그러면
-- 과거 출퇴근 시각이 attendance_events에도 남지 않고 그냥 유실된다. IP/GPS 인증 없이
-- 들어간 이력 데이터라 인증방식을 알 수 없어 check_in_method는 'legacy_backfill'로 채운다
-- ('manual'은 향후 관리자 수동승인 폴백용으로 남겨둔다 — 20260715230000 마이그레이션
-- 참고, 이 파일 실행 전에 먼저 실행되어 있어야 한다).
insert into attendance_events (attendance_record_id, employee_id, event_type, occurred_at, check_in_method)
select id, employee_id, 'check_in', check_in_at, 'legacy_backfill'
from attendance_records
where check_in_at is not null;

insert into attendance_events (attendance_record_id, employee_id, event_type, occurred_at, check_in_method)
select id, employee_id, 'check_out', check_out_at, 'legacy_backfill'
from attendance_records
where check_out_at is not null;

-- attendance_records의 check_in_at/check_out_at와, 애초에 아무 코드도 안 쓰던
-- check_in_method/check_in_ip/check_in_latitude/check_in_longitude를 함께 제거한다 —
-- 이제 이 정보는 attendance_events에 이벤트마다 개별로 남는다(첫 출근 하나의 IP/좌표만
-- 담을 수 있던 예전 컬럼보다 더 정확하다).
alter table attendance_records
  drop column check_in_at,
  drop column check_out_at,
  drop column check_in_method,
  drop column check_in_ip,
  drop column check_in_latitude,
  drop column check_in_longitude;

-- src/lib/attendance.ts의 두 쿼리(A07/A08)가 기존과 동일한 컬럼명(check_in_at/check_out_at)
-- 으로 읽을 수 있도록 VIEW로 파생시킨다 — 두 쿼리 모두 이미 .from("attendance_records")에서
-- .from("attendance_records_with_times")로 변경 완료(나머지 로직은 그대로 재사용).
create view attendance_records_with_times as
select
  ar.*,
  (
    select min(ae.occurred_at)
    from attendance_events ae
    where ae.attendance_record_id = ar.id and ae.event_type = 'check_in'
  ) as check_in_at,
  (
    select max(ae.occurred_at)
    from attendance_events ae
    where ae.attendance_record_id = ar.id and ae.event_type = 'check_out'
  ) as check_out_at
from attendance_records ar;

grant select on attendance_records_with_times to service_role;
