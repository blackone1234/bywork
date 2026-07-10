"use client";

import { useState } from "react";
import { Sidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col bg-white lg:flex-row lg:items-stretch">
      <div className="flex items-center justify-between border-b border-divider bg-white px-4 py-3 lg:hidden">
        <span className="text-[13px] font-bold tracking-[-0.26px] text-black">
          by WORKS
        </span>
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="메뉴 열기"
          className="flex size-9 items-center justify-center rounded-full border border-line text-black"
        >
          ☰
        </button>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 h-full shadow-xl">
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex min-h-screen flex-1 flex-col bg-page">
        {children}
      </div>
    </div>
  );
}
