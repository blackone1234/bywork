import type { AttendanceState } from "@/components/admin/StatusBadge";
import type { EmploymentStatus } from "@/components/admin/EmploymentStatusBadge";
import type { LeaveRequestStatus } from "@/components/admin/LeaveStatusBadge";

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

export type LeaveRequest = {
  id: string;
  employeeName: string;
  leaveType: string;
  date: string;
  status: LeaveRequestStatus;
};

export const leaveRequests: LeaveRequest[] = [
  { id: "1", employeeName: "이준호", leaveType: "연차", date: "2026.07.10", status: "대기중" },
  { id: "2", employeeName: "박서연", leaveType: "반차", date: "2026.07.11", status: "대기중" },
  { id: "3", employeeName: "김도윤", leaveType: "연차", date: "2021.01.02", status: "승인" },
  { id: "4", employeeName: "최지우", leaveType: "병가", date: "2026.06.20", status: "반려" },
];

export type MonthlyAttendanceRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  weeklyHours: string;
};

export const monthlyAttendance: MonthlyAttendanceRow[] = [
  {
    id: "1",
    employeeId: "1",
    employeeName: "이준호",
    date: "2026.07.10",
    checkIn: "09:00",
    checkOut: "18:00",
    weeklyHours: "52h",
  },
  {
    id: "2",
    employeeId: "2",
    employeeName: "박서연",
    date: "2026.07.10",
    checkIn: "09:05",
    checkOut: "18:10",
    weeklyHours: "48h",
  },
  {
    id: "3",
    employeeId: "3",
    employeeName: "김도윤",
    date: "2026.07.10",
    checkIn: "-",
    checkOut: "-",
    weeklyHours: "0h",
  },
  {
    id: "4",
    employeeId: "4",
    employeeName: "최지우",
    date: "2026.07.10",
    checkIn: "09:00",
    checkOut: "17:55",
    weeklyHours: "45h",
  },
];

export type AttendanceDetailRow = {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  note: string;
};

export const employeeAttendanceStats = {
  totalWorkDays: "22일",
  totalWorkHours: "176h",
  usedLeaveDays: "2일",
};

export const employeeAttendanceDetail: AttendanceDetailRow[] = [
  { id: "1", date: "2026.07.10", checkIn: "09:00", checkOut: "18:00", note: "정상" },
  { id: "2", date: "2026.07.09", checkIn: "09:00", checkOut: "-", note: "승인된 연차" },
  { id: "3", date: "2026.07.08", checkIn: "09:12", checkOut: "18:05", note: "정상" },
];

export type IpWhitelistEntry = {
  id: string;
  ipAddress: string;
  label: string;
};

export const ipWhitelist: IpWhitelistEntry[] = [
  { id: "1", ipAddress: "125.131.67.104", label: "본사" },
  { id: "2", ipAddress: "211.60.20.15", label: "지사" },
];

export const gpsSettings = {
  latitude: "37.5665",
  longitude: "126.9780",
  radiusM: "150",
};

export const adminAccount = {
  email: "admin@by-bk.com",
};

export const holidayApiStatus = {
  serviceName: "공공 데이터 포털",
  connected: true,
  apiStatus: "정상 (응답시간 120ms)",
  annualHolidayCount: "17일 (2026년)",
};

export const YEAR_OPTIONS = ["2026년", "2025년", "2024년", "2023년", "2022년"];
export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);
export const AUTH_METHOD_OPTIONS: AuthMethod[] = [
  "IP+GPS(하이브리드)",
  "GPS만",
  "IP만",
  "관리자 수동승인만",
];
