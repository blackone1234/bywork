import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { AttendanceMonthFilter } from "@/components/admin/AttendanceMonthFilter";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/admin/Button";
import { getEmployee } from "@/lib/employees";
import { getEmployeeAttendanceDetail } from "@/lib/attendance";
import { buildAttendanceListUrl } from "@/lib/attendanceListUrl";
import { AttendanceReviewTable } from "./AttendanceReviewTable";

export const dynamic = "force-dynamic";

export default async function AttendanceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string; month?: string; filter?: string; employeeId?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const now = new Date();
  const year = Number(query.year) || now.getFullYear();
  const month = Number(query.month) || now.getMonth() + 1;
  const filter = query.filter === "pending_review" ? "pending_review" : undefined;
  const employeeIdFilter = query.employeeId;

  // getEmployee(id)와 getEmployeeAttendanceDetail(id, ...)는 서로의 결과에 의존하지
  // 않고 둘 다 route param id만 필요한데 순차 await로 묶여 있던 waterfall — 병렬화.
  const [employee, { rows, stats }] = await Promise.all([
    getEmployee(id),
    getEmployeeAttendanceDetail(id, year, month),
  ]);

  if (!employee) {
    notFound();
  }

  // A07에서 어떤 필터(상태 탭 + 개별 직원 선택)로 들어왔는지 그대로 실어서 "근태 데이터"
  // 브레드크럼/"목록" 버튼 둘 다에 재사용 — 관리자가 A07에서 직접 필터를 바꾸지 않는 한
  // 유지된다.
  const listUrl = buildAttendanceListUrl(year, month, filter, employeeIdFilter);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "근태 데이터", href: listUrl }, `근태상세 - ${employee.name}`]}
      />

      {/* 그룹3(A 확산) — 필터행/통계카드/테이블 3섹션에 스태거 적용(A01 패턴 재사용). */}
      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        {/* z-10 — A07과 동일한 이유(월/드롭다운 패널이 아래 테이블에 가려지는 stagger
            애니메이션 버그, attendance/page.tsx 참고). */}
        <div className="stagger-item relative z-10 flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between" style={{ animationDelay: "0ms" }}>
          <AttendanceMonthFilter year={year} month={month} />

          <Button size="toolbar" className="self-start">
            엑셀 다운로드
          </Button>
        </div>

        <div className="stagger-item grid w-full grid-cols-2 gap-[10px] sm:grid-cols-4" style={{ animationDelay: "70ms" }}>
          <StatCard label="총 근무일" value={stats.totalWorkDays} />
          <StatCard label="총 근무시간" value={stats.totalWorkHours} />
          <StatCard label="연차사용" value={stats.usedLeaveDays} />
          <StatCard label="결근일수" value={stats.absentDays} />
        </div>

        <div className="stagger-item" style={{ animationDelay: "140ms" }}>
          <AttendanceReviewTable employeeId={employee.id} rows={rows} />
        </div>

        {/* "목록" 버튼(Figma 신규 반영, get_design_context 실측: border-muted, rounded-md,
            px-24/pt-13/pb-14, w-140px) — 브레드크럼 "근태 데이터"와 동일한 목적지(listUrl)
            재사용, A07 진입 시점의 필터를 그대로 들고 돌아간다. */}
        <div className="flex w-full items-center justify-end border-t border-muted pt-[30px]">
          <Link
            href={listUrl}
            className="flex w-[140px] items-center justify-center rounded-md border border-muted px-[var(--space-24)] pt-[13px] pb-[14px] text-body font-semibold text-muted transition-colors hover:border-sidebar-active hover:bg-sidebar-active hover:text-white"
          >
            목록
          </Link>
        </div>
      </div>
    </>
  );
}
