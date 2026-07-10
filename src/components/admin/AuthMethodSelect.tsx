"use client";

import { useState } from "react";
import { AUTH_METHOD_OPTIONS, type AuthMethod } from "@/lib/dummy-data";

export function AuthMethodSelect({ defaultValue }: { defaultValue: AuthMethod }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AuthMethod>(defaultValue);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-[14px] rounded-[20px] border transition-colors ${
          open
            ? "border-2 border-black bg-white px-[23px] py-[10px] text-black shadow-[2px_4px_2px_rgba(0,0,0,0.2)]"
            : "border-divider px-[24px] py-[11px] hover:border-sidebar-active hover:bg-sidebar-active"
        }`}
      >
        <span
          className={`text-[14px] font-semibold tracking-[-0.28px] ${
            open ? "text-black" : "text-line group-hover:text-white"
          }`}
        >
          {selected}
        </span>
        <span aria-hidden className={`transition-transform ${open ? "-scale-y-100 text-black" : "text-line"}`}>
          ▾
        </span>
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute top-[calc(100%+4px)] left-0 z-50 flex w-max flex-col gap-[8px] rounded-[16px] border-2 border-black bg-white p-[16px] shadow-[2px_4px_2px_rgba(0,0,0,0.2)]">
            {AUTH_METHOD_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setSelected(option);
                  setOpen(false);
                }}
                className={`text-left text-[14px] tracking-[-0.28px] whitespace-nowrap transition-opacity ${
                  option === selected
                    ? "font-semibold text-black"
                    : "font-semibold text-black opacity-30 hover:opacity-60"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
