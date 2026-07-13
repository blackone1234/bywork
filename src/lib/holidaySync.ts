import "server-only";
import { assertAdminRequest } from "@/lib/admin-guard";

// 공공데이터포털(data.go.kr) "한국천문연구원_특일 정보" API — getRestDeInfo(실제 쉬는 공휴일).
// solMonth를 생략하면 그 해 전체를 안 주기 때문에 1~12월을 순회해서 모은다.

export type FetchedHoliday = {
  date: string; // "YYYY-MM-DD"
  name: string;
};

type ApiItem = {
  dateName: string;
  isHoliday: "Y" | "N";
  locdate: number; // YYYYMMDD
};

type ApiResponse = {
  response: {
    header: { resultCode: string; resultMsg: string };
    body?: {
      // 결과가 0건이면 items가 빈 문자열로 오는 경우가 있어 방어적으로 처리한다.
      items?: { item?: ApiItem | ApiItem[] } | "";
      totalCount: number;
    };
  };
};

function toDateString(locdate: number): string {
  const raw = String(locdate);
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

async function fetchMonth(year: number, month: number): Promise<FetchedHoliday[]> {
  const key = process.env.HOLIDAY_API_KEY;
  const endpoint = process.env.HOLIDAY_API_ENDPOINT;
  if (!key || !endpoint) {
    throw new Error("HOLIDAY_API_KEY / HOLIDAY_API_ENDPOINT가 설정되지 않았습니다.");
  }

  // data.go.kr 서비스 키는 이미 URL-인코딩된("Encoding") 형태로 발급되는 경우가 많다.
  // URLSearchParams.set()으로 넣으면 그 인코딩을 다시 인코딩해버려서(%2B → %252B 식으로)
  // 키가 깨진다 — serviceKey만 그대로 이어붙이고, 나머지 값 없는 안전한 파라미터만
  // URLSearchParams로 만든다.
  const otherParams = new URLSearchParams({
    solYear: String(year),
    solMonth: String(month).padStart(2, "0"),
    numOfRows: "50",
    _type: "json",
  });
  const url = `${endpoint}/getRestDeInfo?serviceKey=${key}&${otherParams.toString()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`공휴일 API 호출에 실패했습니다 (HTTP ${res.status}).`);
  }

  const data = (await res.json()) as ApiResponse;
  if (data.response.header.resultCode !== "00") {
    throw new Error(`공휴일 API 오류: ${data.response.header.resultMsg}`);
  }

  const items = data.response.body?.items;
  if (!items) return [];

  const rawItem = items.item;
  if (!rawItem) return [];

  const list = Array.isArray(rawItem) ? rawItem : [rawItem];
  return list
    .filter((item) => item.isHoliday === "Y")
    .map((item) => ({ date: toDateString(item.locdate), name: item.dateName }));
}

/** 한 해치 공휴일을 월별로 순회하며 모두 가져온다. */
export async function fetchHolidaysForYear(year: number): Promise<FetchedHoliday[]> {
  await assertAdminRequest();

  const results: FetchedHoliday[] = [];
  // 무료 API는 초당 호출 제한이 있을 수 있어 병렬이 아니라 순차로 호출한다.
  for (let month = 1; month <= 12; month += 1) {
    const holidays = await fetchMonth(year, month);
    results.push(...holidays);
  }
  return results;
}
