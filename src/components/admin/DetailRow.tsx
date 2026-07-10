export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-2 py-[12px] sm:flex-row sm:items-center sm:gap-0">
      <div className="w-full shrink-0 text-[14px] font-semibold tracking-[-0.28px] text-muted sm:w-[160px]">
        {label}
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-[12px] sm:gap-[20px]">
        {children}
      </div>
    </div>
  );
}
