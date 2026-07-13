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

export async function saveScheduleSettings(formData: FormData) {
  await assertAdminRequest();

  const standardStartTime = String(formData.get("startTime") ?? "");
  const standardEndTime = String(formData.get("endTime") ?? "");
  const workdays = formData
    .getAll("workdays")
    .map((value) => DAY_LABEL_TO_NUMBER[String(value)])
    .filter((value): value is number => Boolean(value))
    .sort((a, b) => a - b);

  if (!standardStartTime || !standardEndTime) {
    throw new Error("시작/종료 시간을 모두 입력해주세요.");
  }

  await updateCompanyScheduleSettings({ standardStartTime, standardEndTime, workdays });

  revalidatePath("/settings/work");
}

export async function saveLeavePolicySettings(formData: FormData) {
  await assertAdminRequest();

  const policyType = String(formData.get("policyType") ?? "");
  if (policyType !== "statutory" && policyType !== "manual") {
    throw new Error("휴가 정책을 선택해주세요.");
  }

  await updateLeavePolicy(policyType as LeavePolicyType);

  revalidatePath("/settings/work");
}

export async function saveGpsSettings(formData: FormData) {
  await assertAdminRequest();

  await updateCompanyGpsSettings({
    gpsLatitude: parseNullableNumber(formData.get("gpsLatitude")),
    gpsLongitude: parseNullableNumber(formData.get("gpsLongitude")),
    gpsRadiusM: parseNullableNumber(formData.get("gpsRadiusM")),
  });

  revalidatePath("/settings/work");
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
