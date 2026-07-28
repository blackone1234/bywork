"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MobileButton, type MobileButtonVariant } from "@/components/mobile/Button";
import { ManualReasonSheet } from "@/components/mobile/ManualReasonSheet";
import { submitAttendanceEvent } from "./actions";
import type { AttendanceEventType } from "@/lib/attendanceEvents";
import type { AuthMethodDb } from "@/lib/employees";

/**
 * ip_only/manual_approval 직원에게는 위치 권한 프롬프트를 띄울 이유가 없다(서버가
 * 애초에 좌표를 쓰지 않음) — gps_only/hybrid만 위치를 시도한다.
 */
function needsCoords(authMethod: AuthMethodDb): boolean {
  return authMethod === "gps_only" || authMethod === "hybrid";
}

function getCoords(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 },
    );
  });
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="w-full text-center text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-notification)]"
    >
      {children}
    </p>
  );
}

/** S03(출근하기)/S05·S06(복귀하기) — 버튼 하나짜리 상태가 공유하는 컴포넌트. */
export function AttendanceActionButton({
  eventType,
  authMethod,
  variant,
  children,
}: {
  eventType: AttendanceEventType;
  authMethod: AuthMethodDb;
  variant: MobileButtonVariant;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [manualCoords, setManualCoords] = useState<{ lat: number; lng: number } | null | undefined>(undefined);
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const coords = needsCoords(authMethod) ? await getCoords() : null;
      const result = await submitAttendanceEvent(eventType, coords);
      if (result.ok) {
        router.refresh();
      } else if (result.reason === "manual_approval_required") {
        // IP/GPS 인증 자체가 실패한 경우만 M1(사유 입력)로 분기 — 순서 오류(invalid_sequence)는
        // 사유를 입력한다고 해결되는 문제가 아니므로 기존 인라인 에러 그대로 둔다.
        setManualCoords(coords);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="flex w-full flex-col items-center gap-[10px]">
      <MobileButton type="button" variant={variant} onClick={handleClick} disabled={pending}>
        {pending ? "처리 중..." : children}
      </MobileButton>
      {error ? <ErrorText>{error}</ErrorText> : null}
      {manualCoords !== undefined ? (
        <ManualReasonSheet
          eventType={eventType}
          coords={manualCoords}
          onClose={() => setManualCoords(undefined)}
          onSubmitted={() => {
            setManualCoords(undefined);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

/** S04(근무중) — 외출하기/외근하기/퇴근하기 3버튼이 하나의 pending/error 상태를 공유. */
export function AttendanceWorkingButtons({ authMethod }: { authMethod: AuthMethodDb }) {
  const [pending, startTransition] = useTransition();
  const [pendingType, setPendingType] = useState<AttendanceEventType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualEventType, setManualEventType] = useState<AttendanceEventType | null>(null);
  const [manualCoords, setManualCoords] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();

  function handleClick(eventType: AttendanceEventType) {
    setError(null);
    setPendingType(eventType);
    startTransition(async () => {
      const coords = needsCoords(authMethod) ? await getCoords() : null;
      const result = await submitAttendanceEvent(eventType, coords);
      if (result.ok) {
        router.refresh();
      } else if (result.reason === "manual_approval_required") {
        setManualEventType(eventType);
        setManualCoords(coords);
      } else {
        setError(result.message);
      }
      setPendingType(null);
    });
  }

  return (
    <div className="flex w-full flex-col gap-[14px]">
      <div className="flex gap-[10px]">
        <MobileButton type="button" variant="outline-warm" onClick={() => handleClick("go_out_personal")} disabled={pending}>
          {pendingType === "go_out_personal" ? "처리 중..." : "외출하기"}
        </MobileButton>
        <MobileButton type="button" variant="outline-warm" onClick={() => handleClick("go_out_business")} disabled={pending}>
          {pendingType === "go_out_business" ? "처리 중..." : "외근하기"}
        </MobileButton>
      </div>
      <MobileButton type="button" variant="filled-accent" onClick={() => handleClick("check_out")} disabled={pending}>
        {pendingType === "check_out" ? "처리 중..." : "퇴근하기"}
      </MobileButton>
      {error ? <ErrorText>{error}</ErrorText> : null}
      {manualEventType ? (
        <ManualReasonSheet
          eventType={manualEventType}
          coords={manualCoords}
          onClose={() => setManualEventType(null)}
          onSubmitted={() => {
            setManualEventType(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
