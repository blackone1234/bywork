import type { ComponentPropsWithoutRef } from "react";

export type TextFieldVariant = "default" | "compact";

const VARIANT_CLASSNAME: Record<TextFieldVariant, string> = {
  default: "py-[16px] pr-[14px] pl-[30px] text-black",
  compact: "px-[24px] py-[13px] text-line",
};

type TextFieldProps = Omit<ComponentPropsWithoutRef<"input">, "className"> & {
  variant?: TextFieldVariant;
  fullWidth?: boolean;
  className?: string;
};

export function TextField({
  variant = "default",
  fullWidth = false,
  className = "",
  ...rest
}: TextFieldProps) {
  return (
    <input
      {...rest}
      className={`${fullWidth ? "w-full" : "w-full max-w-[500px]"} rounded-[12px] border border-divider text-[14px] font-semibold tracking-[-0.28px] placeholder:text-line transition-[border,box-shadow] focus:border-2 focus:border-black focus:text-black focus:shadow-[2px_4px_2px_rgba(0,0,0,0.2)] focus:outline-none ${VARIANT_CLASSNAME[variant]} ${className}`}
    />
  );
}
