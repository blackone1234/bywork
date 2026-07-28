-- 같은 직원이 겹치는 기간에 pending/approved 상태로 중복 신청하는 걸 애플리케이션
-- 코드 체크(SELECT로 겹침 확인 후 INSERT)만으로 막으면, 두 요청이 거의 동시에
-- 제출될 때 둘 다 "안 겹친다"고 판단해서 통과할 수 있다 — 그룹B의 attendance_records
-- 동시성 이슈(get-or-create 경쟁 상태)와 같은 종류의 문제다. 애플리케이션 코드가
-- 아니라 DB 레벨 EXCLUDE 제약으로 막아서, 동시 요청이어도 Postgres가 트랜잭션 격리
-- 수준에서 반드시 하나는 거부하게 한다.
--
-- leave_request_status는 pending/approved/rejected 3개뿐이다(cancelled 없음) — "활성"
-- 상태인 pending/approved만 겹침 검사 대상으로 삼고, rejected는 제외한다(반려된 요청은
-- 같은 기간 재신청을 막을 이유가 없다).
create extension if not exists btree_gist;

alter table leave_requests
  add constraint leave_requests_no_overlap
  exclude using gist (
    employee_id with =,
    daterange(start_date, end_date, '[]') with &&
  )
  where (status in ('pending', 'approved'));
