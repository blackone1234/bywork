"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterDropdown } from "@/components/admin/FilterDropdown";

const ALL_LABEL = "전체 직원";

/**
 * A07 개별 직원 선택 — AttendanceMonthFilter.tsx와 동일 패턴(URL 쿼리로 상태 관리).
 * FilterDropdown은 문자열 label만 다루므로 이름→id 매핑은 여기서 별도 Map으로 관리한다.
 * 알려진 한계: 동명이인이면 첫 번째 일치 직원으로 매핑됨(현재 직원 수 규모상 리스크 낮음).
 */
export function AttendanceEmployeeFilter({
  employees,
  selectedName,
}: {
  employees: { id: string; name: string }[];
  selectedName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const nameToId = new Map(employees.map((employee) => [employee.name, employee.id]));

  function updateEmployee(name: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (name === ALL_LABEL) {
      params.delete("employeeId");
    } else {
      const id = nameToId.get(name);
      if (id) params.set("employeeId", id);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <FilterDropdown
      label={selectedName}
      options={[ALL_LABEL, ...employees.map((employee) => employee.name)]}
      width={160}
      onSelect={updateEmployee}
    />
  );
}

export { ALL_LABEL as ATTENDANCE_EMPLOYEE_FILTER_ALL_LABEL };
