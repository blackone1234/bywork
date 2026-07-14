import { MobileSubPageHeader } from "@/components/mobile/Header";
import { MobileStatusBadge } from "@/components/mobile/StatusBadge";
import { MobileRecordCard } from "@/components/mobile/InfoBox";
import { MobileBottomNav } from "@/components/mobile/BottomNav";

/**
 * S09 — 근태 날짜 상세 (light, 드릴인). [date] 세그먼트는 아직 실제 근태 레코드 조회에
 * 쓰이지 않고 Figma 목데이터를 그대로 보여준다 — 근태 Supabase 연동 시 교체.
 */
export default function MobileAttendanceDetailPage() {
  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-[var(--mobile-color-white)]">
      <div className="flex w-full flex-col gap-[40px] px-[var(--mobile-space-30)]">
        <MobileSubPageHeader
          title="2026년 7월 2일 목요일"
          meta={
            <div className="flex items-center gap-[var(--mobile-space-20)]">
              <MobileStatusBadge status="normal">정상근무</MobileStatusBadge>
              <p className="text-[length:var(--mobile-text-body)] tracking-[var(--mobile-text-body-tracking)] text-[var(--mobile-color-black)]">
                총 8h 57m
              </p>
            </div>
          }
        />
        <div className="flex w-full flex-col gap-[40px]">
          <MobileRecordCard
            title="근무기록"
            rows={[
              { label: "출근", value: "09:03" },
              { label: "외출", value: "09:03" },
              { label: "복귀", value: "09:03" },
              { label: "퇴근", value: "09:03" },
            ]}
          />
          <MobileRecordCard
            title="분석"
            rows={[
              { label: "순 근무 시간", value: "8h 57m" },
              { label: "외출 시간", value: "45m" },
              { label: "SSID 자동체크", value: "적용" },
            ]}
          />
        </div>
      </div>
      <MobileBottomNav active="attendance" theme="light" />
    </div>
  );
}
