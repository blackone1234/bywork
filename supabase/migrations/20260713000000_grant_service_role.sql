-- 초기 스키마(20260709000000)가 각 테이블에 RLS는 켰지만 service_role에 대한
-- 테이블 권한(GRANT)을 명시적으로 주지 않아, service_role 키로 접근해도
-- "permission denied for table ..." 로 막히는 문제를 고친다.
-- RLS(행 단위 보안)와 GRANT(테이블 단위 권한)는 Postgres에서 별개이므로 둘 다 필요하다.

grant usage on schema public to service_role;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- 앞으로 이 스키마에 새로 생기는 테이블/시퀀스/함수에도 자동으로 같은 권한이 적용되게 한다.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;
