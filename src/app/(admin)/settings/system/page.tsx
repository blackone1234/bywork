import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { Button } from "@/components/admin/Button";
import { getAdminAccount } from "@/lib/adminAccount";
import { getHolidayApiStatus } from "@/lib/holidays";
import { AdminPasswordForm } from "./AdminPasswordForm";
import { refreshHolidays } from "./actions";

export const dynamic = "force-dynamic";

export default async function SystemSettingsPage() {
  const year = new Date().getFullYear();
  const [adminAccount, holidayApiStatus] = await Promise.all([
    getAdminAccount(),
    getHolidayApiStatus(year),
  ]);

  return (
    <>
      <PageHeader breadcrumb={["Dashboard", "시스템"]} />

      <div className="flex flex-1 flex-col gap-8 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <div className="flex w-full flex-col gap-[20px]">
          <h2 className="text-[20px] font-bold tracking-[-0.4px] text-black">
            관리자 계정
          </h2>
          {adminAccount ? (
            <AdminPasswordForm adminId={adminAccount.id} email={adminAccount.email} />
          ) : (
            <p className="text-body font-semibold text-muted">
              관리자 계정이 아직 없습니다.
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-[18px]">
          <h2 className="text-[20px] font-bold tracking-[-0.4px] text-black">
            공휴일 API
          </h2>
          <Card
            padding="loose"
            className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-[18px]">
              <div className="flex flex-wrap items-center gap-[16px]">
                <p className="text-[16px] font-bold tracking-[-0.32px] text-sidebar-active">
                  서비스 명 : {holidayApiStatus.serviceName}
                </p>
                <span className="rounded-[8px] bg-status-work px-[12px] py-[6px] text-[12px] font-semibold tracking-[-0.24px] text-sidebar-active">
                  {holidayApiStatus.connected ? "연동됨" : "미연동"}
                </span>
              </div>
              <div className="flex flex-col gap-[10px] text-[12px] font-semibold tracking-[-0.24px]">
                <div className="flex items-start gap-[20px]">
                  <p className="w-[70px] shrink-0 text-line">API 상태</p>
                  <p className="text-black">{holidayApiStatus.apiStatusLabel}</p>
                </div>
                <div className="flex items-start gap-[20px]">
                  <p className="w-[70px] shrink-0 text-line">연간 공휴일 수</p>
                  <p className="text-black">{holidayApiStatus.annualHolidayCountLabel}</p>
                </div>
              </div>
            </div>
            <form action={refreshHolidays}>
              <Button type="submit" className="self-start sm:self-auto">
                공휴일 데이터 수동 갱신
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
