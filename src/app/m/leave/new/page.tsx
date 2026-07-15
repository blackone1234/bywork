"use client";

import { useState } from "react";
import { MobileSubPageHeader } from "@/components/mobile/Header";
import { MobileChip } from "@/components/mobile/Chip";
import { MobileTextField, MobileTextArea } from "@/components/mobile/TextField";
import { MobileInfoBox, MobileInfoRow } from "@/components/mobile/InfoBox";
import { MobileButton } from "@/components/mobile/Button";
import { MobileBottomNav } from "@/components/mobile/BottomNav";
import { PlusIcon } from "@/components/mobile/icons";

const LEAVE_TYPES = ["연차", "반차 (오전)", "반차 (오후)"];

/** S11 — 휴가 신청 (light, 드릴인). */
export default function MobileLeaveNewPage() {
  const [selectedType, setSelectedType] = useState(0);

  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-[var(--mobile-color-white)]">
      <div className="flex w-full flex-col gap-[30px]">
        <MobileSubPageHeader title="휴가신청" />

        <div className="flex w-full flex-col gap-[30px] px-[var(--mobile-space-30)]">
          <div className="flex w-full flex-col gap-[10px]">
            <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
              휴가 종류
            </p>
            <div className="flex w-full gap-[10px]">
              {LEAVE_TYPES.map((type, index) => (
                <MobileChip key={type} label={type} selected={index === selectedType} onClick={() => setSelectedType(index)} />
              ))}
            </div>
          </div>

          <div className="flex w-full flex-col gap-[16px]">
            <div className="flex w-full flex-col gap-[8px]">
              <MobileTextField label="날짜 선택" bg="filled" defaultValue="2026년 7월 15일 (수)" readOnly className="text-center" />
              <button type="button" className="flex w-full items-center justify-center gap-[10px] border-0 p-0 pt-[10px]">
                <PlusIcon className="size-2.5 text-[var(--mobile-color-soft-gray)]" />
                <span className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
                  날짜 추가
                </span>
              </button>
            </div>

            {/* 사용자 지시로 높이를 78px로 강제 고정(125px→154px→78px). */}
            <MobileTextArea label="사유 입력" placeholder="사유를 입력해주세요." rows={3} className="h-[78px]" />

            <div className="flex w-full flex-col gap-[8px]">
              <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
                신청 정보
              </p>
              <MobileInfoBox>
                <MobileInfoRow label="신청일수" value="1일" />
                <MobileInfoRow label="신청 후 잔여 연차" value="14일" />
              </MobileInfoBox>
            </div>
          </div>

          <div className="py-[10px]">
            <MobileButton variant="outline-dark">신청하기</MobileButton>
          </div>
        </div>
      </div>
      <MobileBottomNav active="leave" theme="light" />
    </div>
  );
}
