import type { AttendanceState } from "@/components/admin/StatusBadge";

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
