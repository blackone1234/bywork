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

  // 이 라우트는 관리자용(next=/reset-password)과 모바일 직원용(next=/m/register-password,
  // 초대/재설정/재입사 전부 여기로 옴) 링크가 같이 거쳐간다 — 검증 실패 시에도 원래
  // 어디로 가려던 링크였는지에 맞는 로그인 화면으로 보내야 한다. 안 그러면 모바일
  // 초대 링크가 만료됐을 때 393px 화면 대신 데스크톱 관리자 로그인 화면이 뜨는
  // 버그가 난다(실제 발견됨).
  const loginPath = next.startsWith("/m/") ? "/m/login" : "/login";
  return NextResponse.redirect(
    `${origin}${loginPath}?error=${encodeURIComponent("만료되었거나 유효하지 않은 링크입니다.")}`,
  );
}
