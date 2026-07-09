import Link from "next/link";
import { notFound } from "next/navigation";
import { ModalScreen } from "@/components/admin/ModalScreen";
import { getEmployeeById } from "@/lib/dummy-data";

export default async function TerminateEmployeeModal({
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
    <ModalScreen>
      <div className="flex flex-col items-center gap-[12px]">
        <p className="text-[16px] font-bold tracking-[-0.32px] text-black">
          퇴사 처리 확인
        </p>
        <span className="flex size-[32px] items-center justify-center rounded-full bg-status-work text-[16px]">
          ✓
        </span>
        <div className="text-center text-[12px] font-semibold leading-[18px] tracking-[-0.24px] text-muted">
          <p>{employee.name} 직원을 퇴사 처리합니다.</p>
          <p>근태 데이터는 3년간 보존됩니다.</p>
        </div>
      </div>

      <div className="flex w-full items-start gap-[10px]">
        <Link
          href={`/employees/${employee.id}`}
          className="flex w-[120px] items-center justify-center rounded-[10px] border border-muted px-[24px] py-[12px] text-[12px] font-semibold tracking-[-0.24px] text-muted"
        >
          취소
        </Link>
        <button
          type="button"
          className="flex w-[120px] items-center justify-center rounded-[10px] border border-muted px-[24px] py-[12px] text-[12px] font-semibold tracking-[-0.24px] text-muted"
        >
          퇴사처리
        </button>
      </div>
    </ModalScreen>
  );
}
