import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { EmploymentStatus } from "@/components/admin/EmploymentStatusBadge";
import { type AuthMethod, AUTH_METHOD_OPTIONS } from "@/lib/dummy-data";

export type EmploymentStatusDb = "active" | "on_leave" | "terminated";
export type AuthMethodDb = "hybrid" | "gps_only" | "ip_only" | "manual_approval";

const EMPLOYMENT_STATUS_TO_UI: Record<EmploymentStatusDb, EmploymentStatus> = {
  active: "재직중",
  on_leave: "휴직중",
  terminated: "퇴사",
};

const AUTH_METHOD_TO_UI: Record<AuthMethodDb, AuthMethod> = {
  hybrid: "IP+GPS(하이브리드)",
  gps_only: "GPS만",
  ip_only: "IP만",
  manual_approval: "관리자 수동승인만",
};

const AUTH_METHOD_TO_DB: Record<AuthMethod, AuthMethodDb> = {
  "IP+GPS(하이브리드)": "hybrid",
  "GPS만": "gps_only",
  "IP만": "ip_only",
  "관리자 수동승인만": "manual_approval",
};

export function authMethodToDb(value: string): AuthMethodDb {
  if ((AUTH_METHOD_OPTIONS as readonly string[]).includes(value)) {
    return AUTH_METHOD_TO_DB[value as AuthMethod];
  }
  throw new Error(`Unknown auth method: ${value}`);
}

/** DB "date" columns come back as "YYYY-MM-DD"; the UI has always shown "YYYY.MM.DD". */
export function formatDateDot(isoDate: string): string {
  return isoDate.replaceAll("-", ".");
}

// 직원별 연차 잔액을 누적/사용 이력으로 계산하는 테이블이 아직 없다. 회사 정책(leave_policies)
// 기준으로만 표시하는 임시 값 — 실제 자동계산/사용량 차감 로직은 별도 스키마 작업이 필요하다.
const FALLBACK_STATUTORY_ANNUAL_LEAVE_DAYS = 15;

async function getDefaultAnnualLeaveDays(): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("leave_policies")
    .select("policy_type, manual_annual_leave_days")
    .eq("id", 1)
    .single();

  if (error || !data) return FALLBACK_STATUTORY_ANNUAL_LEAVE_DAYS;

  if (data.policy_type === "manual" && data.manual_annual_leave_days != null) {
    return Number(data.manual_annual_leave_days);
  }
  return FALLBACK_STATUTORY_ANNUAL_LEAVE_DAYS;
}

type EmployeeRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  hire_date: string;
  employment_status: EmploymentStatusDb;
  auth_method: AuthMethodDb;
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hireDate: string;
  status: EmploymentStatus;
  remainingLeaveDays: number;
  authMethod: AuthMethod;
};

const EMPLOYEE_COLUMNS = "id, name, email, phone, hire_date, employment_status, auth_method";

function toEmployee(row: EmployeeRow, remainingLeaveDays: number): Employee {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? "",
    // 현재 화면(A02/A04)에 부서/직급 입력·표시 UI가 없어 스키마 컬럼은 있지만 항상 빈 값으로 둔다.
    department: "",
    position: "",
    hireDate: formatDateDot(row.hire_date),
    status: EMPLOYMENT_STATUS_TO_UI[row.employment_status],
    remainingLeaveDays,
    authMethod: AUTH_METHOD_TO_UI[row.auth_method],
  };
}

export async function listEmployees(): Promise<Employee[]> {
  const supabase = createSupabaseAdminClient();
  const [{ data, error }, defaultLeaveDays] = await Promise.all([
    supabase
      .from("employees")
      .select(EMPLOYEE_COLUMNS)
      .order("hire_date", { ascending: true })
      .returns<EmployeeRow[]>(),
    getDefaultAnnualLeaveDays(),
  ]);

  if (error) throw new Error(`직원 목록을 불러오지 못했습니다: ${error.message}`);

  return (data ?? []).map((row) => toEmployee(row, defaultLeaveDays));
}

export type EmployeeEmailConflict = {
  id: string;
  name: string;
  employmentStatus: EmploymentStatusDb;
  /** "YYYY-MM-DD" as stored, or null if the employee was never terminated. */
  terminationDate: string | null;
};

/** Used by A03 to decide between "duplicate email" and "rehire a terminated employee". */
export async function findEmployeeByEmail(email: string): Promise<EmployeeEmailConflict | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, name, employment_status, termination_date")
    .eq("email", email)
    .maybeSingle();

  if (error) throw new Error(`이메일 중복 확인에 실패했습니다: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    employmentStatus: data.employment_status,
    terminationDate: data.termination_date,
  };
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const supabase = createSupabaseAdminClient();
  const [{ data, error }, defaultLeaveDays] = await Promise.all([
    supabase
      .from("employees")
      .select(EMPLOYEE_COLUMNS)
      .eq("id", id)
      .maybeSingle<EmployeeRow>(),
    getDefaultAnnualLeaveDays(),
  ]);

  if (error) throw new Error(`직원 정보를 불러오지 못했습니다: ${error.message}`);
  if (!data) return null;

  return toEmployee(data, defaultLeaveDays);
}
