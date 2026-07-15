import { redirect } from "next/navigation";
import { createSupabaseSessionClient } from "@/lib/supabase/session";
import { MobileRegisterPasswordForm } from "./MobileRegisterPasswordForm";

/**
 * S02 — 비밀번호 등록. 관리자 reset-password/page.tsx와 동일한 패턴: 초대 이메일의
 * /auth/confirm?next=/m/register-password 링크를 거쳐야만 세션이 있다. 세션 없이 이
 * URL에 직접 접속하면(링크 없이, 만료된 링크 등) 로그인 화면으로 돌려보낸다.
 */
export default async function MobileRegisterPasswordPage() {
  const supabase = await createSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/m/login?error=${encodeURIComponent("비밀번호 등록 링크를 통해 다시 접속해주세요.")}`);
  }

  return <MobileRegisterPasswordForm />;
}
