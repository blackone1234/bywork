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
  const { error } = await supabase
    .from("leave_policies")
    .update({ policy_type: policyType })
    .eq("id", 1);

  if (error) throw new Error(`휴가 정책 저장에 실패했습니다: ${error.message}`);
}
