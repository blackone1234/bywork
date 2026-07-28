-- A04 "연차: 자동계산 15일"이 실제로는 계산이 아니라 employees.annual_leave_days의
-- DB 컬럼 기본값(15)일 뿐이었다 — 근속연수와 무관하게 전 직원이 동일했음(이동석 14년
-- 근속과 모바일테스트 3주 근속이 둘 다 15.0으로 동일한 것으로 실증됨). 이 마이그레이션은
-- hire_date 기준 실제 근속 계산을 붙이고, A09/A11의 "법정계산/관리자수동입력" 토글을
-- 실제로 연결한다.
--
-- 계산 공식(사용자와 사전 확정):
--   근속 1년 미만: 경과 개월수만큼 1일, 최대 11일 캡(개근 판정 없음, 단순 날짜 산술)
--   근속 1년 이상 3년 미만: 15일 고정
--   근속 3년 이상: 15 + FLOOR((근속연수-1)/2), 최대 25일 캡 (근로기준법 제60조4항과 동일 공식)
--
-- 이 프로젝트는 REST-only + DB 커넥션/cron이 전혀 없는 구조(A12 공휴일 갱신 락 구현 때
-- 확정된 제약)라 배치 재계산은 지속 불가능 — 조회 시점 계산(VIEW+함수) 방식을 쓴다.
-- attendance_records_with_times VIEW(검토대기 이벤트를 걸러 확정값만 노출)와 동일한
-- "읽기 시점에 계산해서 노출" 패턴을 그대로 따른다.

-- =====================================================================
-- 1) 법정 산정 함수
-- =====================================================================
-- age(as_of, hire_date)는 Postgres 공식 문서 기준 "달력 기준 연/월/일" symbolic 계산이라
-- 입사일 기준 anniversary 방식(회계연도 통일 아님) 요구사항과 정확히 일치한다.
--
-- p_hire_date는 employees.hire_date가 "not null" 제약이라 null 가드 불필요(기존
-- 직원 전원 실제 값 보유 재확인함).
create or replace function calculate_statutory_annual_leave(
  p_hire_date date,
  p_as_of date default current_date
) returns numeric(5, 1)
language plpgsql
stable
as $$
declare
  v_age interval;
  v_years int;
  v_months int;
begin
  if p_hire_date > p_as_of then
    return 0;
  end if;

  v_age := age(p_as_of, p_hire_date);
  v_years := extract(year from v_age)::int;
  v_months := extract(month from v_age)::int;

  if v_years < 1 then
    return least(v_years * 12 + v_months, 11);
  elsif v_years < 3 then
    return 15;
  else
    return least(15 + floor((v_years - 1) / 2.0), 25);
  end if;
end;
$$;

-- =====================================================================
-- 2) 정책 전환 마커 + 원자적 전환 함수
-- =====================================================================
-- leave_policies.policy_type(싱글턴, 회사 전체 온/오프 스위치)이 'manual'일 때만
-- A04에서 직원별로 연차를 직접 입력할 수 있게 연다(기존 토글 UI 문구 "직원별 연차
-- 직접 입력"과 부합).
--
-- leave_days_manually_set_at: null이면 "관리자가 한 번도 손댄 적 없음"(정책 전환 시
-- 자동 스냅샷 대상), non-null이면 "관리자가 A04에서 실제로 입력한 값"(정책을 몇 번
-- 오가도 자동으로 덮어쓰지 않음).
--
-- statutory -> manual로 처음 전환하는 순간, 아직 한 번도 수동 입력된 적 없는 직원들의
-- employees.annual_leave_days에 "그 시점의 계산값"을 스냅샷으로 채워 넣어서 화면에
-- 보이는 값이 전환 순간에 갑자기 바뀌지 않게 한다. policy_type 갱신과 스냅샷을 한
-- 함수(하나의 트랜잭션)로 묶어 원자적으로 처리한다.
alter table employees add column if not exists leave_days_manually_set_at timestamptz;

create or replace function set_leave_policy(p_policy_type leave_policy_type)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current leave_policy_type;
begin
  select policy_type into v_current from leave_policies where id = 1 for update;

  if p_policy_type = 'manual' and v_current <> 'manual' then
    update employees
    set annual_leave_days = calculate_statutory_annual_leave(hire_date)
    where leave_days_manually_set_at is null;
  end if;

  update leave_policies set policy_type = p_policy_type where id = 1;
end;
$$;

-- =====================================================================
-- 3) 조회용 VIEW
-- =====================================================================
-- 컬럼명을 employees와 동일하게 유지해서 앱 코드는 .from() 대상만 바꾸면 된다.
--
-- 퇴사자는 termination_date 기준으로 계산을 멈춘다 — as_of를 항상 current_date로
-- 두면 퇴사한 직원의 연차가 퇴사 이후에도 오늘 날짜 기준으로 계속 늘어나는 오류가
-- 생긴다(listEmployees()가 employment_status 필터 없이 퇴사자도 그대로 노출하는 것을
-- 재확인함 — 실제로 "모바일테스트"가 퇴사 상태로 존재).
create or replace view employees_with_leave as
select
  e.id, e.name, e.email, e.phone, e.department, e.position,
  e.hire_date, e.termination_date, e.employment_status, e.auth_method,
  e.auth_user_id, e.created_at, e.updated_at,
  case when coalesce(lp.policy_type, 'statutory') = 'manual'
    then e.annual_leave_days
    else calculate_statutory_annual_leave(e.hire_date, coalesce(e.termination_date, current_date))
  end as annual_leave_days,
  e.used_leave_days,
  e.leave_days_manually_set_at
from employees e
left join leave_policies lp on lp.id = 1;

-- =====================================================================
-- 4) 미사용 컬럼 정리
-- =====================================================================
-- leave_policies.manual_annual_leave_days는 앱 코드 전체에서 완전히 미사용(grep 0건)
-- — leave_policies가 싱글턴 테이블이라 애초에 "직원별" 값을 담을 수 없어 구현이
-- 불가능했던 죽은 컬럼이다. 실제 수동입력 값은 employees.annual_leave_days에 직원별로
-- 담기므로(위 2번) 이 컬럼은 영구적으로 죽은 채로 남을 수밖에 없어 이번에 제거한다.
alter table leave_policies drop column if exists manual_annual_leave_days;

-- =====================================================================
-- 5) GRANT (하우스 룰 — CLAUDE.md 지시)
-- =====================================================================
-- RLS enable과 별개로 service_role에 대한 GRANT를 항상 같이 포함한다.
-- 20260713000000_grant_service_role.sql에서 이미 default privileges로
-- "앞으로 생기는 테이블/함수"에도 자동 적용되게 해뒀지만, 명시적으로 재적용한다.
grant execute on function calculate_statutory_annual_leave(date, date) to service_role;
grant execute on function set_leave_policy(leave_policy_type) to service_role;
grant select on employees_with_leave to service_role;
