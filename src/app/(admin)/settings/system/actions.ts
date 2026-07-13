"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRequest } from "@/lib/admin-guard";
import { changeAdminPassword } from "@/lib/adminAccount";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { fetchHolidaysForYear } from "@/lib/holidaySync";

export type ChangePasswordState = { error?: string; success?: boolean };

export async function saveAdminPassword(
  adminId: string,
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  await assertAdminRequest();

  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    return { error: "비밀번호는 최소 8자 이상 입력해주세요." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "비밀번호가 서로 일치하지 않습니다." };
  }

  try {
    await changeAdminPassword(adminId, newPassword);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다." };
  }

  revalidatePath("/settings/system");
  return { success: true };
}

export async function refreshHolidays() {
  await assertAdminRequest();

  const year = new Date().getFullYear();
  const holidays = await fetchHolidaysForYear(year);

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("holidays").upsert(
    holidays.map((holiday) => ({
      holiday_date: holiday.date,
      name: holiday.name,
      source: "api",
    })),
    { onConflict: "holiday_date" },
  );

  if (error) {
    throw new Error(`공휴일 데이터 저장에 실패했습니다: ${error.message}`);
  }

  revalidatePath("/settings/system");
}
