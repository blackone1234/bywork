import { PageHeader } from "@/components/admin/PageHeader";
import { listEmployees } from "@/lib/employees";
import { EmployeeListClient } from "./EmployeeListClient";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const employees = await listEmployees();

  return (
    <>
      <PageHeader breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, "직원관리"]} />

      {/* 그룹3(A 확산) — 검색행/테이블 2섹션에 스태거 적용(A01 패턴 재사용, EmployeeListClient 내부로 이동). */}
      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <EmployeeListClient employees={employees} />
      </div>
    </>
  );
}
