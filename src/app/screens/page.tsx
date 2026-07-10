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
        title: "퇴사처리 확인 (모달)",
        href: "/employees/1/terminate",
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

export default function ScreensIndexPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="min-h-screen w-full bg-page px-4 py-8 sm:px-8 lg:px-[60px] lg:py-[50px]">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-[40px]">
        <div className="flex flex-col gap-[8px]">
          <h1 className="text-[24px] font-extrabold tracking-[-0.48px] text-black sm:text-[32px] sm:tracking-[-0.64px]">
            byWORK 관리자 웹 — 화면 인덱스
          </h1>
          <p className="text-[14px] font-semibold tracking-[-0.28px] text-muted">
            정적 마크업 확인용 내부 페이지입니다. 카드를 클릭하면 해당 화면으로 이동합니다.
          </p>
        </div>

        <div className="flex flex-col gap-[32px]">
          {SCREEN_GROUPS.map((group) => (
            <div key={group.group} className="flex flex-col gap-[14px]">
              <h2 className="text-[16px] font-bold tracking-[-0.32px] text-black">
                {group.group}
              </h2>
              <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 lg:grid-cols-3">
                {group.screens.map((screen) => (
                  <Link
                    key={screen.href}
                    href={screen.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col gap-[8px] rounded-[10px] border border-line bg-white p-[20px] transition-colors hover:border-black"
                  >
                    <span className="text-[12px] font-semibold tracking-[-0.24px] text-muted">
                      {screen.code}
                    </span>
                    <span className="text-[16px] font-bold tracking-[-0.32px] text-black">
                      {screen.title}
                    </span>
                    <span className="text-[12px] font-semibold tracking-[-0.24px] text-line">
                      {screen.href}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
