import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseSessionClient } from "@/lib/supabase/session";

// Supabase가 초대/비밀번호 재설정 이메일에 넣는 링크가 이 라우트로 온다. 이메일의 실제
// 인증 토큰(token_hash)은 링크를 "클릭"했을 때만 검증돼야 하므로(재사용 방지, 만료 확인) 서버
// 라우트에서 처리한다 — /reset-password로 바로 보내면 세션이 아직 없는 상태로 도착한다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (tokenHash && type) {
    const supabase = await createSupabaseSessionClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("만료되었거나 유효하지 않은 링크입니다.")}`,
  );
}
