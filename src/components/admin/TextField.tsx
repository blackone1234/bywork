import type { ComponentPropsWithoutRef } from "react";

export type TextFieldVariant = "default" | "compact";
export type TextFieldBorderColor = "divider" | "line";

const VARIANT_CLASSNAME: Record<TextFieldVariant, string> = {
  default: "py-[16px] pr-[14px] pl-[30px] text-black",
  compact: "px-[24px] py-[13px] text-line",
};

const BORDER_CLASSNAME: Record<TextFieldBorderColor, string> = {
  divider: "border-divider",
  line: "border-line",
};

type TextFieldProps = Omit<ComponentPropsWithoutRef<"input">, "className"> & {
  variant?: TextFieldVariant;
  fullWidth?: boolean;
  borderColor?: TextFieldBorderColor;
  className?: string;
};

export function TextField({
  variant = "default",
  fullWidth = false,
  borderColor = "divider",
  className = "",
  ...rest
}: TextFieldProps) {
  return (
    <input
      {...rest}
      className={`${fullWidth ? "w-full" : "w-full max-w-[500px]"} rounded-[12px] border ${BORDER_CLASSNAME[borderColor]} text-[14px] font-semibold tracking-[-0.28px] placeholder:text-line transition-[border,box-shadow] focus:border-2 focus:border-black focus:text-black focus:shadow-[2px_4px_2px_rgba(0,0,0,0.2)] focus:outline-none ${VARIANT_CLASSNAME[variant]} ${className}`}
    />
  );
}
