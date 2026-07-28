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

type EmployeeRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  hire_date: string;
  employment_status: EmploymentStatusDb;
  auth_method: AuthMethodDb;
  annual_leave_days: number;
  used_leave_days: number;
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
  /** A04 "관리자수동입력" 모드에서 연차 입력 필드의 기본값으로 쓰는 총 부여일수 원값. */
  annualLeaveDaysGranted: number;
  usedLeaveDays: number;
  authMethod: AuthMethod;
};

const EMPLOYEE_COLUMNS =
  "id, name, email, phone, hire_date, employment_status, auth_method, annual_leave_days, used_leave_days";

function toEmployee(row: EmployeeRow): Employee {
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
    remainingLeaveDays: Number(row.annual_leave_days) - Number(row.used_leave_days),
    annualLeaveDaysGranted: Number(row.annual_leave_days),
    usedLeaveDays: Number(row.used_leave_days),
    authMethod: AUTH_METHOD_TO_UI[row.auth_method],
  };
}

/**
 * employees_with_leave VIEW — annual_leave_days가 leave_policies.policy_type에 따라
 * 법정 자동계산값(hire_date 기반, 퇴사자는 termination_date에서 동결) 또는 관리자가
 * 직접 입력한 원값 중 하나로 조회 시점에 계산돼 나온다(20260723000000 마이그레이션).
 * 컬럼명이 employees와 동일해서 EMPLOYEE_COLUMNS/toEmployee()는 그대로 재사용 가능.
 */
export async function listEmployees(): Promise<Employee[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("employees_with_leave")
    .select(EMPLOYEE_COLUMNS)
    .order("hire_date", { ascending: true })
    .returns<EmployeeRow[]>();

  if (error) throw new Error(`직원 목록을 불러오지 못했습니다: ${error.message}`);

  return (data ?? []).map(toEmployee);
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
  const { data, error } = await supabase
    .from("employees_with_leave")
    .select(EMPLOYEE_COLUMNS)
    .eq("id", id)
    .maybeSingle<EmployeeRow>();

  if (error) throw new Error(`직원 정보를 불러오지 못했습니다: ${error.message}`);
  if (!data) return null;

  return toEmployee(data);
}
