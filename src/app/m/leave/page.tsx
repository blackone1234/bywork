import { MobileTabRootHeader } from "@/components/mobile/Header";
import { MobileButton } from "@/components/mobile/Button";
import { MobileSummaryRow } from "@/components/mobile/StatCard";
import { MobileSectionLabel } from "@/components/mobile/InfoBox";
import { MobileListRow } from "@/components/mobile/ListRow";
import { MobileStatusBadge } from "@/components/mobile/StatusBadge";
import { MobileBottomNav } from "@/components/mobile/BottomNav";
import { PlusIcon } from "@/components/mobile/icons";

/** S10 — 휴가 현황 (light, 휴가 탭 루트). */
export default function MobileLeavePage() {
  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-[var(--mobile-color-white)]">
      <div className="flex w-full flex-col gap-[30px]">
        <MobileTabRootHeader title="휴가현황" />

        <div className="flex w-full flex-col gap-[30px] px-[var(--mobile-space-30)]">
          <MobileSummaryRow items={[{ value: "15", label: "총부여" }, { value: "3", label: "사용" }, { value: "12", label: "잔여" }]} />

          {/* 사용자 지시로 표준 버튼 높이(pt18/pb19)보다 4px 낮게 강제 고정 — !important로
              공용 SIZE_CLASSNAME.standard를 이 버튼에서만 덮어씀. */}
          <MobileButton variant="outline-dark" href="/m/leave/new" className="gap-[10px] !pt-[16px] !pb-[17px]">
            <PlusIcon className="size-2.5" />
            휴가 신청하기
          </MobileButton>

          <div className="flex w-full flex-col gap-[30px]">
            <MobileSectionLabel title="신청내역" />
            <div className="flex w-full flex-col gap-[10px]">
              <MobileListRow title="2026.07.15" subtitle="연차" trailing={<MobileStatusBadge status="pending">대기</MobileStatusBadge>} />
              <MobileListRow
                title="2026.07.15"
                subtitle="반차(오후)"
                trailing={<MobileStatusBadge status="approved">승인</MobileStatusBadge>}
              />
              <MobileListRow title="2026.07.15" subtitle="연차" trailing={<MobileStatusBadge status="approved">승인</MobileStatusBadge>} />
              <MobileListRow title="2026.07.15" subtitle="연차" trailing={<MobileStatusBadge status="pending">대기</MobileStatusBadge>} />
              <MobileListRow title="2026.07.15" subtitle="연차" trailing={<MobileStatusBadge status="rejected">반려</MobileStatusBadge>} />
            </div>
          </div>
        </div>
      </div>
      <MobileBottomNav active="leave" theme="light" />
    </div>
  );
}
