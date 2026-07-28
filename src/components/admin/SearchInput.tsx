"use client";

import { SearchIcon } from "@/components/admin/icons/SearchIcon";

export function SearchInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex w-full max-w-[600px] items-center justify-between rounded-[30px] border border-divider py-[8px] pr-[14px] pl-[30px] transition-[border,box-shadow] focus-within:border-2 focus-within:border-black focus-within:shadow-[2px_4px_2px_rgba(0,0,0,0.2)]">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-[14px] font-semibold tracking-[-0.28px] text-black placeholder:text-muted focus:outline-none"
      />
      <SearchIcon className="size-[30px] shrink-0" />
    </div>
  );
}
