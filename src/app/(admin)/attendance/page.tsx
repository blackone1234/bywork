import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { AttendanceMonthFilter } from "@/components/admin/AttendanceMonthFilter";
import { AttendanceEmployeeFilter, ATTENDANCE_EMPLOYEE_FILTER_ALL_LABEL } from "@/components/admin/AttendanceEmployeeFilter";
import { Button } from "@/components/admin/Button";
import { AttendanceReviewBadge } from "@/components/admin/AttendanceReviewBadge";
import { DataTable, TableText, type DataTableColumn } from "@/components/admin/DataTable";
import { listMonthlyAttendance, type MonthlyAttendanceRow } from "@/lib/attendance";
import { listEmployees } from "@/lib/employees";
import { buildAttendanceListUrl } from "@/lib/attendanceListUrl";

export const dynamic = "force-dynamic";

const COLUMNS: DataTableColumn<MonthlyAttendanceRow>[] = [
  { key: "name", label: "이름", render: (row) => <TableText>{row.employeeName}</TableText> },
  { key: "date", label: "날짜", render: (row) => <TableText>{row.date}</TableText> },
  { key: "checkIn", label: "출근시간", render: (row) => <TableText>{row.checkIn}</TableText> },
  { key: "checkOut", label: "퇴근시간", render: (row) => <TableText>{row.checkOut}</TableText> },
  {
    key: "status",
    label: "상태",
    render: (row) =>
      row.hasPendingReview ? (
        <AttendanceReviewBadge variant="pending">검토필요</AttendanceReviewBadge>
      ) : (
        <AttendanceReviewBadge variant="normal">정상</AttendanceReviewBadge>
      ),
  },
  {
    key: "weeklyHours",
    label: "주간근무시간",
    render: (row) => <TableText>{row.weeklyHours}</TableText>,
  },
];

/** "검토필요"/"전체직원" 필터 탭 — Figma get_design_context 실측: 활성 상태는
 * bg-status-outside(#ffe09e), 비활성은 기존 toolbar 버튼과 동일(테두리만). */
function FilterTabLink({
  href,
  active,
  className = "",
  children,
}: {
  href: string;
  active: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-center rounded-md py-[var(--space-13)] pr-[var(--space-24)] pl-[var(--space-20)] text-badge font-semibold whitespace-nowrap ${
        active ? "border border-muted bg-status-outside text-black" : "border border-muted bg-white text-muted"
      } ${className}`}
    >
      {children}
    </Link>
  );
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; filter?: string; employeeId?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;
  const filter = params.filter === "pending_review" ? "pending_review" : "all";
  const employeeId = params.employeeId ?? "";

  // listMonthlyAttendance(연/월만 필요)와 listEmployees(파라미터 자체가 없음)는 서로의
  // 결과에 의존하지 않는데 순차 await로 묶으면 불필요한 waterfall이 생긴다.
  const [allRows, employees] = await Promise.all([listMonthlyAttendance(year, month), listEmployees()]);
  const pendingCount = allRows.filter((row) => row.hasPendingReview).length;
  const statusFiltered = filter === "pending_review" ? allRows.filter((row) => row.hasPendingReview) : allRows;
  const rows = employeeId ? statusFiltered.filter((row) => row.employeeId === employeeId) : statusFiltered;
  const selectedEmployeeName =
    employees.find((employee) => employee.id === employeeId)?.name ?? ATTENDANCE_EMPLOYEE_FILTER_ALL_LABEL;

  return (
    <>
      <PageHeader breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, "근태 데이터"]} />

      {/* 그룹3(A 확산) — 필터행/테이블 2섹션에 스태거 적용(A01 패턴 재사용). */}
      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        {/* z-10 — .stagger-item은 animation-fill-mode:both로 애니메이션 종료 후에도
            transform: matrix(1,0,0,1,0,0)(항등행렬, 값은 0이지만 "none"이 아님)이 계산값으로
            남아 flex item마다 별도 stacking context를 만든다. z-index 없이는 DOM에서 나중에
            오는 형제(테이블)가 이 안의 드롭다운 패널(absolute, z-50)을 덮어버리는 버그가
            있었다(A07 연도/월 드롭다운에서 실측 확인, 이번에 직원 드롭다운 추가하며 발견) —
            명시적으로 더 높은 z-index를 줘서 항상 위에 그려지게 한다. */}
        <div className="stagger-item relative z-10 flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between" style={{ animationDelay: "0ms" }}>
          <AttendanceMonthFilter year={year} month={month} />

          {/* "전체직원" 탭 버튼은 삭제(CD 지적 — 직원선택 드롭다운의 기본 라벨과 이름이
              겹쳐 중복 기능처럼 보임). 대신 "검토필요"를 토글식으로 바꿔서 — 비활성 상태면
              누를 때 pending_review로, 이미 활성 상태(pending_review)면 누를 때 전체(필터
              없음)로 돌아가게 한다 — 삭제된 버튼이 하던 "전체 상태로 복귀" 기능을 잃지
              않는다. 좁은 화면에서 3개 항목(검토필요/직원선택/엑셀다운로드)을 grid-cols-2로
              분할 — flex-1 조합은 폭이 부족하면 예측 불가능하게 찌그러져서 텍스트가 세로로
              한 글자씩 줄바꿈되는 버그가 있었다(CD가 스크린샷으로 직접 지적). sm 이상은
              기존처럼 내용 크기대로 한 줄에 나란히. */}
          <div className="grid w-full grid-cols-2 items-center gap-[8px] sm:flex sm:w-auto sm:flex-nowrap sm:justify-start">
            <FilterTabLink
              href={buildAttendanceListUrl(year, month, filter === "pending_review" ? undefined : "pending_review", employeeId)}
              active={filter === "pending_review"}
            >
              검토필요 ({pendingCount})
            </FilterTabLink>
            <AttendanceEmployeeFilter employees={employees} selectedName={selectedEmployeeName} />
            <Button size="toolbar" className="whitespace-nowrap">
              엑셀 다운로드
            </Button>
          </div>
        </div>

        <div className="stagger-item" style={{ animationDelay: "70ms" }}>
          <DataTable
            columns={COLUMNS}
            rows={rows}
            rowKey={(row) => row.id}
            rowHref={(row) =>
              `/attendance/${row.employeeId}?year=${year}&month=${month}${filter === "pending_review" ? "&filter=pending_review" : ""}${employeeId ? `&employeeId=${employeeId}` : ""}`
            }
            rowHeightClassName="h-[42px]"
          />
        </div>
      </div>
    </>
  );
}
