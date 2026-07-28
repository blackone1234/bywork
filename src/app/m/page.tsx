import { redirect } from "next/navigation";
import { MobileHomeHeader, MobileGreeting } from "@/components/mobile/Header";
import { MobileHeaderBadge, MobilePendingReviewBadge } from "@/components/mobile/StatusBadge";
import { MobileBottomNav } from "@/components/mobile/BottomNav";
import { MobileTabTransition } from "@/components/mobile/TabTransition";
import { MobileWeekdayHoursRow, MobileResidualLeaveRow, MobileWeeklyProgress, MobileHomeInfoRow } from "@/components/mobile/HomeBlocks";
import { ClockIcon } from "@/components/mobile/icons";
import { getCurrentEmployee, EMPLOYEE_SESSION_EXPIRED_MESSAGE } from "@/lib/employeeAccount";
import { getTodayAttendanceState, type AttendanceEventType } from "@/lib/attendanceEvents";
import { getThisWeekWeekdayHours, type WeekdayHoursEntry } from "@/lib/employeeAttendanceStats";
import { getLeaveBalance } from "@/lib/employeeLeaveRequests";
import { getStandardStartTime } from "@/lib/companySettings";
import type { AuthMethodDb } from "@/lib/employees";
import { AttendanceActionButton, AttendanceWorkingButtons } from "./AttendanceButtons";

export const dynamic = "force-dynamic";

const WEEKLY_LEGAL_LIMIT_HOURS = 52;

type HomeState = "before" | "working" | "out" | "field" | "done";

const LAST_EVENT_TO_STATE: Record<AttendanceEventType | "none", HomeState> = {
  none: "before",
  check_in: "working",
  return: "working",
  go_out_personal: "out",
  go_out_business: "field",
  check_out: "done",
};

function formatTodayLabel(): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
}

function formatTimeKST(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "경과 N시간 M분" — from~to(생략 시 now) 사이 raw 경과(외출 시간 차감 없음, admin A08 hoursBetween과 동일 관례). */
function formatElapsedLabel(fromIso: string, toIso?: string): string {
  const { h, m } = diffHm(fromIso, toIso);
  return `경과 ${h}시간 ${m}분`;
}

/** "8h 57m" — S07 완료 상태 총 근무시간 표기. */
function formatDurationShort(fromIso: string, toIso?: string): string {
  const { h, m } = diffHm(fromIso, toIso);
  return `${h}h ${m}m`;
}

function diffHm(fromIso: string, toIso?: string): { h: number; m: number } {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  const totalMinutes = Math.max(0, Math.round((to - from) / 60_000));
  return { h: Math.floor(totalMinutes / 60), m: totalMinutes % 60 };
}

/** S03~S07 — 홈의 5개 상태(출근전/근무중/외출중/외근중/퇴근후). 오늘자 attendance_events로 실제 상태를 판단한다. */
export default async function MobileHomePage() {
  // getStandardStartTime()은 employee.id에 의존하지 않으므로, employee 조회/오늘자 근태
  // 조회와 동시에 시작해서 나중 Promise.all wave까지 기다리지 않게 한다(waterfall 진단
  // 결과 반영 — 이 함수만 별도 라운드트립 wave에 묶여 불필요하게 지연되고 있었음).
  const standardStartTimePromise = getStandardStartTime();
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect(`/m/login?error=${encodeURIComponent(EMPLOYEE_SESSION_EXPIRED_MESSAGE)}`);
  }

  const today = await getTodayAttendanceState(employee.id);
  const homeState = LAST_EVENT_TO_STATE[today.lastEventType];

  const firstCheckIn = today.events.find((e) => e.eventType === "check_in");
  const lastGoOut = [...today.events].reverse().find((e) => e.eventType === "go_out_personal" || e.eventType === "go_out_business");
  const lastCheckOut = [...today.events].reverse().find((e) => e.eventType === "check_out");

  const [weekdayHours, leaveBalance, standardStartTime] = await Promise.all([
    getThisWeekWeekdayHours(employee.id),
    getLeaveBalance(employee.id),
    standardStartTimePromise,
  ]);
  const residualLeaveDays = leaveBalance.annual - leaveBalance.used;
  const weeklyTotalHours = weekdayHours.reduce((sum, d) => sum + (d.hours ? Number(d.hours.replace("h", "")) : 0), 0);
  const weeklyPercent = Math.min(100, Math.round((weeklyTotalHours / WEEKLY_LEGAL_LIMIT_HOURS) * 100));

  return (
    <MobileTabTransition>
      {/* 하단 네비가 fixed로 바뀌면서(스크롤해도 항상 고정) 정상 흐름에서 빠졌다 — 마지막
          콘텐츠가 네비에 가려지지 않도록 실측한 네비 높이(pb-[110px])만큼 여백을 확보한다. */}
      <div className="flex min-h-screen w-full flex-col bg-[var(--mobile-color-black)] pb-[110px]">
        <div className="flex w-full flex-col">
          {/* MobileHomeHeader가 자체적으로 px-30을 갖고 있다 — Figma에서 TOP과 #Contents가
              형제 블록으로 각각 독립적인 좌우 패딩을 갖기 때문. 여기서 또 px-30을 씌우면
              헤더만 이중으로 좁아진다(스크린샷 대조로 발견). */}
          <MobileHomeHeader hasAlert />
          <div className="flex w-full flex-col gap-[52px] px-[var(--mobile-space-30)] py-[60px]">
            <HomeContent
              state={homeState}
              employeeName={employee.name}
              authMethod={employee.authMethod}
              checkInAt={firstCheckIn?.occurredAt}
              goOutAt={lastGoOut?.occurredAt}
              checkOutAt={lastCheckOut?.occurredAt}
              weekdayHours={weekdayHours}
              residualLeaveDays={residualLeaveDays}
              weeklyTotalHours={weeklyTotalHours}
              weeklyPercent={weeklyPercent}
              standardStartTime={standardStartTime}
              pendingReviewCount={today.pendingReviewCount}
            />
          </div>
        </div>
        <MobileBottomNav active="home" theme="dark" />
      </div>
    </MobileTabTransition>
  );
}

function HomeContent({
  state,
  employeeName,
  authMethod,
  checkInAt,
  goOutAt,
  checkOutAt,
  weekdayHours,
  residualLeaveDays,
  weeklyTotalHours,
  weeklyPercent,
  standardStartTime,
  pendingReviewCount,
}: {
  state: HomeState;
  employeeName: string;
  authMethod: AuthMethodDb;
  checkInAt?: string;
  goOutAt?: string;
  checkOutAt?: string;
  weekdayHours: WeekdayHoursEntry[];
  residualLeaveDays: number;
  weeklyTotalHours: number;
  weeklyPercent: number;
  standardStartTime: string;
  /** S04~S07("검토대기중 N건" 마킹) — S03(출근전)은 요구사항 범위 밖이라 받아만 두고 안 쓴다. */
  pendingReviewCount: number;
}) {
  const todayLabel = formatTodayLabel();
  const weeklyTotalLabel = `${Math.floor(weeklyTotalHours)}h ${Math.round((weeklyTotalHours % 1) * 60)}m`;

  if (state === "before") {
    // 파일럿(A) — S03만 스태거 등장 적용(다른 홈 상태/화면은 확산 여부 결정 전까지 그대로).
    return (
      <>
        <div className="stagger-item" style={{ animationDelay: "0ms" }}>
          <MobileGreeting name={employeeName} date={todayLabel} />
        </div>
        <div className="stagger-item flex w-full flex-col items-center gap-[var(--mobile-space-24)]" style={{ animationDelay: "70ms" }}>
          <div className="flex w-full items-center justify-between">
            <p className="text-[82px] leading-[72px] font-bold tracking-[-1.64px] text-[var(--mobile-color-white)]">{standardStartTime}</p>
            <div className="flex flex-col items-end gap-[16px]">
              <MobileHeaderBadge>출근전</MobileHeaderBadge>
              <p className="text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-line-gray)]">
                정규 출근 시간
              </p>
            </div>
          </div>
          <AttendanceActionButton eventType="check_in" authMethod={authMethod} variant="filled-accent">
            출근하기
          </AttendanceActionButton>
        </div>
        <div className="stagger-item" style={{ animationDelay: "140ms" }}>
          <MobileWeekdayHoursRow label="이번 주 근무현황" days={weekdayHours} />
        </div>
        <div className="stagger-item" style={{ animationDelay: "210ms" }}>
          <MobileResidualLeaveRow days={`${residualLeaveDays}일`} />
        </div>
      </>
    );
  }

  if (state === "working" && checkInAt) {
    // 그룹1(A 확산) — S04, S03과 동일 컴포넌트 구조라 .stagger-item 그대로 재사용.
    return (
      <>
        <div className="stagger-item" style={{ animationDelay: "0ms" }}>
          <MobileGreeting name={employeeName} date={todayLabel} />
        </div>
        <div className="stagger-item flex w-full flex-col items-center gap-[var(--mobile-space-24)]" style={{ animationDelay: "70ms" }}>
          <ClockDisplay
            badge={<MobileHeaderBadge variant="filled">근무중</MobileHeaderBadge>}
            pendingReviewCount={pendingReviewCount}
            time={formatTimeKST(checkInAt)}
            elapsed={formatElapsedLabel(checkInAt)}
          />
          <AttendanceWorkingButtons authMethod={authMethod} />
        </div>
        <div className="stagger-item" style={{ animationDelay: "140ms" }}>
          <MobileWeeklyProgress current={weeklyTotalLabel} total={`${WEEKLY_LEGAL_LIMIT_HOURS}h`} percent={weeklyPercent} />
        </div>
      </>
    );
  }

  if ((state === "out" || state === "field") && checkInAt && goOutAt) {
    const label = state === "out" ? "외출중" : "외근중";
    // 그룹1(A 확산) — S05/S06, S03과 동일 컴포넌트 구조라 .stagger-item 그대로 재사용.
    return (
      <>
        <div className="stagger-item" style={{ animationDelay: "0ms" }}>
          <MobileGreeting name={employeeName} date={todayLabel} />
        </div>
        <div className="stagger-item flex w-full flex-col items-center gap-[var(--mobile-space-24)]" style={{ animationDelay: "70ms" }}>
          <ClockDisplay
            badge={<MobileHeaderBadge>{label}</MobileHeaderBadge>}
            pendingReviewCount={pendingReviewCount}
            time={formatTimeKST(checkInAt)}
            elapsed={formatElapsedLabel(goOutAt)}
          />
          <AttendanceActionButton eventType="return" authMethod={authMethod} variant="filled-accent">
            복귀하기
          </AttendanceActionButton>
        </div>
        <div className="stagger-item" style={{ animationDelay: "140ms" }}>
          <MobileHomeInfoRow
            items={[
              { label: "출근", value: formatTimeKST(checkInAt) },
              { label: "외출", value: formatTimeKST(goOutAt) },
              { label: "순 근무", value: formatDurationShort(checkInAt, goOutAt) },
            ]}
          />
        </div>
      </>
    );
  }

  if (state === "done" && checkInAt && checkOutAt) {
    // 그룹1(A 확산) — S07, S03과 동일 컴포넌트 구조라 .stagger-item 그대로 재사용.
    return (
      <>
        <div className="stagger-item flex w-full items-start justify-center gap-[var(--mobile-space-12)]" style={{ animationDelay: "0ms" }}>
          <p className="flex-1 text-[28px] leading-[36px] font-extrabold tracking-[-0.56px] text-[var(--mobile-color-white)]">
            수고하셨습니다!
          </p>
          <p className="pt-[2px] text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
            {todayLabel}
          </p>
        </div>
        <div className="stagger-item flex w-full flex-col items-center gap-[var(--mobile-space-24)]" style={{ animationDelay: "70ms" }}>
          <div className="flex w-full flex-col items-center gap-[20px]">
            <div className="flex items-start gap-[6px]">
              <MobileHeaderBadge width="auto">퇴근완료</MobileHeaderBadge>
              <MobilePendingReviewBadge count={pendingReviewCount} />
            </div>
            <div className="flex flex-col items-center gap-[16px] text-center">
              <p className="text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-line-gray)]">
                오늘 총 근무시간
              </p>
              <p className="text-[72px] leading-[52px] font-bold tracking-[-1.44px] text-[var(--mobile-color-white)]">
                {formatDurationShort(checkInAt, checkOutAt)}
              </p>
              <div className="flex items-center gap-[12px]">
                <ClockIcon className="size-5 text-[var(--mobile-color-mint)]" />
                <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-mint)]">
                  {formatElapsedLabel(checkInAt, checkOutAt)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex w-full items-center justify-center rounded-[var(--mobile-radius-pill)] bg-[var(--mobile-color-white)] px-[var(--mobile-space-24)] pt-[18px] pb-[19px]">
            <p className="text-[length:var(--mobile-text-subtitle)] font-bold tracking-[var(--mobile-text-subtitle-tracking)] text-[var(--mobile-color-black)]">
              오늘 근무 정상 완료하였습니다!
            </p>
          </div>
        </div>
        <div className="stagger-item flex w-full flex-col gap-[6px]" style={{ animationDelay: "140ms" }}>
          <MobileWeeklyProgress current={weeklyTotalLabel} total={`${WEEKLY_LEGAL_LIMIT_HOURS}h`} percent={weeklyPercent} />
          <MobileWeekdayHoursRow days={weekdayHours} />
        </div>
      </>
    );
  }

  // 데이터 정합성이 아직 안 맞는 과도 상태(예: DB에 last event는 있는데 필요한 타임스탬프가
  // 없는 경우) — 실사용에서는 발생하지 않아야 하지만 방어적으로 출근전 화면으로 폴백한다.
  return (
    <>
      <MobileGreeting name={employeeName} date={todayLabel} />
      <div className="flex w-full flex-col items-center gap-[var(--mobile-space-24)]">
        <div className="flex w-full items-center justify-between">
          <p className="text-[82px] leading-[72px] font-bold tracking-[-1.64px] text-[var(--mobile-color-white)]">09:00</p>
          <div className="flex flex-col items-end gap-[16px]">
            <MobileHeaderBadge>출근전</MobileHeaderBadge>
            <p className="text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-line-gray)]">
              정규 출근 시간
            </p>
          </div>
        </div>
        <AttendanceActionButton eventType="check_in" authMethod={authMethod} variant="filled-accent">
          출근하기
        </AttendanceActionButton>
      </div>
      <MobileWeekdayHoursRow label="이번 주 근무현황" days={weekdayHours} />
      <MobileResidualLeaveRow days={`${residualLeaveDays}일`} />
    </>
  );
}

function ClockDisplay({
  badge,
  pendingReviewCount,
  time,
  elapsed,
}: {
  badge: React.ReactNode;
  pendingReviewCount: number;
  time: string;
  elapsed: string;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-[20px]">
      <div className="flex items-start gap-[6px]">
        {badge}
        <MobilePendingReviewBadge count={pendingReviewCount} />
      </div>
      <div className="flex flex-col items-center gap-[20px] px-[20px]">
        <div className="flex items-center gap-[16px] pr-[44px]">
          <p className="text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-line-gray)]">
            출근시각
          </p>
          <p className="text-[72px] leading-[52px] font-bold tracking-[-1.44px] text-[var(--mobile-color-white)]">{time}</p>
        </div>
        <div className="flex items-center gap-[12px]">
          <ClockIcon className="size-5 text-[var(--mobile-color-mint)]" />
          <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-mint)]">
            {elapsed}
          </p>
        </div>
      </div>
    </div>
  );
}
