import Link from "next/link";
import { HomeIcon, CalendarIcon, LeaveIcon, StatsIcon, MyIcon } from "@/components/mobile/icons";

export type MobileNavKey = "home" | "attendance" | "leave" | "stats" | "my";

const NAV_ITEMS: { key: MobileNavKey; label: string; Icon: typeof HomeIcon; href: string }[] = [
  { key: "home", label: "홈", Icon: HomeIcon, href: "/m" },
  { key: "attendance", label: "근태", Icon: CalendarIcon, href: "/m/attendance" },
  { key: "leave", label: "휴가", Icon: LeaveIcon, href: "/m/leave" },
  { key: "stats", label: "통계", Icon: StatsIcon, href: "/m/stats" },
  { key: "my", label: "마이", Icon: MyIcon, href: "/m/my" },
];

/**
 * S03/S07(홈)만 어두운 배경 위에서 노란 활성색을 쓰고, 나머지 화면(S08/S10~S12/S15/S16)은
 * 흰 배경 + dark-gray 활성색을 쓴다 — get_design_context로 각 GNB 인스턴스를 실제로
 * 대조해 확인한 차이라, 눈으로 본 색과 달리 "근태" 탭도 활성 시 dark-gray가 맞다.
 */
export function MobileBottomNav({ active, theme }: { active: MobileNavKey; theme: "dark" | "light" }) {
  const activeColor = theme === "dark" ? "var(--mobile-color-accent)" : "var(--mobile-color-dark-gray)";

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-10 flex w-full items-start justify-between px-[var(--mobile-space-30)] pt-[var(--mobile-space-20)] ${
        theme === "dark"
          ? "bg-[var(--mobile-color-black)]"
          : "border-t border-[var(--mobile-color-light-gray)] bg-[var(--mobile-color-white)]"
      }`}
      // 사용자 실기기 확인 결과 하단 여백이 너무 넓어서 30px→10px로 20px 줄임(2026-07-20).
      style={{ paddingBottom: "max(var(--mobile-space-10), env(safe-area-inset-bottom))" }}
    >
      {NAV_ITEMS.map(({ key, label, Icon, href }) => {
        const isActive = key === active;
        const color = isActive ? activeColor : "var(--mobile-color-light-gray)";
        return (
          <Link key={key} href={href} className="flex flex-col items-center gap-[var(--mobile-space-10)]" style={{ color }}>
            {/* 아이콘 크기는 각 컴포넌트의 실측 기본값(className 생략)을 그대로 쓴다 —
                근태(캘린더) 아이콘만 19×20으로 다른 4개(20×20)와 비율이 달라서, 여기서
                일괄 size-5로 덮어쓰면 근태 아이콘이 찌그러진다. */}
            <Icon />
            <span className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)]">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
