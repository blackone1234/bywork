import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { DetailRow } from "@/components/admin/DetailRow";
import { AuthMethodSelect } from "@/components/admin/AuthMethodSelect";
import { Button } from "@/components/admin/Button";
import { getEmployeeById } from "@/lib/dummy-data";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = getEmployeeById(id);

  if (!employee) {
    notFound();
  }

  return (
    <>
      <PageHeader
        breadcrumb={["Dashboard", "직원관리", `직원상세 - ${employee.name}`]}
      />

      <div className="flex flex-1 flex-col px-4 py-6 sm:px-8 lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <div className="flex w-full flex-col gap-10 lg:gap-[80px]">
          <div className="flex w-full flex-col gap-[18px]">
            <h2 className="text-[20px] font-bold tracking-[-0.4px] text-black">
              기본정보
            </h2>
            <div className="flex w-full flex-col divide-y divide-divider border-t-2 border-b-2 border-black">
              <DetailRow label="이름">
                <span className="text-[16px] font-bold tracking-[-0.32px] text-black">
                  {employee.name}
                </span>
              </DetailRow>
              <DetailRow label="이메일">
                <span className="flex-1 text-[16px] font-bold tracking-[-0.32px] text-black">
                  {employee.email}
                </span>
                <Button>비밀번호 초기화 메일 발송</Button>
              </DetailRow>
            </div>
          </div>

          <div className="flex w-full flex-col gap-[18px]">
            <h2 className="text-[20px] font-bold tracking-[-0.4px] text-black">
              근무설정 (개별)
            </h2>
            <div className="flex w-full flex-col divide-y divide-divider border-t-2 border-b-2 border-black">
              <DetailRow label="요일">
                <span className="text-[16px] font-bold tracking-[-0.32px] text-black">
                  월~금
                </span>
              </DetailRow>
              <DetailRow label="연차">
                <span className="text-[16px] font-bold tracking-[-0.32px] text-black">
                  자동계산 {employee.remainingLeaveDays}일
                </span>
              </DetailRow>
              <DetailRow label="인증방식">
                <AuthMethodSelect defaultValue={employee.authMethod} />
              </DetailRow>
            </div>
          </div>
        </div>

        <div className="mt-8 flex w-full flex-col-reverse gap-3 pt-[30px] sm:mt-0 sm:flex-row sm:items-center sm:justify-between">
          <Button href="/employees" className="w-full sm:w-[140px]">
            취소
          </Button>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-end sm:gap-[12px]">
            <Button variant="primary" className="w-full sm:w-[140px]">
              저장
            </Button>
            <Button
              href={`/employees/${employee.id}/terminate`}
              variant="primary"
              className="w-full sm:w-[140px]"
            >
              퇴사처리
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
