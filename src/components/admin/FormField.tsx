export function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-center">
      <div className="flex w-[160px] shrink-0 items-center gap-[6px]">
        {required ? <span className="text-[14px] text-red-500">●</span> : null}
        <span className="text-[16px] font-semibold tracking-[-0.32px] text-black">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
