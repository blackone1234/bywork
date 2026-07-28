import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertAdminRequest } from "@/lib/admin-guard";

export type LeavePolicyType = "statutory" | "manual";

export async function getLeavePolicy(): Promise<LeavePolicyType> {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("leave_policies")
    .select("policy_type")
    .eq("id", 1)
    .single();

  if (error) throw new Error(`휴가 정책을 불러오지 못했습니다: ${error.message}`);

  return data.policy_type as LeavePolicyType;
}

export async function updateLeavePolicy(policyType: LeavePolicyType) {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  // set_leave_policy RPC(20260723000000 마이그레이션) — statutory에서 manual로 처음
  // 전환하는 순간, 아직 한 번도 수동 입력된 적 없는 직원들의 annual_leave_days에 그
  // 시점의 계산값을 스냅샷으로 채워 넣는 작업까지 정책 전환과 하나의 트랜잭션으로
  // 원자적으로 처리한다(단순 update로 나누면 그 사이 경쟁 상태가 생길 수 있어서).
  const { error } = await supabase.rpc("set_leave_policy", { p_policy_type: policyType });

  if (error) throw new Error(`휴가 정책 저장에 실패했습니다: ${error.message}`);
}
