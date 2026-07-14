import type { ComponentPropsWithoutRef } from "react";

/**
 * 어두운 화면(S01/S02 계열은 실제로는 밝은 배경이지만 인풋 자체는 어두운 로그인 화면과
 * 동일한 style/mark_1 컴포넌트를 재사용)과 밝은 화면(S11 사유입력 등)에서 배경만 달라진다.
 * bg="transparent"가 기본값이고, 사유입력/날짜선택처럼 옅은 회색 채움이 필요하면 bg="filled".
 */
export type MobileTextFieldBg = "transparent" | "filled";

type MobileTextFieldProps = {
  label?: string;
  bg?: MobileTextFieldBg;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"input">, "className">;

const BG_CLASSNAME: Record<MobileTextFieldBg, string> = {
  transparent: "bg-transparent",
  filled: "bg-[var(--mobile-color-input-bg)]",
};

export function MobileTextField({ label, bg = "transparent", className = "", id, ...rest }: MobileTextFieldProps) {
  return (
    <div className="flex w-full flex-col items-start justify-center gap-[var(--mobile-space-10)]">
      {label ? (
        <label
          htmlFor={id}
          className="text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]"
        >
          {label}
        </label>
      ) : null}
      <input
        id={id}
        {...rest}
        className={`w-full rounded-[var(--mobile-radius-input)] border border-[var(--mobile-color-warm-gray)] px-[var(--mobile-space-30)] py-[var(--mobile-space-20)] text-[length:var(--mobile-text-subtitle)] tracking-[var(--mobile-text-subtitle-tracking)] text-[var(--mobile-color-black)] placeholder:text-[var(--mobile-color-warm-gray)] focus:outline-none ${BG_CLASSNAME[bg]} ${className}`}
      />
    </div>
  );
}

type MobileTextAreaProps = {
  label?: string;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"textarea">, "className">;

export function MobileTextArea({ label, className = "", id, ...rest }: MobileTextAreaProps) {
  return (
    <div className="flex w-full flex-col items-start justify-center gap-[var(--mobile-space-10)]">
      {label ? (
        <label
          htmlFor={id}
          className="text-[length:var(--mobile-text-caption)] font-semibold tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-soft-gray)]"
        >
          {label}
        </label>
      ) : null}
      <textarea
        id={id}
        {...rest}
        className={`w-full rounded-[var(--mobile-radius-chip)] border border-[var(--mobile-color-light-gray)] bg-[var(--mobile-color-input-bg)] p-[var(--mobile-space-30)] text-[length:var(--mobile-text-body)] tracking-[var(--mobile-text-body-tracking)] text-[var(--mobile-color-black)] placeholder:text-[var(--mobile-color-warm-gray)] focus:outline-none ${className}`}
      />
    </div>
  );
}
