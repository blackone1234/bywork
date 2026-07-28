import { redirect } from "next/navigation";
import { MobileTabRootHeader } from "@/components/mobile/Header";
import { MobileAvatar } from "@/components/mobile/Avatar";
import { MobileFieldRow } from "@/components/mobile/InfoBox";
import { MobileButton } from "@/components/mobile/Button";
import { MobileBottomNav } from "@/components/mobile/BottomNav";
import { MobileTabTransition } from "@/components/mobile/TabTransition";
import { ChevronRightIcon } from "@/components/mobile/icons";
import { logout } from "@/app/m/login/actions";
import { getCurrentEmployee, EMPLOYEE_SESSION_EXPIRED_MESSAGE } from "@/lib/employeeAccount";
import { formatDateDot } from "@/lib/employees";

/** S15 — 마이페이지 (light, 마이 탭 루트). */
export default async function MobileMyPage() {
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect(`/m/login?error=${encodeURIComponent(EMPLOYEE_SESSION_EXPIRED_MESSAGE)}`);
  }

  return (
    <MobileTabTransition>
    {/* 하단 네비가 fixed로 바뀌면서(스크롤해도 항상 고정) 정상 흐름에서 빠졌다 — 마지막
        콘텐츠가 네비에 가려지지 않도록 실측한 네비 높이(pb-[110px])만큼 여백을 확보한다. */}
    <div className="flex min-h-screen w-full flex-col bg-[var(--mobile-color-white)] pb-[110px]">
      <div className="flex w-full flex-col gap-[30px]">
        <MobileTabRootHeader title="MY" />

        {/* Figma 'S16 — 마이페이지' 개편분 실측: 로그아웃 버튼 하단→GNB 상단 74px 여백이
            새로 생겼다(이전엔 없었음) — pb-[74px]로 반영. */}
        {/* 그룹2(A 확산) — 프로필/계정설정/내정보/로그아웃 4섹션에 스태거 적용. */}
        <div className="flex w-full flex-col gap-[30px] px-[var(--mobile-space-30)] pb-[74px]">
          <div className="stagger-item flex w-full items-center gap-[20px]" style={{ animationDelay: "0ms" }}>
            <MobileAvatar initial={employee.name.charAt(0)} />
            <div className="flex flex-1 flex-col gap-[6px]">
              <p className="text-[20px] font-bold tracking-[-0.4px] text-[var(--mobile-color-black)]">{employee.name}</p>
              <div className="flex flex-col gap-[4px]">
                <p className="text-[length:var(--mobile-text-body)] font-semibold tracking-[var(--mobile-text-body-tracking)] text-[var(--mobile-color-black)]">
                  {employee.email}
                </p>
                <p className="text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]">
                  입사일 : {formatDateDot(employee.hireDate)}
                </p>
              </div>
            </div>
          </div>

          <div className="stagger-item flex w-full flex-col gap-[8px]" style={{ animationDelay: "70ms" }}>
            <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
              계정설정
            </p>
            <MobileFieldRow
              label="비밀번호 변경"
              href="/m/my/password"
              trailing={<ChevronRightIcon className="h-2 w-1 text-[var(--mobile-color-black)]" />}
            />
            {/* href를 안 줘서 원래도 클릭해도 아무 일이 안 일어나긴 했지만(죽은 링크는 아님),
                화살표 아이콘이 "누르면 이동한다"는 착각을 줘서 그룹F(WebAuthn) 착수 전까지
                "준비중" 표시로 바꿨다 — WebAuthn 로직 자체는 이번 그룹 범위 밖. */}
            <MobileFieldRow
              label="생체인증 설정"
              trailing={
                <span className="text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-warm-gray)]">
                  준비중
                </span>
              }
            />
          </div>

          <div className="stagger-item flex w-full flex-col gap-[8px]" style={{ animationDelay: "140ms" }}>
            <p className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]">
              내 정보
            </p>
            <MobileFieldRow label="입사일" value={formatDateDot(employee.hireDate)} />
            {/* 근무시간/근무지 표시 정책 미정 — 하드코딩 유지(CLAUDE.md 기록). */}
            <MobileFieldRow label="근무시간" value="09:00 ~18:00" />
            <MobileFieldRow label="근무지" value="본사 (기본 IP)" />
          </div>

          <div className="stagger-item" style={{ animationDelay: "210ms" }}>
            <form action={logout}>
              <MobileButton type="submit" variant="outline-dark">
                로그아웃
              </MobileButton>
            </form>
          </div>
        </div>
      </div>
      <MobileBottomNav active="my" theme="light" />
    </div>
    </MobileTabTransition>
  );
}
