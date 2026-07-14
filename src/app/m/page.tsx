import { MobileHomeHeader, MobileGreeting } from "@/components/mobile/Header";
import { MobileHeaderBadge } from "@/components/mobile/StatusBadge";
import { MobileButton } from "@/components/mobile/Button";
import { MobileBottomNav } from "@/components/mobile/BottomNav";
import { MobileWeekdayHoursRow, MobileResidualLeaveRow, MobileWeeklyProgress, MobileHomeInfoRow } from "@/components/mobile/HomeBlocks";
import { ClockIcon } from "@/components/mobile/icons";

/** S03~S07이 공유하는 "이번 주 근무현황" 목-금 미기록 목데이터. */
const WEEK_DAYS = [
  { day: "월", hours: "8h" },
  { day: "화", hours: "8h" },
  { day: "수", hours: "8h" },
  { day: "목", hours: null },
  { day: "금", hours: null },
];

type HomeState = "before" | "working" | "out" | "field" | "done";

/**
 * S03~S07 — 홈의 5개 상태(출근전/근무중/외출중/외근중/퇴근후).
 * 아직 Supabase 근태 데이터에 연결되지 않아 ?state= 쿼리로 상태를 바꿔볼 수 있게 해뒀다 —
 * 실제 연동 시 이 쿼리 파라미터 대신 오늘자 근태 레코드로 상태를 판단하도록 교체한다.
 */
export default async function MobileHomePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const homeState: HomeState = isHomeState(state) ? state : "before";

  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-[var(--mobile-color-black)]">
      <div className="flex w-full flex-col">
        {/* MobileHomeHeader가 자체적으로 px-30을 갖고 있다 — Figma에서 TOP과 #Contents가
            형제 블록으로 각각 독립적인 좌우 패딩을 갖기 때문. 여기서 또 px-30을 씌우면
            헤더만 이중으로 좁아진다(스크린샷 대조로 발견). */}
        <MobileHomeHeader hasAlert />
        <div className="flex w-full flex-col gap-[52px] px-[var(--mobile-space-30)] py-[60px]">
          <HomeContent state={homeState} />
        </div>
      </div>
      <MobileBottomNav active="home" theme="dark" />
    </div>
  );
}

function isHomeState(value: string | undefined): value is HomeState {
  return value === "before" || value === "working" || value === "out" || value === "field" || value === "done";
}

function HomeContent({ state }: { state: HomeState }) {
  if (state === "before") {
    return (
      <>
        <MobileGreeting name="이동석" date="2026년 7월 2일 목요일" />
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
          <MobileButton variant="filled-accent">출근하기</MobileButton>
        </div>
        <div className="flex w-full flex-col gap-[var(--mobile-space-24)]">
          <MobileWeekdayHoursRow label="이번 주 근무현황" days={WEEK_DAYS} />
          <MobileResidualLeaveRow days="11일" />
        </div>
      </>
    );
  }

  if (state === "working") {
    return (
      <>
        <MobileGreeting name="이동석" date="2026년 7월 2일 목요일" />
        <div className="flex w-full flex-col items-center gap-[var(--mobile-space-24)]">
          <ClockDisplay badge={<MobileHeaderBadge variant="filled">근무중</MobileHeaderBadge>} time="12:30" elapsed="경과 3시간 21분" />
          <div className="flex w-full flex-col gap-[14px]">
            <div className="flex gap-[10px]">
              <MobileButton variant="outline-warm">외출하기</MobileButton>
              <MobileButton variant="outline-warm">외근하기</MobileButton>
            </div>
            <MobileButton variant="filled-accent">퇴근하기</MobileButton>
          </div>
        </div>
        <MobileWeeklyProgress current="27h 21m" total="52h" percent={52} />
      </>
    );
  }

  if (state === "out" || state === "field") {
    const label = state === "out" ? "외출중" : "외근중";
    return (
      <>
        <MobileGreeting name="이동석" date="2026년 7월 2일 목요일" />
        <div className="flex w-full flex-col items-center gap-[var(--mobile-space-24)]">
          <ClockDisplay badge={<MobileHeaderBadge>{label}</MobileHeaderBadge>} time="12:30" elapsed="경과 3시간 21분" />
          <MobileButton variant="filled-accent">복귀하기</MobileButton>
        </div>
        <MobileHomeInfoRow
          items={[
            { label: "출근", value: "09:03" },
            { label: "외출", value: "12:30" },
            { label: "순 근무", value: "3h 27m" },
          ]}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex w-full items-start justify-center gap-[var(--mobile-space-12)]">
        <p className="flex-1 text-[28px] leading-[36px] font-extrabold tracking-[-0.56px] text-[var(--mobile-color-white)]">
          수고하셨습니다!
        </p>
        <p className="pt-[2px] text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
          2026년 7월 2일 목요일
        </p>
      </div>
      <div className="flex w-full flex-col items-center gap-[var(--mobile-space-24)]">
        <div className="flex w-full flex-col items-center gap-[20px]">
          <MobileHeaderBadge>퇴근완료</MobileHeaderBadge>
          <div className="flex flex-col items-center gap-[16px] text-center">
            <p className="text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-line-gray)]">
              오늘 총 근무시간
            </p>
            <p className="text-[72px] leading-[52px] font-bold tracking-[-1.44px] text-[var(--mobile-color-white)]">8h 57m</p>
            <div className="flex items-center gap-[12px]">
              <ClockIcon className="size-5 text-[var(--mobile-color-mint)]" />
              <p className="text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-mint)]">
                경과 3시간 21분
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
      <div className="flex w-full flex-col gap-[6px]">
        <MobileWeeklyProgress current="27h 21m" total="52h" percent={52} />
        <MobileWeekdayHoursRow days={WEEK_DAYS} />
      </div>
    </>
  );
}

function ClockDisplay({ badge, time, elapsed }: { badge: React.ReactNode; time: string; elapsed: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-[20px]">
      {badge}
      <div className="flex flex-col items-center gap-[20px] px-[20px]">
        <div className="flex items-center gap-[16px] pr-[44px]">
          <p className="text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-line-gray)]">
            출근시각
          </p>
          <p className="text-[72px] leading-[52px] font-bold tracking-[-1.44px] text-[var(--mobile-color-white)]">{time}</p>
        </div>
        <div className="flex items-center gap-[12px]">
          <ClockIcon className="size-5 text-[var(--mobile-color-mint)]" />
          <p className="text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-mint)]">
            {elapsed}
          </p>
        </div>
      </div>
    </div>
  );
}
