export function Badge({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[8px] px-[12px] py-[8px] text-[12px] font-semibold tracking-[-0.24px] ${className}`}
    >
      {children}
    </span>
  );
}
