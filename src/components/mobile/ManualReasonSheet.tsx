"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { MobileButton } from "@/components/mobile/Button";
import { MobileBottomNav } from "@/components/mobile/BottomNav";
import { LocationPinIcon } from "@/components/mobile/icons";
import { submitManualAttendance } from "@/app/m/actions";
import type { AttendanceEventType } from "@/lib/attendanceEvents";

/**
 * M1 — 인증 실패 시 사유 입력 시트. IP/GPS 둘 다 실패(manual_approval_required)했을 때
 * S03~S07의 5개 버튼 전부가 여기로 분기한다. Figma 원본은 GNB까지 포함한 전체 화면
 * 프레임이지만, 실제로는 홈 화면 위에 뜨는 오버레이라 createPortal로 document.body에
 * 렌더링한다(admin TerminateButton과 같은 이유 — 바깥 클릭 핸들러/레이아웃과 DOM 상
 * 얽히지 않도록).
 */
export function ManualReasonSheet({
  eventType,
  coords,
  onClose,
  onSubmitted,
}: {
  eventType: AttendanceEventType;
  coords: { lat: number; lng: number } | null;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!reason.trim()) {
      window.alert("사유를 입력해주세요.");
      return;
    }
    startTransition(async () => {
      const result = await submitManualAttendance(eventType, reason, coords);
      if (result.ok) {
        onSubmitted();
      } else if (result.reason === "reason_required") {
        window.alert(result.message);
      } else {
        window.alert(result.message);
        onClose();
      }
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col items-start bg-[var(--mobile-color-black)]">
      <div className="flex h-[60px] w-full shrink-0 flex-col items-start px-[var(--mobile-space-30)] pt-[60px]" />
      <div className="flex w-full flex-1 flex-col items-start gap-[52px] px-[var(--mobile-space-30)] py-[60px] pb-[110px]">
        <div className="flex w-full flex-col items-start gap-[30px]">
          <div className="flex w-full items-center justify-center">
            <LocationPinIcon />
          </div>
          <div className="flex w-full flex-col items-center justify-center gap-[18px] text-center">
            <p className="text-[28px] leading-[36px] font-extrabold tracking-[-0.56px] text-[var(--mobile-color-white)]">
              위치를 확인할 수 없어요.
            </p>
            <div className="flex flex-col items-center justify-center gap-[5px] pt-[2px] text-[13px] font-semibold tracking-[-0.26px] text-[var(--mobile-color-soft-gray)]">
              <p>IP·GPS 인증 범위 밖에 있어요.</p>
              <p>사유를 입력하면 기록을 남길 수 있어요.</p>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-[24px]">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={"사유를 입력해주세요.\n예) 고객사 미팅 후 바로 퇴근"}
            rows={2}
            className="w-full resize-none rounded-[var(--mobile-radius-chip)] border border-[var(--mobile-color-warm-gray)] bg-transparent p-[var(--mobile-space-30)] text-left text-[14px] leading-[22px] font-semibold tracking-[-0.28px] text-[var(--mobile-color-white)] placeholder:text-[var(--mobile-color-warm-gray)] focus:outline-none"
          />
          <div className="flex w-full flex-col items-start gap-[14px]">
            <MobileButton type="button" variant="filled-accent" onClick={handleSubmit} disabled={pending}>
              {pending ? "처리 중..." : "사유와 함께 기록하기"}
            </MobileButton>
            <MobileButton type="button" variant="outline-warm" onClick={onClose} disabled={pending}>
              취소
            </MobileButton>
          </div>
        </div>
      </div>
      <MobileBottomNav active="home" theme="dark" />
    </div>,
    document.body,
  );
}
