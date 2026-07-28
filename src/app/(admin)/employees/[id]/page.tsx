import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { getEmployee } from "@/lib/employees";
import { getCompanySettings, formatWorkdaysLabel } from "@/lib/companySettings";
import { getLeavePolicy } from "@/lib/leavePolicies";
import { terminateEmployee } from "../actions";
import { EmployeeDetailForm } from "./EmployeeDetailForm";

export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // getEmployee(id)/getCompanySettings()/getLeavePolicy()는 서로의 결과에 의존하지
  // 않는데(전부 employeeId를 안 쓰거나 route param만 씀) 순차 await로 묶으면 불필요한
  // waterfall이 생긴다.
  const [employee, companySettings, leavePolicy] = await Promise.all([
    getEmployee(id),
    getCompanySettings(),
    getLeavePolicy(),
  ]);

  if (!employee) {
    notFound();
  }

  const terminateWithId = terminateEmployee.bind(null, employee.id);

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "직원관리", href: "/employees" },
          `직원상세 - ${employee.name}`,
        ]}
      />

      <EmployeeDetailForm
        employee={employee}
        workdaysLabel={formatWorkdaysLabel(companySettings.workdays)}
        leavePolicy={leavePolicy}
        terminateAction={terminateWithId}
      />
    </>
  );
}
