export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-center py-[12px]">
      <div className="w-[160px] shrink-0 text-[14px] font-semibold tracking-[-0.28px] text-muted">
        {label}
      </div>
      <div className="flex flex-1 items-center gap-[20px]">{children}</div>
    </div>
  );
}
