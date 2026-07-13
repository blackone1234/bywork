"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRequest } from "@/lib/admin-guard";
import { changeAdminPassword } from "@/lib/adminAccount";

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

// 외부 공휴일 API가 아직 연동돼 있지 않아(API 키 없음), holidays 캐시 테이블을 다시 채울
// 방법이 없다 — 지금은 화면을 다시 그려서 현재 저장된 값만 다시 보여주는 수준의 자리표시자다.
export async function refreshHolidays() {
  await assertAdminRequest();
  revalidatePath("/settings/system");
}
