import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { SearchInput } from "@/components/admin/SearchInput";
import { EmploymentStatusBadge } from "@/components/admin/EmploymentStatusBadge";
import { employees } from "@/lib/dummy-data";

const TABLE_COLUMNS = ["이름", "이메일", "입사일", "상태", "잔여연차"];

export default function EmployeesPage() {
  return (
    <>
      <PageHeader breadcrumb={["Dashboard", "직원관리"]} />

      <div className="flex flex-1 flex-col gap-[40px] px-[60px] pt-[50px] pb-[20px]">
        <div className="flex w-full items-start justify-between">
          <SearchInput placeholder="직원을 검색하세요" />

          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              className="rounded-[10px] border border-muted px-[24px] py-[13px] pl-[20px] text-[12px] font-semibold tracking-[-0.24px] text-muted"
            >
              엑셀 다운로드
            </button>
            <Link
              href="/employees/new"
              className="flex items-center gap-[14px] rounded-[40px] bg-sidebar-active px-[24px] py-[11px] text-[14px] font-semibold tracking-[-0.28px] text-white"
            >
              <span aria-hidden>+</span>
              직원추가
            </Link>
          </div>
        </div>

        <div className="flex w-full flex-col gap-[12px]">
          <div className="grid w-full grid-cols-5 border-b-2 border-black pb-[14px]">
            {TABLE_COLUMNS.map((column) => (
              <p
                key={column}
                className="text-center text-[14px] font-semibold tracking-[-0.28px] text-muted"
              >
                {column}
              </p>
            ))}
          </div>

          <div className="flex w-full flex-col gap-[11px]">
            {employees.map((employee) => (
              <Link
                key={employee.id}
                href={`/employees/${employee.id}`}
                className="grid w-full grid-cols-5 items-center border-b border-divider pb-[12px] transition-colors hover:bg-white"
              >
                <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                  {employee.name}
                </p>
                <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                  {employee.email}
                </p>
                <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                  {employee.hireDate}
                </p>
                <div className="flex items-center justify-center">
                  <EmploymentStatusBadge status={employee.status} />
                </div>
                <p className="text-center text-[14px] font-semibold tracking-[-0.28px] text-black">
                  {employee.remainingLeaveDays}일
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
