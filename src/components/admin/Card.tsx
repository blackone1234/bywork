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
      className={`rounded-[12px] border border-divider bg-white px-[30px] ${
        padding === "loose" ? "py-[24px]" : "py-[20px]"
      } ${interactive ? "transition-colors hover:border-black" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
