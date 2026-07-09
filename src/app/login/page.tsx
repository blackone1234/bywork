import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-stretch bg-page">
      <div className="hidden w-[800px] shrink-0 flex-col justify-between bg-black px-[100px] py-[120px] text-white md:flex">
        <span className="text-[14px] font-bold tracking-[-0.28px]">
          by BLACK
        </span>
        <h1 className="text-[50px] font-black leading-[50px] tracking-[-2px]">
          RE-
          <br />
          MARKABLE EXPERIENCE
          <br />
          X BLACK
        </h1>
      </div>

      <div className="flex flex-1 flex-col items-start justify-center gap-[40px] px-[10%] md:px-[180px]">
        <div className="flex w-full flex-col gap-[20px]">
          <span className="text-[20px] font-black tracking-[-0.4px] text-black">
            by WORKS
          </span>
          <p className="text-[16px] font-bold tracking-[-0.32px] text-black">
            Admin Dashboard
          </p>
        </div>

        <form className="flex w-full flex-col gap-[30px]">
          <div className="flex flex-col gap-[12px]">
            <input
              type="email"
              placeholder="admin@by-bk.com"
              className="w-[300px] rounded-[12px] border border-line py-[16px] pr-[14px] pl-[30px] text-[14px] font-semibold tracking-[-0.28px] text-black placeholder:text-line focus:outline-none"
            />
            <input
              type="password"
              placeholder="••••••••"
              className="w-[300px] rounded-[12px] border border-line py-[16px] pr-[14px] pl-[30px] text-[14px] font-semibold tracking-[-0.28px] text-black placeholder:text-line focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-full border-2 border-black px-[24px] py-[13px] text-[14px] font-semibold tracking-[-0.28px] text-black"
          >
            로그인
          </button>
        </form>

        <div className="flex w-full items-center justify-center pb-[5px]">
          <Link
            href="/forgot-password"
            className="flex items-center gap-[10px] text-[12px] font-medium tracking-[-0.24px] text-muted"
          >
            비밀번호를 잊으셨나요?
            <span aria-hidden>›</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
