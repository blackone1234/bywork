"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertAdminRequest } from "@/lib/admin-guard";

// TODO(auth): processed_by는 admin_profiles(실제 관리자 로그인 세션)를 참조하는데, 이 앱에는
// 아직 그 로그인 시스템이 없다(지금은 src/proxy.ts의 임시 Basic Auth 게이트뿐). 그래서 매번
// null로 남긴다 — 로그인이 붙으면 여기에 실제 admin_profiles.id를 채워 넣어야 한다.

export async function approveLeaveRequest(requestId: string) {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("approve_leave_request", {
    p_request_id: requestId,
    p_processed_by: null,
  });

  if (error) {
    throw new Error(`휴가 승인에 실패했습니다: ${error.message}`);
  }

  revalidatePath("/leave-requests");
}

export async function rejectLeaveRequest(requestId: string) {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("reject_leave_request", {
    p_request_id: requestId,
    p_processed_by: null,
  });

  if (error) {
    throw new Error(`휴가 반려에 실패했습니다: ${error.message}`);
  }

  revalidatePath("/leave-requests");
}
