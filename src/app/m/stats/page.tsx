import { redirect } from "next/navigation";
import { MobileTabRootHeader } from "@/components/mobile/Header";
import { MobileBottomNav } from "@/components/mobile/BottomNav";
import { MobileTabTransition } from "@/components/mobile/TabTransition";
import { getCurrentEmployee, EMPLOYEE_SESSION_EXPIRED_MESSAGE } from "@/lib/employeeAccount";
import { getLeaveBalance } from "@/lib/employeeLeaveRequests";
import { getMonthlyStats, getYearlyStats } from "@/lib/employeeAttendanceStats";
import { StatsView } from "./StatsView";

export const dynamic = "force-dynamic";

function kstYearMonth(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" })
    .format(new Date())
    .split("-");
  return { year: Number(parts[0]), month: Number(parts[1]) };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** month는 1~12 범위 밖으로 넘어가도(0 또는 13) 정상 처리 — 연 경계를 넘는 이전/다음달 계산용. */
function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

function monthHref(year: number, month: number): string {
  return `/m/stats?year=${year}&month=${pad2(month)}`;
}

/** 연간 탭 이동은 month를 안 실어서, 월간 탭으로 돌아가면 항상 그 해의 "오늘 달"부터
 * 다시 보여준다(임의로 낡은 월을 들고 있지 않도록). */
function yearHref(year: number): string {
  return `/m/stats?year=${year}`;
}

/** S13/S14 — 통계 (light, 통계 탭 루트). ?year=&month= 쿼리로 다른 달/해를 조회할 수
 * 있고(없으면 오늘이 속한 달/해), 월간/연간 둘 다 여기서 미리 조회해서 StatsView(클라이언트)에
 * 넘긴다 — 탭 전환 자체는 페이지 이동이 아니라 클라이언트 상태라서. */
export default async function MobileStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect(`/m/login?error=${encodeURIComponent(EMPLOYEE_SESSION_EXPIRED_MESSAGE)}`);
  }

  const params = await searchParams;
  const today = kstYearMonth();
  const year = Number(params.year) || today.year;
  const month = Number(params.month) || today.month;

  const [monthly, yearly, leaveBalance] = await Promise.all([
    getMonthlyStats(employee.id, year, month),
    getYearlyStats(employee.id, year),
    getLeaveBalance(employee.id),
  ]);

  const monthPrev = addMonths(year, month, -1);
  const monthNext = addMonths(year, month, 1);

  return (
    <MobileTabTransition>
    {/* 하단 네비가 fixed로 바뀌면서(스크롤해도 항상 고정) 정상 흐름에서 빠졌다 — 마지막
        콘텐츠가 네비에 가려지지 않도록 실측한 네비 높이(pb-[110px])만큼 여백을 확보한다. */}
    <div className="flex min-h-screen w-full flex-col bg-[var(--mobile-color-white)] pb-[110px]">
      <div className="flex w-full flex-col gap-[30px]">
        {/* get_design_context 재확인: "통계" 타이틀은 24px ExtraBold(S10 "휴가현황"과 동일)라
            size="sm"(20px)이 아니라 기본값(md)이어야 한다. */}
        <MobileTabRootHeader title="통계" />
        <StatsView
          year={year}
          month={month}
          monthly={monthly}
          yearly={yearly}
          leaveAnnual={leaveBalance.annual}
          leaveUsed={leaveBalance.used}
          monthPrevHref={monthHref(monthPrev.year, monthPrev.month)}
          monthNextHref={monthHref(monthNext.year, monthNext.month)}
          yearPrevHref={yearHref(year - 1)}
          yearNextHref={yearHref(year + 1)}
        />
      </div>
      <MobileBottomNav active="stats" theme="light" />
    </div>
    </MobileTabTransition>
  );
}
