import "server-only";
import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createSupabaseSessionClient } from "@/lib/supabase/session";
import type { AuthMethodDb } from "@/lib/employees";

export type EmployeeAccount = {
  id: string;
  name: string;
  email: string;
  hireDate: string;
  authMethod: AuthMethodDb;
  employmentStatus: "active" | "on_leave" | "terminated";
};

/** getCurrentEmployee()가 null일 때(E03 세션만료 배너 통일, 2026-07-22) /m/*의 8개
 * page.tsx가 전부 이 문구로 /m/login?error=...로 리다이렉트한다 — 화면마다 다른
 * 문구로 흩어지지 않도록 한 곳에서 관리. */
export const EMPLOYEE_SESSION_EXPIRED_MESSAGE = "로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.";

/**
 * adminAccount.ts의 getCurrentAdmin과 같은 패턴 — employees는 auth_user_id 컬럼으로
 * auth.users와 연결된다는 점만 다르다(admin_profiles는 id로 직접 연결). React `cache()`로
 * 감싸서 같은 요청 내 중복 호출 시 실제 네트워크 호출 없이 결과를 재사용한다(waterfall
 * 진단 결과 반영 — adminAccount.ts의 getCurrentAdmin과 동일한 이유).
 */
export const getCurrentEmployee = cache(async (): Promise<EmployeeAccount | null> => {
  const sessionClient = await createSupabaseSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) return null;

  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("employees")
    .select("id, name, email, hire_date, auth_method, employment_status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(`직원 계정 정보를 불러오지 못했습니다: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    hireDate: data.hire_date,
    authMethod: data.auth_method,
    employmentStatus: data.employment_status,
  };
});
