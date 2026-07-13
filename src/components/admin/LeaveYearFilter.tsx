"use client";

import { usePathname, useRouter } from "next/navigation";
import { FilterDropdown } from "@/components/admin/FilterDropdown";
import { YEAR_OPTIONS } from "@/lib/dummy-data";

export function LeaveYearFilter({ year, status }: { year: number; status: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function updateYear(value: number) {
    router.push(`${pathname}?status=${status}&year=${value}`);
  }

  return (
    <FilterDropdown
      label={`${year}년`}
      options={YEAR_OPTIONS}
      width={130}
      onSelect={(option) => updateYear(Number(option.replace("년", "")))}
    />
  );
}
