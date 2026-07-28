import { redirect } from "next/navigation";
import { MobileSubPageHeader } from "@/components/mobile/Header";
import { MobileStatusBadge, type MobileStatus } from "@/components/mobile/StatusBadge";
import { MobileRecordCard } from "@/components/mobile/InfoBox";
import { MobileBottomNav } from "@/components/mobile/BottomNav";
import { getCurrentEmployee, EMPLOYEE_SESSION_EXPIRED_MESSAGE } from "@/lib/employeeAccount";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { AttendanceEventType } from "@/lib/attendanceEvents";

export const dynamic = "force-dynamic";

const EVENT_LABEL: Record<AttendanceEventType, string> = {
  check_in: "출근",
  go_out_personal: "외출",
  go_out_business: "외근",
  return: "복귀",
  check_out: "퇴근",
};

const STATUS_DISPLAY: Record<"present" | "remote" | "absent" | "on_leave", { badge: MobileStatus; text: string }> = {
  present: { badge: "normal", text: "정상근무" },
  remote: { badge: "normal", text: "외출/외근" },
  on_leave: { badge: "leave", text: "연차" },
  absent: { badge: "rejected", text: "결근" },
};

function formatTimeKST(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateLabelKST(date: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(`${date}T00:00:00+09:00`));
}

function diffHm(fromIso: string, toIso?: string): { h: number; m: number } {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  const totalMinutes = Math.max(0, Math.round((to - from) / 60_000));
  return { h: Math.floor(totalMinutes / 60), m: totalMinutes % 60 };
}

function formatDurationShort(fromIso: string, toIso?: string): string {
  const { h, m } = diffHm(fromIso, toIso);
  return `${h}h ${m}m`;
}

/**
 * S09 — 근태 날짜 상세 (light, 드릴인). [date](YYYY-MM-DD)의 실제 attendance_records_with_times +
 * attendance_events를 조회한다. "근무기록" 카드는 그날 실제로 발생한 이벤트를 발생 순서 그대로
 * 나열한다 — 외출→복귀가 여러 번 있었으면 그만큼 행이 늘어난다(고정 4행 목업이 아니다).
 */
export default async function MobileAttendanceDetailPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect(`/m/login?error=${encodeURIComponent(EMPLOYEE_SESSION_EXPIRED_MESSAGE)}`);
  }

  const supabase = createSupabaseAdminClient();
  const { data: record, error: recordError } = await supabase
    .from("attendance_records_with_times")
    .select("id, status, check_in_at, check_out_at")
    .eq("employee_id", employee.id)
    .eq("work_date", date)
    .maybeSingle();

  if (recordError) throw new Error(`근태 상세를 불러오지 못했습니다: ${recordError.message}`);

  const dateLabel = formatDateLabelKST(date);

  if (!record) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-[var(--mobile-color-white)] pb-[110px]">
        <div className="flex w-full flex-col gap-[30px]">
          <MobileSubPageHeader title={dateLabel} />
          <p className="w-full px-[var(--mobile-space-30)] text-[length:var(--mobile-text-body)] text-[var(--mobile-color-soft-gray)]">
            이 날짜의 근태 기록이 없습니다.
          </p>
        </div>
        <MobileBottomNav active="attendance" theme="light" />
      </div>
    );
  }

  const { data: events, error: eventsError } = await supabase
    .from("attendance_events")
    .select("event_type, occurred_at")
    .eq("attendance_record_id", record.id)
    .order("occurred_at", { ascending: true });

  if (eventsError) throw new Error(`근태 이벤트를 불러오지 못했습니다: ${eventsError.message}`);

  const eventRows = (events ?? []).map((e) => ({
    label: EVENT_LABEL[e.event_type as AttendanceEventType],
    value: formatTimeKST(e.occurred_at),
  }));

  // 외출 시간 = go_out_* → return 쌍마다의 간격 합 (미복귀 상태로 하루가 끝났으면 그 구간은 제외).
  let outMinutes = 0;
  let pendingOutAt: string | null = null;
  for (const e of events ?? []) {
    if (e.event_type === "go_out_personal" || e.event_type === "go_out_business") {
      pendingOutAt = e.occurred_at;
    } else if (e.event_type === "return" && pendingOutAt) {
      outMinutes += Math.round((new Date(e.occurred_at).getTime() - new Date(pendingOutAt).getTime()) / 60_000);
      pendingOutAt = null;
    }
  }

  const statusDisplay = STATUS_DISPLAY[record.status as keyof typeof STATUS_DISPLAY];
  const totalLabel = record.check_in_at && record.check_out_at ? formatDurationShort(record.check_in_at, record.check_out_at) : "-";

  // "순 근무 시간" = 총 근무시간 - 외출/외근 시간. 그룹D 작업 중 발견한 버그: 이전엔
  // "순"이라는 라벨을 달고도 실제로는 outMinutes를 빼지 않은 총 근무시간(gross)을
  // 그대로 썼다 — 외출 시간은 바로 옆에 정확히 따로 계산해뒀으면서 정작 "순"에서는
  // 안 뺐던 것.
  const netMinutesLabel = (() => {
    if (!record.check_in_at || !record.check_out_at) return "-";
    const grossMinutes = Math.round(
      (new Date(record.check_out_at).getTime() - new Date(record.check_in_at).getTime()) / 60_000,
    );
    const netMinutes = Math.max(0, grossMinutes - outMinutes);
    return `${Math.floor(netMinutes / 60)}h ${netMinutes % 60}m`;
  })();

  return (
    <div className="flex min-h-screen w-full flex-col bg-[var(--mobile-color-white)] pb-[110px]">
      {/* get_metadata 실측: welcome(타이틀+뱃지행) 하단→#info(첫 구분선) 상단은 40px가 아니라
          30px다 — 카드 두 개(근무기록/분석) 사이 40px와 헷갈리기 쉬워 별도로 확인 필요했다. */}
      <div className="flex w-full flex-col gap-[30px]">
        <MobileSubPageHeader
          title={dateLabel}
          meta={
            <div className="flex items-center gap-[var(--mobile-space-20)]">
              <MobileStatusBadge status={statusDisplay.badge} size="compact">
                {statusDisplay.text}
              </MobileStatusBadge>
              <p className="text-[length:var(--mobile-text-body)] font-semibold tracking-[var(--mobile-text-body-tracking)] text-[var(--mobile-color-black)]">
                총 {totalLabel}
              </p>
            </div>
          }
        />
        {/* 그룹2(A 확산) — 근무기록/분석 카드 2섹션에 스태거 적용. */}
        <div className="flex w-full flex-col gap-[40px] px-[var(--mobile-space-30)]">
          <div className="stagger-item" style={{ animationDelay: "0ms" }}>
            {eventRows.length > 0 ? (
              <MobileRecordCard title="근무기록" rows={eventRows} />
            ) : (
              <p className="text-[length:var(--mobile-text-body)] text-[var(--mobile-color-soft-gray)]">아직 기록된 이벤트가 없습니다.</p>
            )}
          </div>
          <div className="stagger-item" style={{ animationDelay: "70ms" }}>
            <MobileRecordCard
              title="분석"
              rows={[
                { label: "순 근무 시간", value: netMinutesLabel },
                { label: "외출 시간", value: `${outMinutes}m` },
                { label: "SSID 자동체크", value: "적용" },
              ]}
            />
          </div>
        </div>
      </div>
      <MobileBottomNav active="attendance" theme="light" />
    </div>
  );
}
