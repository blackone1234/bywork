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
