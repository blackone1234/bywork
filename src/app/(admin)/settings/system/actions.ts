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

/** Toast 확산(2단계)을 위해 plain FormData 액션에서 useActionState 시그니처로 바꿨다 —
 * A11/A04/A08과 동일 패턴: throw 대신 { error } 반환, 성공 시 { success: true }. */
export type RefreshHolidaysState = { error?: string; success?: boolean };

// 정상 소요시간은 약 45초(공공데이터포털 API를 12개월치 순차 호출 — 레이트리밋 회피
// 목적의 기존 설계)다. 이보다 훨씬 넉넉한 3분을 stale 기준으로 잡아서, 과거 요청이
// 크래시 등으로 락을 못 풀고 죽은 경우에만 다음 요청이 강제로 재획득하게 한다.
const HOLIDAY_SYNC_STALE_MS = 3 * 60 * 1000;

export async function refreshHolidays(
  // useActionState 시그니처를 맞추기 위한 자리표시 인자 — 폼 필드가 없어 미사용.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: RefreshHolidaysState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<RefreshHolidaysState> {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const year = new Date().getFullYear();

  // 중복 요청 방어(락) — company_settings.holiday_sync_started_at이 null이거나
  // stale(3분 경과)일 때만 지금 시각으로 갱신하는 조건부 UPDATE 하나로 "확인 후 획득"을
  // 원자적으로 처리한다. 두 요청이 거의 동시에 들어와도(더블클릭, 여러 탭) Postgres가
  // 이 UPDATE 문 자체를 순차적으로 처리하므로 하나만 실제로 행을 갱신하고, 나머지는
  // WHERE 조건에 걸려 0행 반환 — 그걸로 "이미 진행 중"을 판별한다(SELECT 후 별도
  // UPDATE로 나누면 그 사이에 경쟁이 생겨 둘 다 통과할 수 있어 반드시 한 번에 처리).
  const staleBefore = new Date(Date.now() - HOLIDAY_SYNC_STALE_MS).toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from("company_settings")
    .update({ holiday_sync_started_at: new Date().toISOString() })
    .eq("id", 1)
    .or(`holiday_sync_started_at.is.null,holiday_sync_started_at.lt.${staleBefore}`)
    .select("id");

  if (claimError) {
    return { error: `공휴일 데이터 갱신에 실패했습니다: ${claimError.message}` };
  }
  if (!claimed || claimed.length === 0) {
    return { error: "공휴일 데이터 갱신이 이미 진행 중입니다. 잠시 후 다시 시도해주세요." };
  }

  try {
    const holidays = await fetchHolidaysForYear(year);

    const { error } = await supabase.from("holidays").upsert(
      holidays.map((holiday) => ({
        holiday_date: holiday.date,
        name: holiday.name,
        source: "api",
      })),
      { onConflict: "holiday_date" },
    );

    if (error) {
      return { error: `공휴일 데이터 저장에 실패했습니다: ${error.message}` };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "공휴일 데이터 갱신에 실패했습니다." };
  } finally {
    // 성공/실패 어느 쪽이든 락은 반드시 풀어야 다음 정상 요청이 3분을 기다리지 않는다.
    await supabase.from("company_settings").update({ holiday_sync_started_at: null }).eq("id", 1);
  }

  revalidatePath("/settings/system");
  return { success: true };
}
