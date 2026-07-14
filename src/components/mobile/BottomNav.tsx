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
      className={`flex w-full items-start justify-between px-[var(--mobile-space-30)] pt-[var(--mobile-space-20)] pb-[var(--mobile-space-30)] ${
        theme === "dark"
          ? "bg-[var(--mobile-color-black)]"
          : "border-t border-[var(--mobile-color-light-gray)] bg-[var(--mobile-color-white)]"
      }`}
    >
      {NAV_ITEMS.map(({ key, label, Icon, href }) => {
        const isActive = key === active;
        const color = isActive ? activeColor : "var(--mobile-color-light-gray)";
        return (
          <a key={key} href={href} className="flex flex-col items-center gap-[var(--mobile-space-10)]" style={{ color }}>
            <Icon className="size-5" />
            <span className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)]">
              {label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
