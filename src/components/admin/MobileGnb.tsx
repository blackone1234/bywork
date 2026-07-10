"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/admin/icons/BrandLogo";
import { KebabDotsIcon } from "@/components/admin/icons/KebabDotsIcon";
import { CloseIcon } from "@/components/admin/icons/CloseIcon";
import { MENU_ITEMS } from "@/lib/nav";

export function MobileGnb() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-divider bg-white px-[30px] py-[20px] lg:hidden">
        <BrandLogo className="h-[20px] w-[106.469px] text-black" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="메뉴 열기"
          className="flex h-[24px] w-[36px] items-center justify-center"
        >
          <KebabDotsIcon className="h-[6px] w-[24px] text-sidebar-active" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white px-[30px] pt-[20px] lg:hidden">
          <div className="flex items-center justify-between pb-[60px]">
            <span className="text-[14px] font-bold tracking-[-0.26px] text-black">
              by WORKS
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="메뉴 닫기"
              className="flex size-[24px] items-center justify-center text-black"
            >
              <CloseIcon className="size-[16px]" />
            </button>
          </div>

          <p className="pb-[50px] text-[20px] font-bold tracking-[-0.4px] text-black">
            Admin Dashboard
          </p>

          <nav className="flex flex-col gap-[30px]">
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-[32px] font-extrabold tracking-[-0.64px] text-black"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <p className="mt-auto pb-[30px] text-[14px] font-medium tracking-[-0.28px] text-muted">
            © by BLACK. All rights reserved.
          </p>
        </div>
      ) : null}
    </>
  );
}
