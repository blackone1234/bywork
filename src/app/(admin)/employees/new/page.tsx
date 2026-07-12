import { PageHeader } from "@/components/admin/PageHeader";
import { FormField } from "@/components/admin/FormField";
import { TextField } from "@/components/admin/TextField";
import { Button } from "@/components/admin/Button";

export default function NewEmployeePage() {
  return (
    <>
      <PageHeader breadcrumb={["Dashboard", "직원관리", "직원추가"]} />

      <div className="flex flex-1 flex-col gap-8 px-4 py-6 sm:px-8 lg:gap-[50px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <div className="flex w-full flex-col gap-[20px]">
          <FormField label="이름" required>
            <TextField type="text" placeholder="이름을 입력해주세요." />
          </FormField>

          <FormField label="연락처" required>
            <TextField
              type="tel"
              placeholder="000-1234-5678 (숫자만 입력해주세요)"
            />
          </FormField>

          <FormField label="이메일 (로그인 ID)" required>
            <div className="flex w-full max-w-[500px] items-center rounded-[12px] border border-divider py-[16px] pr-[14px] pl-[30px] transition-[border,box-shadow] focus-within:border-2 focus-within:border-black focus-within:shadow-[2px_4px_2px_rgba(0,0,0,0.2)]">
              <input
                type="text"
                placeholder="abcd"
                className="flex-1 text-[14px] font-semibold tracking-[-0.28px] text-black placeholder:text-line focus:outline-none"
              />
              <span className="text-[14px] font-semibold tracking-[-0.28px] text-black">
                @by-bk.com
              </span>
            </div>
          </FormField>

          <div className="flex items-center gap-[12px]">
            <FormField label="입사일" required>
              <TextField type="date" />
            </FormField>
          </div>

          <FormField label="근무설정">
            <div className="w-full max-w-[500px] rounded-[12px] border border-divider py-[16px] pr-[14px] pl-[30px] text-[14px] font-semibold tracking-[-0.28px] text-line">
              근무설정 기본 값 자동적용되었습니다. (월~금 09:00 ~ 18:00)
            </div>
          </FormField>
        </div>

        <div className="flex w-full items-center justify-between gap-3 border-t border-muted pt-[30px]">
          <Button href="/employees" className="w-[110px] sm:w-[140px]">
            취소
          </Button>
          <Button className="w-[110px] sm:w-[140px]">저장</Button>
        </div>
      </div>
    </>
  );
}
