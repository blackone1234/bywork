import type { ComponentPropsWithoutRef, ElementType } from "react";

type CardProps<T extends ElementType> = ComponentPropsWithoutRef<T> & {
  as?: T;
  interactive?: boolean;
  padding?: "default" | "loose";
};

export function Card<T extends ElementType = "div">({
  as,
  interactive = false,
  padding = "default",
  className = "",
  children,
  ...rest
}: CardProps<T>) {
  const Tag = as ?? "div";
  return (
    <Tag
      {...rest}
      className={`rounded-lg border border-divider bg-white px-[var(--space-30)] ${
        padding === "loose" ? "py-[var(--space-24)]" : "py-[var(--space-20)]"
      } ${interactive ? "transition-colors hover:border-black" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
