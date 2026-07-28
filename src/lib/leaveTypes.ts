/**
 * S11 클라이언트 폼과 서버 로직(employeeLeaveRequests.ts) 양쪽에서 쓰는 휴가 종류 상수.
 * employeeLeaveRequests.ts는 "server-only"를 import하므로, 거기서 이 값을 export하면
 * 클라이언트 컴포넌트가 값 하나만 갖다 써도 전체 모듈이 클라이언트 번들에 끌려와
 * 빌드 에러가 난다 — 그래서 의존성 없는 별도 파일로 뗐다.
 */
export const LEAVE_TYPES = ["연차", "반차 (오전)", "반차 (오후)"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];
