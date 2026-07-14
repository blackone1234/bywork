import type { ComponentPropsWithoutRef } from "react";

/**
 * 밝은 화면(S11 사유입력 등)과 어두운 화면(S01 로그인)에서 배경만 달라지는 게 아니라,
 * 실제로 타이핑한 값의 글자색도 달라져야 한다 — S01은 검은 배경이라 값 텍스트가
 * black이면 안 보인다. bg="transparent"가 기본값이고, 사유입력/날짜선택처럼 옅은
 * 회색 채움이 필요하면 bg="filled". textColor="light"는 S01/S02처럼 어두운 배경 위
 * 인풋에 쓴다.
 */
export type MobileTextFieldBg = "transparent" | "filled";
export type MobileTextFieldTextColor = "dark" | "light";

type MobileTextFieldProps = {
  label?: string;
  bg?: MobileTextFieldBg;
  textColor?: MobileTextFieldTextColor;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"input">, "className">;

const BG_CLASSNAME: Record<MobileTextFieldBg, string> = {
  transparent: "bg-transparent",
  filled: "bg-[var(--mobile-color-input-bg)]",
};

const TEXT_COLOR_CLASSNAME: Record<MobileTextFieldTextColor, string> = {
  dark: "text-[var(--mobile-color-black)]",
  light: "text-[var(--mobile-color-white)]",
};

export function MobileTextField({
  label,
  bg = "transparent",
  textColor = "dark",
  className = "",
  id,
  ...rest
}: MobileTextFieldProps) {
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
        className={`w-full rounded-[var(--mobile-radius-input)] border border-[var(--mobile-color-warm-gray)] px-[var(--mobile-space-30)] py-[var(--mobile-space-20)] text-[length:var(--mobile-text-subtitle)] tracking-[var(--mobile-text-subtitle-tracking)] placeholder:text-[var(--mobile-color-warm-gray)] focus:outline-none ${BG_CLASSNAME[bg]} ${TEXT_COLOR_CLASSNAME[textColor]} ${className}`}
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
