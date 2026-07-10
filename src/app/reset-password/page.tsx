export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-4">
      <div className="flex w-full max-w-[480px] flex-col items-center justify-center gap-[20px] rounded-[20px] border border-divider p-6 sm:p-[30px]">
        <div className="flex flex-col items-center gap-[12px] text-center">
          <p className="text-[16px] font-bold tracking-[-0.32px] text-black">
            비밀번호 재설정
          </p>
          <p className="max-w-[336px] text-[12px] font-semibold leading-[18px] tracking-[-0.24px] text-line">
            이메일 링크로 접속하셨습니다
          </p>
        </div>

        <div className="flex w-full flex-col gap-[20px]">
          <div className="flex w-full flex-col gap-[10px]">
            <p className="text-[12px] font-semibold tracking-[-0.24px] text-muted">
              새 비밀번호
            </p>
            <input
              type="password"
              placeholder="새 비밀번호를 입력해주세요. 최소 8자 이상 입력해주세요."
              className="w-full rounded-[12px] border border-divider py-[16px] pr-[14px] pl-[30px] text-[14px] font-semibold tracking-[-0.28px] text-black placeholder:text-line transition-colors hover:border-black hover:bg-page focus:border-black focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex w-full flex-col gap-[10px]">
            <p className="text-[12px] font-semibold tracking-[-0.24px] text-muted">
              비밀번호 확인
            </p>
            <input
              type="password"
              placeholder="새 비밀번호를 입력해주세요. 최소 8자 이상 입력해주세요."
              className="w-full rounded-[12px] border border-divider py-[16px] pr-[14px] pl-[30px] text-[14px] font-semibold tracking-[-0.28px] text-black placeholder:text-line transition-colors hover:border-black hover:bg-page focus:border-black focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-center rounded-full border-2 border-black px-[24px] py-[13px] text-[14px] font-semibold tracking-[-0.28px] text-black transition-colors hover:bg-black hover:text-white"
        >
          비밀번호 변경 완료
        </button>
      </div>
    </div>
  );
}
