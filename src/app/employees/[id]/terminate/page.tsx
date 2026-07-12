import { notFound } from "next/navigation";
import { ModalScreen, ModalSuccessIcon } from "@/components/admin/ModalScreen";
import { Button } from "@/components/admin/Button";
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
        <ModalSuccessIcon />
        <div className="text-center text-[12px] font-semibold leading-[18px] tracking-[-0.24px] text-muted">
          <p>{employee.name} 직원을 퇴사 처리합니다.</p>
          <p>근태 데이터는 3년간 보존됩니다.</p>
        </div>
      </div>

      <div className="flex w-full items-start gap-[10px]">
        <Button href={`/employees/${employee.id}`} size="xs" className="flex-1">
          취소
        </Button>
        <Button size="xs" className="flex-1">
          퇴사처리
        </Button>
      </div>
    </ModalScreen>
  );
}
