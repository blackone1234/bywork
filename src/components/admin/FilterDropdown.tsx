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
    // 좁은 화면에서는 필드가 화면을 꽉 채우도록 w-full, sm 이상에서만 지정된 고정폭으로
    // 돌아간다(CD가 A07 모바일 스크린샷으로 직접 지적 — 연/월 필드를 좌우로 넓게).
    // 고정폭은 CSS 커스텀 프로퍼티로 넘겨서 Tailwind arbitrary value(sm:w-[var(...)])가
    // 매 인스턴스마다 다른 값을 쓸 수 있게 한다(문자열 보간 클래스는 JIT가 못 읽음).
    <div
      className="relative w-full sm:w-[var(--filter-dropdown-width)]"
      style={{ "--filter-dropdown-width": `${width}px` } as React.CSSProperties}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center justify-between whitespace-nowrap rounded-[30px] border text-[14px] font-semibold tracking-[-0.28px] transition-colors ${
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
