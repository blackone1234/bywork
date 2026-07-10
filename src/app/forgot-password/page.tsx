import Link from "next/link";
import { ModalScreen } from "@/components/admin/ModalScreen";
import { adminAccount } from "@/lib/dummy-data";

export default function ForgotPasswordPage() {
  return (
    <ModalScreen>
      <div className="flex flex-col items-center gap-[12px]">
        <p className="text-[16px] font-bold tracking-[-0.32px] text-black">
          이메일 발송 완료
        </p>
        <span className="flex size-[32px] items-center justify-center rounded-full bg-status-work text-[16px]">
          ✓
        </span>
        <p className="text-center text-[12px] font-semibold leading-[20px] tracking-[-0.24px] text-muted">
          {adminAccount.email} 으로
          <br />
          재설정 링크가 발송되었습니다. 24시간 후 만료됩니다.
        </p>
      </div>

      <div className="flex w-full items-center justify-center">
        <Link
          href="/login"
          className="flex w-[120px] items-center justify-center rounded-[10px] border border-muted px-[24px] py-[12px] text-[12px] font-semibold tracking-[-0.24px] text-muted transition-colors hover:border-black hover:bg-page hover:text-black"
        >
          확인
        </Link>
      </div>
    </ModalScreen>
  );
}
