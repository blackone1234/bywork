import type { AttendanceState } from "@/components/admin/StatusBadge";
import type { EmploymentStatus } from "@/components/admin/EmploymentStatusBadge";

export type TodayAttendanceRow = {
  id: string;
  name: string;
  state: AttendanceState;
  checkIn: string;
  checkOut: string;
  outing: string;
  weeklyHours: string;
};

export const dashboardStats = [
  { label: "전체", count: "4명" },
  { label: "출근중", count: "1명" },
  { label: "외출/외근", count: "1명" },
  { label: "미출근", count: "1명" },
  { label: "휴가", count: "1명" },
];

export const dashboardNotice = "휴가 승인 대기 2건 · 이번 주 52h 초과 직원 없음";

export const todayAttendance: TodayAttendanceRow[] = [
  {
    id: "1",
    name: "이준호",
    state: "근무중",
    checkIn: "09:00",
    checkOut: "-",
    outing: "-",
    weeklyHours: "27h",
  },
  {
    id: "2",
    name: "박서연",
    state: "외출중",
    checkIn: "09:00",
    checkOut: "18:05",
    outing: "외출중",
    weeklyHours: "27h",
  },
  {
    id: "3",
    name: "김도윤",
    state: "휴가중",
    checkIn: "09:00",
    checkOut: "-",
    outing: "외출중",
    weeklyHours: "27h",
  },
  {
    id: "4",
    name: "최지우",
    state: "미출근",
    checkIn: "09:00",
    checkOut: "18:05",
    outing: "-",
    weeklyHours: "27h",
  },
];

export type AuthMethod = "IP+GPS(하이브리드)" | "GPS만" | "IP만" | "관리자 수동승인만";

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

export const employees: Employee[] = [
  {
    id: "1",
    name: "이준호",
    email: "00001@by-bk.com",
    phone: "010-1234-5678",
    department: "개발팀",
    position: "팀장",
    hireDate: "2021.01.02",
    status: "재직중",
    remainingLeaveDays: 15,
    authMethod: "IP+GPS(하이브리드)",
  },
  {
    id: "2",
    name: "박서연",
    email: "00002@by-bk.com",
    phone: "010-2345-6789",
    department: "디자인팀",
    position: "선임",
    hireDate: "2022.03.15",
    status: "재직중",
    remainingLeaveDays: 12,
    authMethod: "GPS만",
  },
  {
    id: "3",
    name: "김도윤",
    email: "00003@by-bk.com",
    phone: "010-3456-7890",
    department: "개발팀",
    position: "주임",
    hireDate: "2023.06.01",
    status: "휴직중",
    remainingLeaveDays: 8,
    authMethod: "IP만",
  },
  {
    id: "4",
    name: "최지우",
    email: "00004@by-bk.com",
    phone: "010-4567-8901",
    department: "인사팀",
    position: "사원",
    hireDate: "2024.02.19",
    status: "재직중",
    remainingLeaveDays: 15,
    authMethod: "관리자 수동승인만",
  },
];

export function getEmployeeById(id: string): Employee | undefined {
  return employees.find((employee) => employee.id === id);
}
