import "server-only";
import { getStandardEndTime } from "@/lib/companySettings";

/**
 * DB의 leave_cancel_deadline() SQL 함수와 동일한 공식(2026-07-27 CD 확정) —
 * "연차 시작일 전날, 회사 표준 퇴근시각까지"만 직원 본인 취소를 허용한다. 이 값은
 * "취소 버튼을 보여줄지" 판단하는 용도일 뿐 최종 강제는 항상 DB의
 * cancel_leave_request RPC가 한다(여기 계산이 어긋나도 DB가 최종 방어선).
 *
 * 규칙이 바뀔 수 있다는 전제가 있어(CD 지시), 이 계산 로직은 이 함수 하나와 SQL의
 * leave_cancel_deadline() 딱 두 곳에만 존재한다 — 나중에 규칙이 바뀌면 이 두 곳만
 * 같이 고치면 된다. 하드코딩 없이 company_settings.standard_end_time(A09)을
 * 참조한다(getStandardEndTime, 값 자체는 호출부가 한 번만 조회해서 넘겨준다 —
 * 목록의 행마다 매번 새로 DB 조회하지 않기 위해 순수 계산 함수로 분리).
 */
export function computeLeaveCancelDeadline(startDate: string, standardEndTime: string): Date {
  const dayBefore = new Date(`${startDate}T00:00:00Z`);
  dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
  const dayBeforeStr = dayBefore.toISOString().slice(0, 10);
  return new Date(`${dayBeforeStr}T${standardEndTime}:00+09:00`);
}

export async function getLeaveCancelDeadline(startDate: string): Promise<Date> {
  const standardEndTime = await getStandardEndTime();
  return computeLeaveCancelDeadline(startDate, standardEndTime);
}
