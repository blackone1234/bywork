import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { Button } from "@/components/admin/Button";
import { TextField } from "@/components/admin/TextField";
import { adminAccount, holidayApiStatus } from "@/lib/dummy-data";

export default function SystemSettingsPage() {
  return (
    <>
      <PageHeader breadcrumb={["Dashboard", "시스템"]} />

      <div className="flex flex-1 flex-col gap-8 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <div className="flex w-full flex-col gap-[20px]">
          <h2 className="text-[20px] font-bold tracking-[-0.4px] text-black">
            관리자 계정
          </h2>
          <div className="flex w-full flex-col divide-y divide-divider border-t-2 border-b-2 border-black">
            <div className="flex w-full flex-col gap-2 py-[10px] sm:flex-row sm:items-center sm:gap-[10px] sm:py-[6px]">
              <span className="w-full shrink-0 text-[14px] font-semibold tracking-[-0.28px] text-muted sm:w-[120px]">
                이메일
              </span>
              <TextField type="email" defaultValue={adminAccount.email} />
            </div>
            <div className="flex w-full flex-col gap-2 py-[10px] sm:flex-row sm:items-center sm:gap-[10px] sm:py-[6px]">
              <span className="w-full shrink-0 text-[14px] font-semibold tracking-[-0.28px] text-muted sm:w-[120px]">
                새 비밀번호
              </span>
              <TextField
                type="password"
                placeholder="새 비밀번호를 입력해주세요. 최소 8자 이상 입력해주세요."
              />
            </div>
            <div className="flex w-full flex-col gap-2 py-[10px] sm:flex-row sm:items-center sm:gap-[10px] sm:py-[6px]">
              <span className="w-full shrink-0 text-[14px] font-semibold tracking-[-0.28px] text-muted sm:w-[120px]">
                비밀번호 확인
              </span>
              <TextField type="password" placeholder="비밀번호를 다시 입력해주세요." />
            </div>
          </div>
          <div className="flex w-full justify-end">
            <Button className="w-full sm:w-[140px]">저장</Button>
          </div>
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
                  <p className="text-black">{holidayApiStatus.apiStatus}</p>
                </div>
                <div className="flex items-start gap-[20px]">
                  <p className="w-[70px] shrink-0 text-line">연간 공휴일 수</p>
                  <p className="text-black">{holidayApiStatus.annualHolidayCount}</p>
                </div>
              </div>
            </div>
            <Button className="self-start sm:self-auto">
              공휴일 데이터 수동 갱신
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
