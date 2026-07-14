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

const VARIANT_CLASSNAME: Record<MobileButtonVariant, string> = {
  "filled-accent": "bg-[var(--mobile-color-accent)] text-[var(--mobile-color-black)]",
  "outline-dark": "border border-[var(--mobile-color-dark-gray)] text-[var(--mobile-color-dark-gray)]",
  "outline-warm": "border border-[var(--mobile-color-warm-gray)] text-[var(--mobile-color-warm-gray)]",
  "filled-muted": "bg-[var(--mobile-color-soft-gray)] text-[var(--mobile-color-white)]",
};

type MobileButtonOwnProps = {
  variant?: MobileButtonVariant;
  fullWidth?: boolean;
  href?: string;
  className?: string;
  children: React.ReactNode;
};

type MobileButtonProps = MobileButtonOwnProps & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

export function MobileButton({ variant = "filled-accent", fullWidth = true, href, className = "", children, ...rest }: MobileButtonProps) {
  const classes = `flex items-center justify-center gap-[var(--mobile-space-10)] rounded-[var(--mobile-radius-pill)] px-[var(--mobile-space-24)] pt-[18px] pb-[19px] text-[length:var(--mobile-text-subtitle)] font-bold tracking-[var(--mobile-text-subtitle-tracking)] ${fullWidth ? "w-full" : ""} ${VARIANT_CLASSNAME[variant]} ${className}`;

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
