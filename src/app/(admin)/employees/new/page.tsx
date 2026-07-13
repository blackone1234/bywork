import { PageHeader } from "@/components/admin/PageHeader";
import { NewEmployeeForm } from "./NewEmployeeForm";

export default function NewEmployeePage() {
  return (
    <>
      <PageHeader breadcrumb={["Dashboard", "직원관리", "직원추가"]} />
      <NewEmployeeForm />
    </>
  );
}
