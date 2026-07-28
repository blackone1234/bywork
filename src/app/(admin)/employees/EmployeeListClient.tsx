"use client";

import { useState } from "react";
import { SearchInput } from "@/components/admin/SearchInput";
import { EmploymentStatusBadge } from "@/components/admin/EmploymentStatusBadge";
import { Button } from "@/components/admin/Button";
import { DataTable, TableText, type DataTableColumn } from "@/components/admin/DataTable";
import type { Employee } from "@/lib/employees";

const COLUMNS: DataTableColumn<Employee>[] = [
  { key: "name", label: "이름", render: (row) => <TableText>{row.name}</TableText> },
  { key: "email", label: "이메일", render: (row) => <TableText>{row.email}</TableText> },
  { key: "hireDate", label: "입사일", render: (row) => <TableText>{row.hireDate}</TableText> },
  {
    key: "status",
    label: "상태",
    render: (row) => <EmploymentStatusBadge status={row.status} />,
  },
  {
    key: "remainingLeaveDays",
    label: "잔여연차",
    render: (row) => <TableText>{row.remainingLeaveDays}일</TableText>,
  },
];

/**
 * A02 검색 — 이 프로젝트에 페이지네이션이 전혀 없고(listEmployees()가 항상 전체 조회)
 * 규모도 작아서, 서버 왕복 없이 이미 받아온 배열을 브라우저에서 필터링한다.
 * 이름/이메일에 검색어(trim, 대소문자 무시)가 포함되는 행만 남긴다.
 */
export function EmployeeListClient({ employees }: { employees: Employee[] }) {
  const [query, setQuery] = useState("");

  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? employees.filter(
        (employee) =>
          employee.name.toLowerCase().includes(trimmed) || employee.email.toLowerCase().includes(trimmed),
      )
    : employees;

  return (
    <>
      <div className="stagger-item flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between" style={{ animationDelay: "0ms" }}>
        <SearchInput placeholder="직원을 검색하세요" value={query} onChange={setQuery} />

        <div className="flex items-center gap-[8px]">
          <Button size="toolbar">엑셀 다운로드</Button>
          <Button href="/employees/new" variant="primary" pill>
            <span aria-hidden>+</span>
            직원추가
          </Button>
        </div>
      </div>

      <div className="stagger-item" style={{ animationDelay: "70ms" }}>
        {filtered.length > 0 ? (
          <DataTable columns={COLUMNS} rows={filtered} rowKey={(row) => row.id} rowHref={(row) => `/employees/${row.id}`} />
        ) : (
          <p className="w-full py-[40px] text-center text-body font-semibold text-muted">검색 결과가 없습니다.</p>
        )}
      </div>
    </>
  );
}
