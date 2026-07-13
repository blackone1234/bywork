import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertAdminRequest } from "@/lib/admin-guard";

export type HolidayApiStatus = {
  serviceName: string;
  connected: boolean;
  apiStatusLabel: string;
  annualHolidayCountLabel: string;
};

// 공공데이터포털 "한국천문연구원_특일 정보" API가 연동돼 있다(src/lib/holidaySync.ts).
// 페이지를 열 때마다 외부 API를 호출하면 무료 API의 일일 호출 한도를 금방 소진하므로,
// 여기서는 holidays 테이블(캐시)만 조회한다 — 실제 외부 호출은 "수동 갱신" 버튼을 눌렀을 때만
// (settings/system/actions.ts의 refreshHolidays) 일어난다. 그래서 "API 상태"는 외부 API의
// 응답이 아니라 이 조회 자체의 Supabase 왕복 시간이다. "연동됨" 배지는 HOLIDAY_API_KEY가
// 설정돼 있는지(=동기화를 실행할 수 있는지)를 보여준다.
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
    connected: Boolean(process.env.HOLIDAY_API_KEY),
    apiStatusLabel: `정상 (응답시간 ${elapsedMs}ms)`,
    annualHolidayCountLabel: `${holidayCount}일 (${year}년)`,
  };
}
