"use client";

import { useActionState, useEffect, useState } from "react";
import { ChevronIcon } from "@/components/admin/ChevronIcon";
import { Card } from "@/components/admin/Card";
import { Button } from "@/components/admin/Button";
import { TextField } from "@/components/admin/TextField";
import { useToast } from "@/components/admin/ToastProvider";
import type { CompanySettings } from "@/lib/companySettings";
import type { LeavePolicyType } from "@/lib/leavePolicies";
import type { IpWhitelistEntry } from "@/lib/ipWhitelist";
import {
  saveScheduleSettings,
  saveLeavePolicySettings,
  saveGpsSettings,
  addIpEntry,
  deleteIpEntry,
  type SaveSettingsState,
} from "./actions";

const INITIAL_SAVE_STATE: SaveSettingsState = {};

const TABS = [
  { key: "basic", label: "기본 근무 설정" },
  { key: "leave", label: "휴가 정책 설정" },
  { key: "auth", label: "인증 설정 (IP/GPS)" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const DAY_NUMBER: Record<string, number> = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6, 일: 7 };

export function WorkSettingsTabs({
  companySettings,
  policyType,
  ipWhitelist,
}: {
  companySettings: CompanySettings;
  policyType: LeavePolicyType;
  ipWhitelist: IpWhitelistEntry[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const { showToast } = useToast();

  const [scheduleState, scheduleAction] = useActionState(saveScheduleSettings, INITIAL_SAVE_STATE);
  const [leaveState, leaveAction] = useActionState(saveLeavePolicySettings, INITIAL_SAVE_STATE);
  const [gpsState, gpsAction] = useActionState(saveGpsSettings, INITIAL_SAVE_STATE);

  useEffect(() => {
    if (scheduleState.success) showToast("근무 설정이 저장되었습니다.");
  }, [scheduleState, showToast]);
  useEffect(() => {
    if (leaveState.success) showToast("휴가 정책이 저장되었습니다.");
  }, [leaveState, showToast]);
  useEffect(() => {
    if (gpsState.success) showToast("GPS 설정이 저장되었습니다.");
  }, [gpsState, showToast]);

  return (
    <>
      <div className="relative w-full sm:hidden">
        <select
          value={activeTab}
          onChange={(event) => setActiveTab(event.target.value as TabKey)}
          className="w-full appearance-none rounded-[10px] border border-line bg-white py-[13px] pr-[40px] pl-[16px] text-[14px] font-bold tracking-[-0.28px] text-black transition-[border,box-shadow] focus:border-2 focus:border-black focus:shadow-[2px_4px_2px_rgba(0,0,0,0.2)] focus:outline-none"
        >
          {TABS.map((tab) => (
            <option key={tab.key} value={tab.key}>
              {tab.label}
            </option>
          ))}
        </select>
        <ChevronIcon className="pointer-events-none absolute top-1/2 right-[16px] size-[10px] -translate-y-1/2 text-line" />
      </div>

      <div className="hidden w-full items-center gap-[20px] border-b border-line sm:flex">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex shrink-0 items-center justify-between pb-[14px] text-[14px] font-bold tracking-[-0.28px] transition-colors sm:w-[280px] sm:text-[16px] sm:tracking-[-0.32px] lg:w-[368px] ${
              activeTab === tab.key
                ? "border-b-3 border-black text-black"
                : "text-line hover:text-black"
            }`}
          >
            {tab.label}
            <ChevronIcon className="size-[10px]" />
          </button>
        ))}
      </div>

      {activeTab === "basic" ? (
        <form action={scheduleAction} className="flex w-full flex-col gap-[40px]">
          <div className="flex w-full flex-col gap-4 py-[10px] sm:flex-row sm:items-center sm:gap-[40px]">
            <p className="w-[80px] shrink-0 text-[16px] font-bold tracking-[-0.32px] text-black">
              요일선택
            </p>
            <div className="grid flex-1 grid-cols-4 gap-1 sm:flex sm:flex-wrap sm:items-center sm:gap-px">
              {DAYS.map((day) => {
                const isActive = companySettings.workdays.includes(DAY_NUMBER[day]);
                return (
                  <label key={day} className="block">
                    <input
                      type="checkbox"
                      name="workdays"
                      value={day}
                      defaultChecked={isActive}
                      className="peer sr-only"
                    />
                    <span className="block cursor-pointer rounded-[10px] border border-line px-[12px] py-[14px] text-center text-[14px] font-semibold tracking-[-0.28px] text-black transition-colors peer-checked:border-transparent peer-checked:bg-sidebar-active peer-checked:text-white hover:border-sidebar-active hover:bg-sidebar-active hover:text-white peer-checked:hover:bg-black sm:w-[120px] sm:px-[20px]">
                      {day}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 py-[10px] sm:flex-row sm:items-center sm:gap-[40px]">
            <p className="w-[80px] shrink-0 text-[16px] font-bold tracking-[-0.32px] text-black">
              시간설정
            </p>
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-[20px]">
              <div className="flex items-center gap-[10px]">
                <input
                  type="time"
                  name="startTime"
                  defaultValue={companySettings.standardStartTime}
                  className="rounded-[12px] border border-divider px-[24px] py-[13px] text-[14px] font-semibold tracking-[-0.28px] text-line transition-[border,box-shadow] focus:border-2 focus:border-black focus:text-black focus:shadow-[2px_4px_2px_rgba(0,0,0,0.2)] focus:outline-none"
                />
                <input
                  type="time"
                  name="endTime"
                  defaultValue={companySettings.standardEndTime}
                  className="rounded-[12px] border border-divider px-[24px] py-[13px] text-[14px] font-semibold tracking-[-0.28px] text-line transition-[border,box-shadow] focus:border-2 focus:border-black focus:text-black focus:shadow-[2px_4px_2px_rgba(0,0,0,0.2)] focus:outline-none"
                />
              </div>
              <p className="text-[14px] font-semibold tracking-[-0.28px] text-muted">
                ⓘ 개별설정 없는 전 직원에 일괄 적용됩니다.
              </p>
            </div>
          </div>

          {scheduleState.error ? (
            <p role="alert" className="text-body font-semibold text-red-600">
              {scheduleState.error}
            </p>
          ) : null}

          <div className="flex w-full items-center justify-between gap-3 border-t border-muted pt-[30px]">
            <Button href="/settings/work" className="w-[110px] sm:w-[140px]">
              취소
            </Button>
            <Button type="submit" className="w-[110px] sm:w-[140px]">
              저장
            </Button>
          </div>
        </form>
      ) : null}

      {activeTab === "leave" ? (
        <form action={leaveAction} className="flex w-full flex-col gap-[20px]">
          <Card
            as="label"
            interactive
            className="flex cursor-pointer flex-col gap-2 sm:flex-row sm:items-center sm:gap-[40px]"
          >
            <span className="flex items-center gap-[8px]">
              <input
                type="radio"
                name="policyType"
                value="statutory"
                defaultChecked={policyType === "statutory"}
              />
              <span className="text-[14px] font-semibold tracking-[-0.28px] text-sidebar-active">
                법정 자동 계산 (권장)
              </span>
            </span>
            <span className="text-[12px] font-semibold tracking-[-0.24px] text-[#0f7bbe]">
              근로기준법 기준 자동 계산
            </span>
          </Card>

          <Card
            as="label"
            interactive
            className="flex cursor-pointer flex-col gap-2 sm:flex-row sm:items-center sm:gap-[40px]"
          >
            <span className="flex items-center gap-[8px]">
              <input
                type="radio"
                name="policyType"
                value="manual"
                defaultChecked={policyType === "manual"}
              />
              <span className="text-[14px] font-semibold tracking-[-0.28px] text-sidebar-active">
                관리자 수동입력
              </span>
            </span>
            <span className="text-[12px] font-semibold tracking-[-0.24px] text-[#0f7bbe]">
              직원별 연차 직접 입력
            </span>
          </Card>

          {leaveState.error ? (
            <p role="alert" className="text-body font-semibold text-red-600">
              {leaveState.error}
            </p>
          ) : null}

          <div className="flex w-full items-center justify-between gap-3 border-t border-muted pt-[30px]">
            <Button href="/settings/work" className="w-[110px] sm:w-[140px]">
              취소
            </Button>
            <Button type="submit" className="w-[110px] sm:w-[140px]">
              저장
            </Button>
          </div>
        </form>
      ) : null}

      {/* 그룹3(A 확산) — 인증탭만 구분 섹션(IP화이트리스트/GPS설정)이 있어 스태거 적용,
          나머지 두 탭(기본근무/휴가정책)은 라벨 없는 평면 폼이라 제외(S02/S16과 동일 판단). */}
      {activeTab === "auth" ? (
        <div className="flex w-full flex-col gap-[20px]">
          <div className="stagger-item flex w-full flex-col gap-[12px]" style={{ animationDelay: "0ms" }}>
            <p className="text-[16px] font-semibold tracking-[-0.32px] text-sidebar-active">
              사무실 IP 화이트리스트
            </p>
            {ipWhitelist.map((entry) => (
              <Card
                key={entry.id}
                interactive
                className="flex w-full flex-wrap items-center justify-between gap-2"
              >
                <p className="text-[16px] font-semibold tracking-[-0.32px] text-sidebar-active">
                  {entry.ipAddress} {entry.label ? `(${entry.label})` : ""}
                </p>
                <form action={deleteIpEntry.bind(null, entry.id)}>
                  <button
                    type="submit"
                    className="text-[12px] font-semibold tracking-[-0.24px] text-red-600 hover:underline"
                  >
                    삭제
                  </button>
                </form>
              </Card>
            ))}
            <form action={addIpEntry} className="flex w-full flex-wrap items-center justify-end gap-[8px]">
              <TextField
                type="text"
                name="ipAddress"
                placeholder="IP 주소 (예: 125.131.67.104)"
                variant="compact"
                required
                className="max-w-[220px]"
              />
              <TextField type="text" name="label" placeholder="라벨" variant="compact" className="max-w-[140px]" />
              <Button type="submit" size="sm">
                + IP 추가
              </Button>
            </form>
          </div>

          <form action={gpsAction} className="stagger-item flex w-full flex-col gap-[12px]" style={{ animationDelay: "70ms" }}>
            <p className="text-[16px] font-semibold tracking-[-0.32px] text-sidebar-active">
              GPS 설정
            </p>
            <div className="grid w-full grid-cols-1 gap-[12px] sm:grid-cols-3">
              <Card className="flex items-center justify-center gap-[8px] text-[16px] font-semibold tracking-[-0.32px] text-sidebar-active">
                <span>위도</span>
                <input
                  type="number"
                  step="0.0000001"
                  name="gpsLatitude"
                  defaultValue={companySettings.gpsLatitude ?? ""}
                  className="w-[110px] bg-transparent text-center focus:outline-none"
                />
              </Card>
              <Card className="flex items-center justify-center gap-[8px] text-[16px] font-semibold tracking-[-0.32px] text-sidebar-active">
                <span>경도</span>
                <input
                  type="number"
                  step="0.0000001"
                  name="gpsLongitude"
                  defaultValue={companySettings.gpsLongitude ?? ""}
                  className="w-[110px] bg-transparent text-center focus:outline-none"
                />
              </Card>
              <Card className="flex items-center justify-center gap-[8px] text-[16px] font-semibold tracking-[-0.32px] text-sidebar-active">
                <span>반경</span>
                <input
                  type="number"
                  step="1"
                  name="gpsRadiusM"
                  defaultValue={companySettings.gpsRadiusM ?? ""}
                  className="w-[70px] bg-transparent text-center focus:outline-none"
                />
                <span>m</span>
              </Card>
            </div>
            <p className="flex items-center gap-[6px] text-[14px] font-semibold tracking-[-0.28px] text-muted sm:justify-end">
              ⓘ 직원별 인증 방식(IP만/GPS만/하이브리드/수동승인)은 각 직원
              상세(A04)에서 개별 지정
            </p>

            {gpsState.error ? (
              <p role="alert" className="text-body font-semibold text-red-600">
                {gpsState.error}
              </p>
            ) : null}

            <div className="flex w-full items-center justify-between gap-3 border-t border-muted pt-[30px]">
              <Button href="/settings/work" className="w-[110px] sm:w-[140px]">
                취소
              </Button>
              <Button type="submit" className="w-[110px] sm:w-[140px]">
                저장
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
