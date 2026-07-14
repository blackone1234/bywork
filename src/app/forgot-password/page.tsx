import { ModalScreen, ModalSuccessIcon } from "@/components/admin/ModalScreen";
import { Button } from "@/components/admin/Button";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <ModalScreen>
      <div className="flex flex-col items-center gap-[12px]">
        <p className="text-[16px] font-bold tracking-[-0.32px] text-black">
          이메일 발송 완료
        </p>
        <ModalSuccessIcon />
        <p className="text-center text-[12px] font-semibold leading-[20px] tracking-[-0.24px] text-muted">
          {email ? (
            <>
              {email} 으로
              <br />
              재설정 링크가 발송되었습니다. 24시간 후 만료됩니다.
            </>
          ) : (
            "입력하신 이메일로 재설정 링크가 발송되었습니다. 24시간 후 만료됩니다."
          )}
        </p>
      </div>

      <div className="flex w-full items-center justify-center">
        <Button href="/login" size="xs" className="w-[120px]">
          확인
        </Button>
      </div>
    </ModalScreen>
  );
}
