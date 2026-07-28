"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileChip } from "@/components/mobile/Chip";
import { MobileDateField, MobileTextArea } from "@/components/mobile/TextField";
import { MobileInfoBox, MobileInfoRow } from "@/components/mobile/InfoBox";
import { MobileButton } from "@/components/mobile/Button";
import { PlusIcon } from "@/components/mobile/icons";
import { LEAVE_TYPES, type LeaveType } from "@/lib/leaveTypes";
import { submitLeaveRequestAction, type LeaveSubmitState } from "./actions";

const initialState: LeaveSubmitState = {};

function todayKST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

/** src/lib/employeeLeaveRequests.ts의 calendarDaysBetween과 동일 로직 — "신청일수" 미리보기용. */
function calendarDaysBetween(start: string, end: string): number {
  const startMs = new Date(`${start}T00:00:00Z`).getTime();
  const endMs = new Date(`${end}T00:00:00Z`).getTime();
  return Math.round((endMs - startMs) / 86_400_000) + 1;
}

/**
 * S11 — 휴가 신청 폼. Figma 원본은 "날짜 선택" 필드 하나 + "날짜 추가" 버튼이었는데,
 * DB 스키마(leave_requests.start_date/end_date)가 연속된 기간 하나만 표현할 수 있어서
 * "날짜 추가"를 비연속 다중 날짜가 아니라 "종료일 추가(기간으로 확장)"로 해석해
 * 구현했다 — 반차는 하루만 가능하므로 종료일 추가 자체를 숨긴다.
 */
export function LeaveNewForm({ remaining }: { remaining: number }) {
  const [state, formAction] = useActionState(submitLeaveRequestAction, initialState);
  const router = useRouter();

  useEffect(() => {
    // 서버 액션이 성공 시 redirect()를 바로 던지면 클라이언트가 성공 여부를 알
    // 방법이 없어서(state가 절대 갱신 안 됨) 알럿을 못 띄운다 — 성공 상태를
    // 돌려받아 여기서 알럿 후 이동한다.
    if (state.success) {
      window.alert("신청완료 되었습니다.");
      router.push("/m/leave");
    }
  }, [state, router]);

  const [selectedType, setSelectedType] = useState(0);
  const leaveType = LEAVE_TYPES[selectedType] as LeaveType;
  const isHalfDay = leaveType !== "연차";

  const [startDate, setStartDate] = useState(todayKST());
  const [endDate, setEndDate] = useState<string | null>(null);
  const [showEndDate, setShowEndDate] = useState(false);

  const effectiveEndDate = isHalfDay ? startDate : endDate || startDate;
  const requestedDays = isHalfDay ? 0.5 : calendarDaysBetween(startDate, effectiveEndDate);
  const remainingAfter = remaining - requestedDays;

  function handleTypeChange(index: number) {
    setSelectedType(index);
    if (LEAVE_TYPES[index] !== "연차") {
      setShowEndDate(false);
      setEndDate(null);
    }
  }

  function handleStartDateChange(value: string) {
    setStartDate(value);
    if (endDate && endDate < value) setEndDate(value);
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-[30px] px-[var(--mobile-space-30)]">
      <input type="hidden" name="leaveType" value={leaveType} />
      <input type="hidden" name="startDate" value={startDate} />
      <input type="hidden" name="endDate" value={effectiveEndDate} />

      {/* 그룹2(A 확산) — 휴가종류/날짜+사유+신청정보/제출버튼 3섹션에 스태거 적용. */}
      <div className="stagger-item flex w-full flex-col gap-[10px]" style={{ animationDelay: "0ms" }}>
        <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
          휴가 종류
        </p>
        <div className="flex w-full gap-[10px]">
          {LEAVE_TYPES.map((type, index) => (
            <MobileChip key={type} label={type} selected={index === selectedType} onClick={() => handleTypeChange(index)} />
          ))}
        </div>
      </div>

      <div className="stagger-item flex w-full flex-col gap-[16px]" style={{ animationDelay: "70ms" }}>
        <div className="flex w-full flex-col gap-[8px]">
          <MobileDateField
            id="leave-start-date"
            label={isHalfDay ? "날짜 선택" : "시작일"}
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
          />
          {!isHalfDay && showEndDate ? (
            <MobileDateField
              id="leave-end-date"
              label="종료일"
              value={endDate ?? startDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          ) : null}
          {!isHalfDay && !showEndDate ? (
            <button
              type="button"
              onClick={() => {
                setShowEndDate(true);
                setEndDate(startDate);
              }}
              className="flex w-full items-center justify-center gap-[10px] border-0 p-0 pt-[10px]"
            >
              <PlusIcon className="size-2.5 text-[var(--mobile-color-soft-gray)]" />
              <span className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
                날짜 추가
              </span>
            </button>
          ) : null}
        </div>

        <MobileTextArea id="leave-reason" name="reason" label="사유 입력" placeholder="사유를 입력해주세요." rows={3} className="h-[78px]" />

        <div className="flex w-full flex-col gap-[8px]">
          <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
            신청 정보
          </p>
          <MobileInfoBox>
            <MobileInfoRow label="신청일수" value={`${requestedDays}일`} />
            <MobileInfoRow label="신청 후 잔여 연차" value={`${remainingAfter}일`} />
          </MobileInfoBox>
        </div>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="w-full text-center text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-notification)]"
        >
          {state.error}
        </p>
      ) : null}

      {/* 사용자 지시로 신청정보 박스↔버튼 간격을 40px(바깥 gap-30+기존 pt-10)→20px로
          강제 고정 — 바깥 gap-30은 다른 섹션 사이에도 쓰여서 건드리지 않고, 이 버튼에만
          -10px 마진으로 보정. */}
      <MobileButton type="submit" variant="outline-dark" className="stagger-item mt-[-10px]" style={{ animationDelay: "140ms" }}>
        신청하기
      </MobileButton>
    </form>
  );
}
