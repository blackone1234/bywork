"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { ChevronIcon } from "@/components/admin/ChevronIcon";
import { Card } from "@/components/admin/Card";
import { Button } from "@/components/admin/Button";
import { gpsSettings, ipWhitelist } from "@/lib/dummy-data";

const TABS = [
  { key: "basic", label: "기본 근무 설정" },
  { key: "leave", label: "휴가 정책 설정" },
  { key: "auth", label: "인증 설정 (IP/GPS)" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const ACTIVE_DAYS = new Set(["월", "화", "수"]);

export default function WorkSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  return (
    <>
      <PageHeader breadcrumb={["Dashboard", "근무설정"]} />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
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
          <div className="flex w-full flex-col gap-[40px]">
            <div className="flex w-full flex-col gap-4 py-[10px] sm:flex-row sm:items-center sm:gap-[40px]">
              <p className="w-[80px] shrink-0 text-[16px] font-bold tracking-[-0.32px] text-black">
                요일선택
              </p>
              <div className="grid flex-1 grid-cols-4 gap-1 sm:flex sm:flex-wrap sm:items-center sm:gap-px">
                {DAYS.map((day) => {
                  const isActive = ACTIVE_DAYS.has(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`rounded-[10px] px-[12px] py-[14px] text-center text-[14px] font-semibold tracking-[-0.28px] transition-colors sm:w-[120px] sm:px-[20px] ${
                        isActive
                          ? "bg-sidebar-active text-white hover:bg-black"
                          : "border border-line text-black hover:border-sidebar-active hover:bg-sidebar-active hover:text-white"
                      }`}
                    >
                      {day}
                    </button>
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
                    defaultValue="09:00"
                    className="rounded-[12px] border border-divider px-[24px] py-[13px] text-[14px] font-semibold tracking-[-0.28px] text-line transition-[border,box-shadow] focus:border-2 focus:border-black focus:text-black focus:shadow-[2px_4px_2px_rgba(0,0,0,0.2)] focus:outline-none"
                  />
                  <input
                    type="time"
                    defaultValue="18:00"
                    className="rounded-[12px] border border-divider px-[24px] py-[13px] text-[14px] font-semibold tracking-[-0.28px] text-line transition-[border,box-shadow] focus:border-2 focus:border-black focus:text-black focus:shadow-[2px_4px_2px_rgba(0,0,0,0.2)] focus:outline-none"
                  />
                </div>
                <p className="text-[14px] font-semibold tracking-[-0.28px] text-muted">
                  ⓘ 개별설정 없는 전 직원에 일괄 적용됩니다.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "leave" ? (
          <div className="flex w-full flex-col gap-[20px]">
            <Card
              as="label"
              interactive
              className="flex cursor-pointer flex-col gap-2 sm:flex-row sm:items-center sm:gap-[40px]"
            >
              <span className="flex items-center gap-[8px]">
                <input type="radio" name="leave-policy" defaultChecked />
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
                <input type="radio" name="leave-policy" />
                <span className="text-[14px] font-semibold tracking-[-0.28px] text-sidebar-active">
                  관리자 수동입력
                </span>
              </span>
              <span className="text-[12px] font-semibold tracking-[-0.24px] text-[#0f7bbe]">
                직원별 연차 직접 입력
              </span>
            </Card>
          </div>
        ) : null}

        {activeTab === "auth" ? (
          <div className="flex w-full flex-col gap-[20px]">
            <div className="flex w-full flex-col gap-[12px]">
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
                    {entry.ipAddress} ({entry.label})
                  </p>
                  <button
                    type="button"
                    className="text-[12px] font-semibold tracking-[-0.24px] text-red-600 hover:underline"
                  >
                    삭제
                  </button>
                </Card>
              ))}
              <div className="flex w-full justify-end">
                <Button size="sm">+ IP 추가</Button>
              </div>
            </div>

            <div className="flex w-full flex-col gap-[12px]">
              <p className="text-[16px] font-semibold tracking-[-0.32px] text-sidebar-active">
                GPS 설정
              </p>
              <div className="grid w-full grid-cols-1 gap-[12px] sm:grid-cols-3">
                <Card className="flex items-center justify-center text-[16px] font-semibold tracking-[-0.32px] text-sidebar-active">
                  위도 {gpsSettings.latitude}
                </Card>
                <Card className="flex items-center justify-center text-[16px] font-semibold tracking-[-0.32px] text-sidebar-active">
                  경도 {gpsSettings.longitude}
                </Card>
                <Card className="flex items-center justify-center text-[16px] font-semibold tracking-[-0.32px] text-sidebar-active">
                  반경 {gpsSettings.radiusM}m
                </Card>
              </div>
              <p className="flex items-center gap-[6px] text-[14px] font-semibold tracking-[-0.28px] text-muted sm:justify-end">
                ⓘ 직원별 인증 방식(IP만/GPS만/하이브리드/수동승인)은 각 직원
                상세(A04)에서 개별 지정
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex w-full items-center justify-between gap-3 border-t border-muted pt-[30px]">
          <Button className="w-[110px] sm:w-[140px]">취소</Button>
          <Button className="w-[110px] sm:w-[140px]">저장</Button>
        </div>
      </div>
    </>
  );
}
