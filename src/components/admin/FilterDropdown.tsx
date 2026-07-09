export function FilterDropdown({
  label,
  width = 130,
}: {
  label: string;
  width?: number;
}) {
  return (
    <button
      type="button"
      style={{ width }}
      className="flex items-center justify-between rounded-[30px] border border-divider px-[24px] py-[11px] text-[14px] font-semibold tracking-[-0.28px] text-line"
    >
      {label}
      <span aria-hidden>▾</span>
    </button>
  );
}
