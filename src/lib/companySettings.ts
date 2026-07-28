import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertAdminRequest } from "@/lib/admin-guard";

export type CompanySettings = {
  standardStartTime: string; // "HH:MM"
  standardEndTime: string; // "HH:MM"
  workdays: number[]; // 1=월 .. 7=일
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsRadiusM: number | null;
};

type CompanySettingsRow = {
  standard_start_time: string;
  standard_end_time: string;
  workdays: number[];
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_radius_m: number | null;
};

/** DB "time" columns come back as "HH:MM:SS"; <input type="time"> wants "HH:MM". */
function trimSeconds(time: string): string {
  return time.slice(0, 5);
}

const WORKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

/** company_settings.workdays(1=월..7=일) → "월,화,수,목,금" 같은 한글 라벨 문자열.
 * A04(직원상세) "요일" 필드가 회사 공통값을 그대로 보여주는 용도로 쓴다 — 직원별
 * 개별 요일 설정 자체가 스키마에 없다(A09 안내문과 동일한 전제: "개별설정 없는
 * 전 직원에 일괄 적용됩니다"). */
export function formatWorkdaysLabel(workdays: number[]): string {
  return [...workdays]
    .sort((a, b) => a - b)
    .map((day) => WORKDAY_LABELS[day - 1])
    .filter((label): label is string => Boolean(label))
    .join(",");
}

/**
 * 관리자 전용이 아니라 로그인한 직원 누구나 볼 수 있는 값(회사 표준 출근시간)만 반환한다 —
 * getCompanySettings()는 assertAdminRequest()로 관리자 세션만 허용해서 모바일 앱(직원
 * 세션)에서는 쓸 수 없다. 호출부(m/page.tsx)가 이미 getCurrentEmployee()로 인증을
 * 확인하므로 여기서 별도 세션 검사는 하지 않는다(attendanceAuth.ts의 checkGps와 동일 패턴).
 */
export async function getStandardStartTime(): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("company_settings")
    .select("standard_start_time")
    .eq("id", 1)
    .single<{ standard_start_time: string }>();

  if (error) throw new Error(`근무 설정을 불러오지 못했습니다: ${error.message}`);
  return trimSeconds(data.standard_start_time);
}

/** getStandardStartTime()과 동일한 이유로 관리자 게이트 없음 — 연차 취소 가능 여부
 * 판정(leaveCancellation.ts)에 직원 세션에서 쓴다. */
export async function getStandardEndTime(): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("company_settings")
    .select("standard_end_time")
    .eq("id", 1)
    .single<{ standard_end_time: string }>();

  if (error) throw new Error(`근무 설정을 불러오지 못했습니다: ${error.message}`);
  return trimSeconds(data.standard_end_time);
}

export async function getCompanySettings(): Promise<CompanySettings> {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("company_settings")
    .select("standard_start_time, standard_end_time, workdays, gps_latitude, gps_longitude, gps_radius_m")
    .eq("id", 1)
    .single<CompanySettingsRow>();

  if (error) throw new Error(`근무 설정을 불러오지 못했습니다: ${error.message}`);

  return {
    standardStartTime: trimSeconds(data.standard_start_time),
    standardEndTime: trimSeconds(data.standard_end_time),
    workdays: data.workdays,
    gpsLatitude: data.gps_latitude,
    gpsLongitude: data.gps_longitude,
    gpsRadiusM: data.gps_radius_m,
  };
}

// 탭마다(기본 근무 설정 / 인증 설정) 화면에 마운트된 필드가 다르므로, 저장 액션도 나눠서
// 다른 탭의 값을 건드리지 않게 한다 — 하나로 합쳤다면 비활성 탭의 필드가 폼에 없어 null로
// 덮어써질 위험이 있었다.

export async function updateCompanyScheduleSettings(input: {
  standardStartTime: string;
  standardEndTime: string;
  workdays: number[];
}) {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("company_settings")
    .update({
      standard_start_time: input.standardStartTime,
      standard_end_time: input.standardEndTime,
      workdays: input.workdays,
    })
    .eq("id", 1);

  if (error) throw new Error(`근무 설정 저장에 실패했습니다: ${error.message}`);
}

export async function updateCompanyGpsSettings(input: {
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsRadiusM: number | null;
}) {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("company_settings")
    .update({
      gps_latitude: input.gpsLatitude,
      gps_longitude: input.gpsLongitude,
      gps_radius_m: input.gpsRadiusM,
    })
    .eq("id", 1);

  if (error) throw new Error(`GPS 설정 저장에 실패했습니다: ${error.message}`);
}
