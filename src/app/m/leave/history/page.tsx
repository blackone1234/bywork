import { redirect } from "next/navigation";
import { MobileSubPageHeader } from "@/components/mobile/Header";
import { MobileBottomNav } from "@/components/mobile/BottomNav";
import { getCurrentEmployee, EMPLOYEE_SESSION_EXPIRED_MESSAGE } from "@/lib/employeeAccount";
import { listMyLeaveRequests } from "@/lib/employeeLeaveRequests";
import { LeaveHistoryList } from "./LeaveHistoryList";

export const dynamic = "force-dynamic";

/** S12 — 휴가 내역 (light, 드릴인). */
export default async function MobileLeaveHistoryPage() {
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect(`/m/login?error=${encodeURIComponent(EMPLOYEE_SESSION_EXPIRED_MESSAGE)}`);
  }

  const requests = await listMyLeaveRequests(employee.id);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[var(--mobile-color-white)] pb-[110px]">
      <div className="flex w-full flex-col gap-[30px]">
        <MobileSubPageHeader title="휴가내역" />
        <LeaveHistoryList requests={requests} />
      </div>
      <MobileBottomNav active="leave" theme="light" />
    </div>
  );
}
