-- A12 "공휴일 데이터 수동 갱신" 중복 요청 방어용 락 타임스탬프.
-- null = 유휴. 값이 있으면 그 시각에 갱신이 시작된 것 — 서버 액션(refreshHolidays)이
-- 조건부 UPDATE(holiday_sync_started_at is null or < now() - 3분)로 락을 원자적으로
-- 획득/해제한다. 정상 소요시간은 약 45초(공공데이터포털 API를 12개월치 순차 호출,
-- 레이트리밋 회피 목적 — 기존 설계)이므로, 3분 이상 지난 값은 과거 요청이 크래시로
-- 락을 못 푼 것으로 간주해 다음 요청이 강제로 재획득한다.
alter table public.company_settings
  add column if not exists holiday_sync_started_at timestamptz;

comment on column public.company_settings.holiday_sync_started_at is
  'A12 공휴일 데이터 수동 갱신 중복 요청 방어 락. null=유휴, 값 있으면 그 시각에 갱신 시작. 3분 경과 시 stale로 간주하고 다음 요청이 재획득.';

-- company_settings는 기존에 이미 RLS+service_role GRANT가 돼 있는 테이블(단일 행
-- 설정 테이블)이라 컬럼 추가만으로는 별도 GRANT가 필요 없다(RLS는 row 단위이지
-- column 단위가 아님).
