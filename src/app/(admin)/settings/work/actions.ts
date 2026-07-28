"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRequest } from "@/lib/admin-guard";
import { updateCompanyScheduleSettings, updateCompanyGpsSettings } from "@/lib/companySettings";
import { updateLeavePolicy, type LeavePolicyType } from "@/lib/leavePolicies";
import { addIpWhitelistEntry, deleteIpWhitelistEntry } from "@/lib/ipWhitelist";

const DAY_LABEL_TO_NUMBER: Record<string, number> = {
  월: 1,
  화: 2,
  수: 3,
  목: 4,
  금: 5,
  토: 6,
  일: 7,
};

function parseNullableNumber(value: FormDataEntryValue | null): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * A11(근무설정) 3탭의 저장 액션이 공유하는 상태 — Toast 파일럿을 위해 plain FormData
 * 액션에서 useActionState 시그니처로 바꿨다. AdminPasswordForm(A12)과 동일한 패턴:
 * 검증 실패/예외는 throw 대신 { error }로 반환해서 기존 role="alert" 인라인 표시를
 * 그대로 쓰고, 성공하면 { success: true }를 반환해서 WorkSettingsTabs가 Toast를 띄운다.
 */
export type SaveSettingsState = { error?: string; success?: boolean };

export async function saveScheduleSettings(
  _prevState: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  await assertAdminRequest();

  const standardStartTime = String(formData.get("startTime") ?? "");
  const standardEndTime = String(formData.get("endTime") ?? "");
  const workdays = formData
    .getAll("workdays")
    .map((value) => DAY_LABEL_TO_NUMBER[String(value)])
    .filter((value): value is number => Boolean(value))
    .sort((a, b) => a - b);

  if (!standardStartTime || !standardEndTime) {
    return { error: "시작/종료 시간을 모두 입력해주세요." };
  }

  try {
    await updateCompanyScheduleSettings({ standardStartTime, standardEndTime, workdays });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "근무 설정 저장에 실패했습니다." };
  }

  revalidatePath("/settings/work");
  return { success: true };
}

export async function saveLeavePolicySettings(
  _prevState: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  await assertAdminRequest();

  const policyType = String(formData.get("policyType") ?? "");
  if (policyType !== "statutory" && policyType !== "manual") {
    return { error: "휴가 정책을 선택해주세요." };
  }

  try {
    await updateLeavePolicy(policyType as LeavePolicyType);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "휴가 정책 저장에 실패했습니다." };
  }

  revalidatePath("/settings/work");
  return { success: true };
}

export async function saveGpsSettings(
  _prevState: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  await assertAdminRequest();

  try {
    await updateCompanyGpsSettings({
      gpsLatitude: parseNullableNumber(formData.get("gpsLatitude")),
      gpsLongitude: parseNullableNumber(formData.get("gpsLongitude")),
      gpsRadiusM: parseNullableNumber(formData.get("gpsRadiusM")),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "GPS 설정 저장에 실패했습니다." };
  }

  revalidatePath("/settings/work");
  return { success: true };
}

export async function addIpEntry(formData: FormData) {
  await assertAdminRequest();

  const ipAddress = String(formData.get("ipAddress") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();

  if (!ipAddress) {
    throw new Error("IP 주소를 입력해주세요.");
  }

  await addIpWhitelistEntry(ipAddress, label);

  revalidatePath("/settings/work");
}

export async function deleteIpEntry(id: string) {
  await assertAdminRequest();

  await deleteIpWhitelistEntry(id);

  revalidatePath("/settings/work");
}
