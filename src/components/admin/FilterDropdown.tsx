"use client";

import { useState } from "react";
import { ChevronIcon } from "@/components/admin/ChevronIcon";

export function FilterDropdown({
  label,
  options,
  width = 130,
  onSelect,
}: {
  label: string;
  options?: string[];
  width?: number;
  onSelect?: (option: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(label);

  return (
    <div className="relative" style={{ width }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center justify-between rounded-[30px] border text-[14px] font-semibold tracking-[-0.28px] transition-colors ${
          open
            ? "border-2 border-black bg-white px-[23px] py-[10px] text-black shadow-[2px_4px_2px_rgba(0,0,0,0.2)]"
            : "border-divider px-[24px] py-[11px] text-line hover:border-black"
        }`}
      >
        {selected}
        <ChevronIcon className={`size-[10px] transition-transform ${open ? "-scale-y-100" : ""}`} />
      </button>

      {open && options ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute top-[calc(100%+4px)] left-0 z-50 flex w-full min-w-max flex-col gap-[8px] rounded-[22px] border-2 border-black bg-white p-[16px] shadow-[2px_4px_2px_rgba(0,0,0,0.2)]">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setSelected(option);
                  setOpen(false);
                  onSelect?.(option);
                }}
                className={`text-left text-[14px] tracking-[-0.28px] transition-opacity ${
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
