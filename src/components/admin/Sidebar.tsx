"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/admin/icons/BrandLogo";
import { MENU_ITEMS } from "@/lib/nav";

export function Sidebar({
  notificationCount,
  onNavigate,
}: {
  notificationCount?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[218px] shrink-0 flex-col gap-[50px] bg-white pt-[50px] pb-[20px]">
      <div className="flex flex-col gap-[50px] px-[30px]">
        <BrandLogo className="h-[14px] w-[74.528px] text-black" />
        <span className="text-[19px] font-bold leading-[1.3] tracking-[-0.38px] text-black">
          Admin
          <br />
          Dashboard
        </span>
      </div>

      <nav className="flex flex-col gap-[6px] px-[10px]">
        {MENU_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex h-[42px] w-[198px] items-center justify-between gap-[16px] rounded-[30px] px-[20px] py-[10px] text-[14px] font-semibold tracking-[-0.28px] transition-colors ${
                isActive
                  ? "bg-sidebar-active text-white shadow-[2px_4px_2px_rgba(0,0,0,0.2)]"
                  : "bg-white text-black hover:bg-page"
              }`}
            >
              <span>{item.label}</span>
              {isActive && notificationCount ? (
                <span className="flex size-[22px] items-center justify-center rounded-full bg-accent text-[12px] font-semibold tracking-[-0.24px] text-black">
                  {notificationCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <p className="mt-auto px-[30px] text-[11px] font-medium tracking-[-0.22px] text-muted">
        © by BLACK. All rights reserved.
      </p>
    </aside>
  );
}
