/**
 * A07(근태 데이터 목록) URL을 A07 자체의 rowHref, A08의 브레드크럼 "근태 데이터" 링크,
 * A08의 "목록" 버튼이 전부 공유한다 — 필터(검토필요/전체직원, 개별 직원 선택) 쿼리값이
 * 관리자가 명시적으로 바꾸지 않는 한 A07↔A08을 오가도 유지되도록, "어디서 왔는지"를
 * 그대로 실어 보내는 방식.
 */
export function buildAttendanceListUrl(
  year: number,
  month: number,
  filter?: string,
  employeeId?: string,
): string {
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  if (filter === "pending_review") {
    params.set("filter", filter);
  }
  if (employeeId) {
    params.set("employeeId", employeeId);
  }
  return `/attendance?${params.toString()}`;
}
