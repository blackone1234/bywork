import { PageHeader } from "@/components/admin/PageHeader";
import { SearchInput } from "@/components/admin/SearchInput";
import { EmploymentStatusBadge } from "@/components/admin/EmploymentStatusBadge";
import { Button } from "@/components/admin/Button";
import { DataTable, TableText, type DataTableColumn } from "@/components/admin/DataTable";
import { employees, type Employee } from "@/lib/dummy-data";

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

export default function EmployeesPage() {
  return (
    <>
      <PageHeader breadcrumb={["Dashboard", "직원관리"]} />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SearchInput placeholder="직원을 검색하세요" />

          <div className="flex items-center gap-[8px]">
            <Button size="toolbar">엑셀 다운로드</Button>
            <Button href="/employees/new" variant="primary" pill>
              <span aria-hidden>+</span>
              직원추가
            </Button>
          </div>
        </div>

        <DataTable columns={COLUMNS} rows={employees} rowKey={(row) => row.id} rowHref={(row) => `/employees/${row.id}`} />
      </div>
    </>
  );
}
