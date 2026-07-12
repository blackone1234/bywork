import Link from "next/link";
import { TextField } from "@/components/admin/TextField";
import { Button } from "@/components/admin/Button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-stretch bg-page">
      <div className="hidden w-[800px] shrink-0 flex-col justify-between bg-black px-[100px] py-[120px] text-white lg:flex">
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

      <div className="flex flex-1 flex-col items-center justify-center px-6 sm:px-[10%] lg:items-start lg:px-[180px]">
        <div className="flex w-full max-w-[420px] flex-col gap-[40px]">
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
              <TextField type="email" placeholder="admin@by-bk.com" fullWidth />
              <TextField type="password" placeholder="••••••••" fullWidth />
            </div>

            <Button type="submit" variant="outline-pill" className="w-full">
              로그인
            </Button>
          </form>

          <div className="flex w-full items-center justify-center pb-[5px]">
            <Link
              href="/forgot-password"
              className="flex items-center gap-[10px] text-[12px] font-medium tracking-[-0.24px] text-muted transition-colors hover:text-black hover:underline"
            >
              비밀번호를 잊으셨나요?
              <span aria-hidden>›</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
