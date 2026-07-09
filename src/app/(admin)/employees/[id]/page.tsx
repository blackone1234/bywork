import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { DetailRow } from "@/components/admin/DetailRow";
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

      <div className="flex flex-1 flex-col px-[60px] pt-[50px] pb-[20px]">
        <div className="flex w-full flex-col gap-[80px]">
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
                <button
                  type="button"
                  className="rounded-[10px] border border-muted px-[14px] py-[12px] text-[14px] font-semibold tracking-[-0.28px] text-muted"
                >
                  비밀번호 초기화 메일 발송
                </button>
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
                <button
                  type="button"
                  className="flex items-center gap-[14px] rounded-[20px] border border-divider px-[24px] py-[11px]"
                >
                  <span className="text-[14px] font-semibold tracking-[-0.28px] text-line">
                    {employee.authMethod}
                  </span>
                  <span aria-hidden className="text-line">
                    ▾
                  </span>
                </button>
              </DetailRow>
            </div>
          </div>
        </div>

        <div className="flex w-full items-start justify-between pt-[30px]">
          <Link
            href="/employees"
            className="flex w-[140px] items-center justify-center rounded-[10px] border border-muted px-[24px] py-[13px] text-[14px] font-semibold tracking-[-0.28px] text-muted"
          >
            취소
          </Link>
          <div className="flex items-center justify-end gap-[12px]">
            <button
              type="button"
              className="flex w-[140px] items-center justify-center rounded-[10px] bg-sidebar-active px-[24px] py-[13px] text-[14px] font-semibold tracking-[-0.28px] text-white shadow-[2px_4px_2px_rgba(0,0,0,0.2)]"
            >
              저장
            </button>
            <Link
              href={`/employees/${employee.id}/terminate`}
              className="flex w-[140px] items-center justify-center rounded-[10px] bg-sidebar-active px-[24px] py-[13px] text-[14px] font-semibold tracking-[-0.28px] text-white shadow-[2px_4px_2px_rgba(0,0,0,0.2)]"
            >
              퇴사처리
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
