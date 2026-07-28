import Link from "next/link";
import { notFound } from "next/navigation";

type Screen = {
  code: string;
  title: string;
  href: string;
};

type ScreenGroup = {
  group: string;
  screens: Screen[];
};

const SCREEN_GROUPS: ScreenGroup[] = [
  {
    group: "대시보드",
    screens: [{ code: "A01", title: "대시보드", href: "/dashboard" }],
  },
  {
    group: "직원관리",
    screens: [
      { code: "A02", title: "직원 목록", href: "/employees" },
      { code: "A03", title: "직원 추가", href: "/employees/new" },
      { code: "A04", title: "직원 상세", href: "/employees/1" },
      {
        code: "A05",
        title: "퇴사처리 확인 (모달, A04 내 \"퇴사처리\" 버튼으로 트리거)",
        href: "/employees/1",
      },
    ],
  },
  {
    group: "휴가승인",
    screens: [{ code: "A06", title: "휴가승인관리", href: "/leave-requests" }],
  },
  {
    group: "근태 데이터",
    screens: [
      { code: "A07", title: "근태 전체 조회", href: "/attendance" },
      { code: "A08", title: "직원별 근태 상세", href: "/attendance/1" },
    ],
  },
  {
    group: "근무 설정",
    screens: [
      {
        code: "A09/A11",
        title: "기본근무 / 휴가정책 / 인증설정 (3탭)",
        href: "/settings/work",
      },
    ],
  },
  {
    group: "시스템",
    screens: [{ code: "A12", title: "시스템 설정", href: "/settings/system" }],
  },
  {
    group: "인증",
    screens: [
      { code: "A13", title: "관리자 로그인", href: "/login" },
      {
        code: "A13-1",
        title: "비밀번호 찾기 (이메일 발송 완료 모달)",
        href: "/forgot-password",
      },
      { code: "A14", title: "비밀번호 재설정", href: "/reset-password" },
    ],
  },
];

const MOBILE_SCREEN_GROUPS: ScreenGroup[] = [
  {
    group: "로그인",
    screens: [
      { code: "S01", title: "로그인", href: "/m/login" },
      { code: "S02", title: "비밀번호 등록", href: "/m/register-password" },
    ],
  },
  {
    group: "홈 (5 states)",
    screens: [
      { code: "S03", title: "홈 — 출근 전", href: "/m?state=before" },
      { code: "S04", title: "홈 — 근무 중", href: "/m?state=working" },
      { code: "S05", title: "홈 — 외출 중", href: "/m?state=out" },
      { code: "S06", title: "홈 — 외근 중", href: "/m?state=field" },
      { code: "S07", title: "홈 — 퇴근 후", href: "/m?state=done" },
    ],
  },
  {
    group: "근태",
    screens: [
      { code: "S08", title: "근태 캘린더", href: "/m/attendance" },
      { code: "S09", title: "근태 날짜 상세", href: "/m/attendance/2026-07-02" },
    ],
  },
  {
    group: "휴가",
    screens: [
      { code: "S10", title: "휴가 현황", href: "/m/leave" },
      { code: "S11", title: "휴가 신청", href: "/m/leave/new" },
      { code: "S12", title: "휴가 내역", href: "/m/leave/history" },
    ],
  },
  {
    group: "통계",
    screens: [{ code: "S13/S14", title: "통계 (월간/연간 탭)", href: "/m/stats" }],
  },
  {
    group: "마이페이지",
    screens: [
      { code: "S15", title: "마이페이지", href: "/m/my" },
      { code: "S16", title: "비밀번호 변경", href: "/m/my/password" },
    ],
  },
  {
    group: "에러 화면 (E01/E02/E04는 인라인으로 이미 연결됨, E03은 리뷰 전용, E06/E07은 실제 not-found.tsx/error.tsx로 연결됨)",
    screens: [
      { code: "E01", title: "초대링크 만료/오류(리뷰용, 실제는 로그인화면 배너로 처리)", href: "/screens/errors/e01" },
      { code: "E02", title: "GPS 위치권한 거부(리뷰용, 실제는 버튼 아래 인라인 에러로 처리)", href: "/screens/errors/e02" },
      { code: "E03", title: "세션 만료(리뷰 전용 — 실제는 로그인화면 배너로 처리)", href: "/screens/errors/e03" },
      { code: "E04", title: "퇴사자 계정 로그인 시도(리뷰용, 실제는 로그인 폼 인라인 에러로 처리)", href: "/screens/errors/e04" },
      { code: "E05", title: "네트워크 연결 오류(리뷰 전용 — 연결 지점 없음)", href: "/screens/errors/e05" },
      {
        code: "E06",
        title: "404 페이지 없음 (실제 not-found.tsx 연결됨 — 클릭 시 존재하지 않는 경로로 이동해 직접 트리거)",
        href: "/m/__404-preview__",
      },
      { code: "E07", title: "500 서버 오류(리뷰용, 실제는 error.tsx/global-error.tsx로 연결됨)", href: "/screens/errors/e07" },
    ],
  },
];

function ScreenGroupList({ groups }: { groups: ScreenGroup[] }) {
  return (
    <div className="flex flex-col gap-[32px]">
      {groups.map((group) => (
        <div key={group.group} className="flex flex-col gap-[14px]">
          <h2 className="text-[16px] font-bold tracking-[-0.32px] text-black">{group.group}</h2>
          <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 lg:grid-cols-3">
            {group.screens.map((screen) => (
              <Link
                key={screen.href}
                href={screen.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-[8px] rounded-[10px] border border-line bg-white p-[20px] transition-colors hover:border-black"
              >
                <span className="text-[12px] font-semibold tracking-[-0.24px] text-muted">{screen.code}</span>
                <span className="text-[16px] font-bold tracking-[-0.32px] text-black">{screen.title}</span>
                <span className="text-[12px] font-semibold tracking-[-0.24px] text-line">{screen.href}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ScreensIndexPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="min-h-screen w-full bg-page px-4 py-8 sm:px-8 lg:px-[60px] lg:py-[50px]">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-[56px]">
        <div className="flex flex-col gap-[40px]">
          <div className="flex flex-col gap-[8px]">
            <h1 className="text-[24px] font-extrabold tracking-[-0.48px] text-black sm:text-[32px] sm:tracking-[-0.64px]">
              byWORK 관리자 웹 — 화면 인덱스 (A01~A16)
            </h1>
            <p className="text-[14px] font-semibold tracking-[-0.28px] text-muted">
              정적 마크업 확인용 내부 페이지입니다. 카드를 클릭하면 해당 화면으로 이동합니다.
            </p>
          </div>
          <ScreenGroupList groups={SCREEN_GROUPS} />
        </div>

        <div className="flex flex-col gap-[40px] border-t-2 border-black pt-[40px]">
          <div className="flex flex-col gap-[8px]">
            <h1 className="text-[24px] font-extrabold tracking-[-0.48px] text-black sm:text-[32px] sm:tracking-[-0.64px]">
              byWORK 사용자 앱 — 화면 인덱스 (S01~S16)
            </h1>
            <p className="text-[14px] font-semibold tracking-[-0.28px] text-muted">
              모바일 폭(393px) 기준으로 디자인됐습니다. 홈(S03~S07)은 <code>?state=</code> 쿼리로
              5개 상태를 미리봅니다 — 아직 Supabase 근태 데이터에 연동되지 않은 정적 화면입니다.
            </p>
          </div>
          <ScreenGroupList groups={MOBILE_SCREEN_GROUPS} />
        </div>
      </div>
    </div>
  );
}
