"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertAdminRequest } from "@/lib/admin-guard";

export async function approveLeaveRequest(requestId: string) {
  const admin = await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("approve_leave_request", {
    p_request_id: requestId,
    p_processed_by: admin.id,
  });

  if (error) {
    throw new Error(`휴가 승인에 실패했습니다: ${error.message}`);
  }

  revalidatePath("/leave-requests");
}

export async function rejectLeaveRequest(requestId: string) {
  const admin = await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("reject_leave_request", {
    p_request_id: requestId,
    p_processed_by: admin.id,
  });

  if (error) {
    throw new Error(`휴가 반려에 실패했습니다: ${error.message}`);
  }

  revalidatePath("/leave-requests");
}
