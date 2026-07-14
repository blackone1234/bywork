"use server";

import { redirect } from "next/navigation";
import { assertAdminRequest } from "@/lib/admin-guard";
import { changeAdminPassword } from "@/lib/adminAccount";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createSupabaseSessionClient } from "@/lib/supabase/session";
import { fetchHolidaysForYear } from "@/lib/holidaySync";
import { revalidatePath } from "next/cache";

export type ChangePasswordState = { error?: string };

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

  // 비밀번호를 바꾸면 Supabase가 지금 세션을 무효화한다. 그 상태로 이 페이지를 그대로
  // revalidatePath해서 다시 그리면, 재렌더링 중 세션 조회(getCurrentAdmin)가 실패해서
  // 에러 화면이 뜬다 — 실제로 이 화면에서 겪은 문제다. 그래서 여기서 세션을 정리하고
  // 새 비밀번호로 다시 로그인하도록 안내한다.
  const sessionClient = await createSupabaseSessionClient();
  await sessionClient.auth.signOut();
  redirect(`/login?message=${encodeURIComponent("비밀번호가 변경됐습니다. 새 비밀번호로 다시 로그인해주세요.")}`);
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
