-- byWORK 관리자 웹 — 초기 스키마
-- 근거: byWORK_관리자웹_최종개발명세서.md
-- 모든 테이블은 RLS를 활성화하고 별도 정책을 두지 않는다.
-- 클라이언트는 service_role 키를 사용하는 서버 사이드 코드(API 라우트)를 통해서만 접근한다(RLS를 우회).

-- ============================================================
-- Enums
-- ============================================================

-- A04 직원상세: 직원별 인증방식 드롭다운 옵션 (기본값 hybrid)
create type employee_auth_method as enum (
  'hybrid',          -- IP+GPS(하이브리드)
  'gps_only',        -- GPS만
  'ip_only',         -- IP만
  'manual_approval'  -- 관리자 수동승인만
);

create type employment_status as enum (
  'active',      -- 재직
  'on_leave',    -- 휴직
  'terminated'   -- 퇴사 (A05 퇴사처리)
);

-- A11 근무설정 — 휴가 정책 설정: 법정계산 / 관리자수동입력
create type leave_policy_type as enum (
  'statutory', -- 법정계산
  'manual'     -- 관리자수동입력
);

-- A06 휴가승인 상태
create type leave_request_status as enum (
  'pending',   -- 대기중 (승인/반려 버튼 노출)
  'approved',  -- 승인 (버튼 사라짐, 상태 텍스트만)
  'rejected'   -- 반려
);

-- A01/A07/A08 근태 상태: 출근중/외출외근/미출근/휴가
create type attendance_status as enum (
  'present',   -- 출근중
  'remote',    -- 외출외근
  'absent',    -- 미출근
  'on_leave'   -- 휴가
);

create type check_in_method as enum ('ip', 'gps', 'manual');

-- ============================================================
-- admin_profiles — 관리자 계정 (A12 시스템, A13 로그인)
-- 인증 자체는 Supabase Auth(auth.users)가 담당하고, 이 테이블은 프로필만 보관한다.
-- ============================================================

create table admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ============================================================
-- employees — A02/A03/A04
-- ============================================================

create table employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  department text,
  position text,
  hire_date date not null,
  termination_date date,
  employment_status employment_status not null default 'active',
  -- 4번 항목: 직원별 인증방식 (미지정 시 하이브리드가 기본값)
  auth_method employee_auth_method not null default 'hybrid',
  -- 직원용 앱(별도 트랙) 대비: 관리자가 직원을 먼저 등록하고 로그인 계정은 나중에
  -- 생성/연결되는 흐름을 가정해 nullable로 둔다. 계정 삭제 시에도 인사 기록은
  -- 남아야 하므로 on delete set null.
  auth_user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_termination_date_check check (
    termination_date is null or termination_date >= hire_date
  )
);

create index employees_employment_status_idx on employees (employment_status);

-- ============================================================
-- company_settings — A11 근무설정 (기본 근무 설정 + 인증설정 GPS)
-- 회사 전체 공통값이므로 싱글턴 테이블로 둔다 (id는 항상 1).
-- ============================================================

create table company_settings (
  id smallint primary key default 1,
  -- 기본 근무 설정
  standard_start_time time not null default '09:00',
  standard_end_time time not null default '18:00',
  break_minutes integer not null default 60,
  workdays smallint[] not null default '{1,2,3,4,5}', -- 1=월 .. 7=일
  -- 4번 항목: 인증설정(IP/GPS) 중 GPS 좌표/반경 (IP는 ip_whitelist 테이블 참조)
  gps_latitude numeric(10, 7),
  gps_longitude numeric(10, 7),
  gps_radius_m integer,
  updated_at timestamptz not null default now(),
  constraint company_settings_singleton check (id = 1)
);

insert into company_settings (id) values (1);

-- ============================================================
-- ip_whitelist — 4번 항목: 사무실 IP 화이트리스트 (다중 등록/개별 삭제)
-- ============================================================

create table ip_whitelist (
  id uuid primary key default gen_random_uuid(),
  ip_address inet not null unique,
  label text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- leave_policies — A11 근무설정: 휴가 정책 설정 (법정계산 / 관리자수동입력)
-- 싱글턴 테이블 (id는 항상 1).
-- ============================================================

create table leave_policies (
  id smallint primary key default 1,
  policy_type leave_policy_type not null default 'statutory',
  manual_annual_leave_days numeric(5, 1), -- policy_type = 'manual'일 때만 사용
  updated_at timestamptz not null default now(),
  constraint leave_policies_singleton check (id = 1)
);

insert into leave_policies (id) values (1);

-- ============================================================
-- leave_requests — A06 휴가승인
-- ============================================================

create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id) on delete cascade,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status leave_request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references admin_profiles (id),
  constraint leave_requests_date_range_check check (end_date >= start_date)
);

create index leave_requests_employee_id_idx on leave_requests (employee_id);
create index leave_requests_status_idx on leave_requests (status);

-- ============================================================
-- attendance_records — A01 대시보드, A07 근태 데이터, A08 근태상세
-- ============================================================

create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id) on delete cascade,
  work_date date not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  check_in_method check_in_method,
  check_in_ip inet,
  check_in_latitude numeric(10, 7),
  check_in_longitude numeric(10, 7),
  status attendance_status not null default 'absent',
  note text,
  created_at timestamptz not null default now(),
  unique (employee_id, work_date)
);

create index attendance_records_employee_id_idx on attendance_records (employee_id);
create index attendance_records_work_date_idx on attendance_records (work_date);

-- ============================================================
-- holidays — A12 시스템: 공휴일 API 연동 캐시
-- ============================================================

create table holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  name text not null,
  source text not null default 'api', -- 'api' | 'manual'
  created_at timestamptz not null default now()
);

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================

create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger employees_set_updated_at
  before update on employees
  for each row execute function set_updated_at();

create trigger company_settings_set_updated_at
  before update on company_settings
  for each row execute function set_updated_at();

create trigger leave_policies_set_updated_at
  before update on leave_policies
  for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security — 기본 차단, service_role만 접근 (RLS 자동 우회)
-- ============================================================

alter table admin_profiles enable row level security;
alter table employees enable row level security;
alter table company_settings enable row level security;
alter table ip_whitelist enable row level security;
alter table leave_policies enable row level security;
alter table leave_requests enable row level security;
alter table attendance_records enable row level security;
alter table holidays enable row level security;
