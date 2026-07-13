"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterDropdown } from "@/components/admin/FilterDropdown";
import { YEAR_OPTIONS, MONTH_OPTIONS } from "@/lib/dummy-data";

export function AttendanceMonthFilter({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: "year" | "month", value: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, String(value));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-[8px]">
      <FilterDropdown
        label={`${year}년`}
        options={YEAR_OPTIONS}
        width={130}
        onSelect={(option) => updateParam("year", Number(option.replace("년", "")))}
      />
      <FilterDropdown
        label={`${month}월`}
        options={MONTH_OPTIONS}
        width={110}
        onSelect={(option) => updateParam("month", Number(option.replace("월", "")))}
      />
    </div>
  );
}
