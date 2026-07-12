import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

export type ButtonVariant = "outline" | "primary" | "outline-pill";
export type ButtonSize = "md" | "sm" | "xs" | "toolbar";

const VARIANT_CLASSNAME: Record<Exclude<ButtonVariant, "outline-pill">, string> = {
  outline:
    "border border-muted bg-white text-muted transition-colors hover:border-sidebar-active hover:bg-sidebar-active hover:text-white",
  primary:
    "bg-sidebar-active text-white shadow-[2px_4px_2px_rgba(0,0,0,0.2)] transition-colors hover:bg-black",
};

const SIZE_CLASSNAME: Record<ButtonSize, string> = {
  md: "rounded-[10px] px-[24px] py-[13px] text-[14px] tracking-[-0.28px]",
  sm: "rounded-[10px] px-[16px] py-[8px] text-[12px] tracking-[-0.24px]",
  xs: "rounded-[10px] px-[24px] py-[12px] text-[12px] tracking-[-0.24px]",
  toolbar: "rounded-[10px] py-[13px] pr-[24px] pl-[20px] text-[12px] tracking-[-0.24px]",
};

const OUTLINE_PILL_CLASSNAME =
  "rounded-full border-2 border-black bg-white px-[24px] py-[13px] text-[14px] tracking-[-0.28px] text-black transition-colors hover:bg-black hover:text-white";

const PRIMARY_PILL_CLASSNAME =
  "gap-[14px] rounded-full bg-sidebar-active px-[24px] py-[11px] text-[14px] tracking-[-0.28px] text-white transition-colors hover:bg-black";

type ButtonOwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Only meaningful with variant="primary" — swaps the rectangular shape for a full pill, matching the "직원추가" CTA. */
  pill?: boolean;
  href?: string;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButtonProps = ButtonOwnProps &
  Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

function resolveClassName({
  variant = "outline",
  size = "md",
  pill = false,
  className = "",
}: Omit<ButtonOwnProps, "children" | "href">) {
  const base = "flex items-center justify-center font-semibold";

  if (variant === "outline-pill") {
    return `${base} ${OUTLINE_PILL_CLASSNAME} ${className}`;
  }

  if (variant === "primary" && pill) {
    return `${base} ${PRIMARY_PILL_CLASSNAME} ${className}`;
  }

  return `${base} ${VARIANT_CLASSNAME[variant]} ${SIZE_CLASSNAME[size]} ${className}`;
}

export function Button({ href, children, ...props }: ButtonAsButtonProps) {
  const className = resolveClassName(props);

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  const { variant: _variant, size: _size, pill: _pill, className: _className, ...rest } = props;
  return (
    <button type="button" {...rest} className={className}>
      {children}
    </button>
  );
}
