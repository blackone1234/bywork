"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

/**
 * S01(로그인)/S03·S07(홈)의 어두운 배경에서는 filled-accent(노란 필)와 outline(warm-gray)을,
 * S02/S11/S15/S16 등 밝은 배경에서는 outline-dark(dark-gray 테두리)를 primary CTA로 쓴다.
 * S02의 "비밀번호 등록 완료"만 filled-muted(soft-gray 채움)로 다른데, 폼이 아직 유효하지
 * 않은 상태의 표현으로 해석해 비활성처럼 보이는 이 스타일을 그대로 남겨둔다.
 */
export type MobileButtonVariant = "filled-accent" | "outline-dark" | "outline-warm" | "filled-muted";

/**
 * outline-* variant는 실제 `border` 대신 inset box-shadow로 테두리를 그린다 — 사용자 지시로
 * 테두리 있는/없는 버튼 높이를 완전히 통일해야 해서, 박스 크기에 영향을 주는 진짜 border를
 * 없애고 레이아웃에 관여하지 않는 box-shadow(inset)로 대체했다.
 */
const VARIANT_CLASSNAME: Record<MobileButtonVariant, string> = {
  "filled-accent": "bg-[var(--mobile-color-accent)] text-[var(--mobile-color-black)]",
  "outline-dark": "shadow-[inset_0_0_0_1px_var(--mobile-color-dark-gray)] text-[var(--mobile-color-dark-gray)]",
  "outline-warm": "shadow-[inset_0_0_0_1px_var(--mobile-color-warm-gray)] text-[var(--mobile-color-warm-gray)]",
  "filled-muted": "bg-[var(--mobile-color-soft-gray)] text-[var(--mobile-color-white)]",
};

type MobileButtonOwnProps = {
  variant?: MobileButtonVariant;
  fullWidth?: boolean;
  /**
   * S01 "생체인증으로 로그인"만 다른 outline-warm 버튼(S04의 외출하기/외근하기 등)보다
   * 작다 — pt-16/pb-17 + 14px(트래킹 -0.28) vs 표준 pt-18/pb-19 + 16px(-0.32). 같은
   * variant인데 화면마다 크기가 달라서 별도 size prop으로 뺐다 (get_design_context로
   * 대조해서 발견).
   */
  compact?: boolean;
  href?: string;
  className?: string;
  children: React.ReactNode;
};

type MobileButtonProps = MobileButtonOwnProps & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

// standard는 Bold, compact는 SemiBold — 크기뿐 아니라 폰트 굵기도 다르다(둘 다 코드로 직접 확인).
// standard 높이는 사용자 지시로 63px→56px 강제 고정, 테두리 유무와 무관하게 전부 동일
// 56px가 되도록 border를 없앤 만큼(-2px) 패딩을 pt-16/pb-16으로 보정했다.
// compact(S01 생체인증)는 outline-warm을 쓰는데, border를 box-shadow로 바꾸면서 잃은
// 테두리 2px만큼 pt/pb를 +1px씩 보정해 기존 높이(border 포함 값)를 그대로 유지한다.
const SIZE_CLASSNAME = {
  standard: "pt-[16px] pb-[16px] text-[length:var(--mobile-text-subtitle)] tracking-[var(--mobile-text-subtitle-tracking)] font-bold",
  compact: "pt-[17px] pb-[18px] text-[length:var(--mobile-text-body)] tracking-[var(--mobile-text-body-tracking)] font-semibold",
};

export function MobileButton({
  variant = "filled-accent",
  fullWidth = true,
  compact = false,
  href,
  className = "",
  children,
  ...rest
}: MobileButtonProps) {
  const classes = `flex items-center justify-center gap-[var(--mobile-space-10)] rounded-[var(--mobile-radius-pill)] px-[var(--mobile-space-24)] ${
    compact ? SIZE_CLASSNAME.compact : SIZE_CLASSNAME.standard
  } ${fullWidth ? "w-full" : ""} ${VARIANT_CLASSNAME[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" {...rest} className={classes}>
      {children}
    </button>
  );
}
