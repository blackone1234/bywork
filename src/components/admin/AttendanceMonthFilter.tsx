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

  // 좁은 화면에서는 연도/월 필드가 각각 화면을 좌우로 꽉 채우도록 grid-cols-2로 정확히
  // 반반 분할한다(CD가 A07 모바일 스크린샷으로 직접 지적 — 그냥 flex justify-between이면
  // FilterDropdown이 내부적으로 sm 미만에서 w-full이 되면서 두 개가 서로 100%를 다투다
  // 예측 불가능하게 찌그러지는 문제가 있었음). sm 이상(데스크톱)에서는 기존처럼 각자
  // 고정폭으로 나란히 붙는 컴팩트한 모습으로 되돌린다.
  return (
    <div className="grid w-full grid-cols-2 items-center gap-[8px] sm:flex sm:w-auto sm:justify-start">
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
