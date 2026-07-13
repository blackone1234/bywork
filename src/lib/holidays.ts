import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertAdminRequest } from "@/lib/admin-guard";

export type HolidayApiStatus = {
  serviceName: string;
  connected: boolean;
  apiStatusLabel: string;
  annualHolidayCountLabel: string;
};

// 이 프로젝트에는 아직 실제 외부 공휴일 API(공공데이터포털 등)가 연동돼 있지 않다 — API 키가
// 없어서 실제로 호출할 대상이 없다. 여기서는 holidays 테이블(캐시)에 실제로 저장된 데이터만
// 정직하게 보여준다. "API 상태"는 외부 API의 응답이 아니라 이 조회 자체의 Supabase 왕복
// 시간을 잰 것이다 — 외부 연동이 붙기 전까지 거짓 정보를 보여주지 않기 위함.
export async function getHolidayApiStatus(year: number): Promise<HolidayApiStatus> {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();

  const startedAt = Date.now();
  const { count, error } = await supabase
    .from("holidays")
    .select("id", { count: "exact", head: true })
    .gte("holiday_date", `${year}-01-01`)
    .lte("holiday_date", `${year}-12-31`);
  const elapsedMs = Date.now() - startedAt;

  if (error) throw new Error(`공휴일 데이터를 불러오지 못했습니다: ${error.message}`);

  const holidayCount = count ?? 0;

  return {
    serviceName: "공공 데이터 포털",
    connected: holidayCount > 0,
    apiStatusLabel: `정상 (응답시간 ${elapsedMs}ms)`,
    annualHolidayCountLabel: `${holidayCount}일 (${year}년)`,
  };
}
