import "server-only";
import { getCurrentAdmin, type AdminAccount } from "@/lib/adminAccount";

/**
 * 실제 관리자 로그인 세션을 검사한다 — 로그인 안 됐거나, 로그인은 됐지만 admin_profiles에
 * 없는 사용자(예: 나중에 생길 직원용 앱 계정)면 던진다. proxy.ts가 페이지 단에서 이미
 * "세션이 있는지"는 걸러내지만(없으면 /login으로 리다이렉트), admin_profiles 소속 여부까지는
 * proxy에서 매 요청마다 DB를 조회하지 않고 여기서만 확인한다 — Next.js가 권고하는 대로
 * proxy matcher만 믿지 않고 액션/데이터 조회 쪽에서 다시 확인하는 것이기도 하다.
 */
export async function assertAdminRequest(): Promise<AdminAccount> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error("인증되지 않은 요청입니다.");
  }
  return admin;
}
