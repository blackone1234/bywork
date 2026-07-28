import { redirect } from "next/navigation";
import { MobileSubPageHeader } from "@/components/mobile/Header";
import { MobileBottomNav } from "@/components/mobile/BottomNav";
import { getCurrentEmployee, EMPLOYEE_SESSION_EXPIRED_MESSAGE } from "@/lib/employeeAccount";
import { getLeaveBalance } from "@/lib/employeeLeaveRequests";
import { LeaveNewForm } from "./LeaveNewForm";

export const dynamic = "force-dynamic";

/** S11 — 휴가 신청 (light, 드릴인). */
export default async function MobileLeaveNewPage() {
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect(`/m/login?error=${encodeURIComponent(EMPLOYEE_SESSION_EXPIRED_MESSAGE)}`);
  }

  const balance = await getLeaveBalance(employee.id);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[var(--mobile-color-white)] pb-[110px]">
      <div className="flex w-full flex-col gap-[30px]">
        <MobileSubPageHeader title="휴가신청" />
        <LeaveNewForm remaining={balance.remaining} />
      </div>
      <MobileBottomNav active="leave" theme="light" />
    </div>
  );
}
