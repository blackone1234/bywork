@AGENTS.md

- Supabase 스키마 작성 시 각 테이블에 RLS enable 하는 것과 별개로, service_role에 대한 GRANT(테이블/시퀀스/함수 + default privileges)를 항상 같이 포함할 것. RLS만 켜고 GRANT를 빠뜨리면 service_role 키로도 permission denied가 발생함.
