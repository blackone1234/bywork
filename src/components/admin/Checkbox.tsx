type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
};

export function Checkbox({ checked, onChange, label, id }: CheckboxProps) {
  return (
    <label htmlFor={id} className="flex w-fit cursor-pointer items-center gap-[10px]">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      {checked ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
          <rect x="1" y="1" width="22" height="22" rx="3" stroke="black" strokeWidth="2" />
          <path
            d="M6.66667 13.3333L9.33333 16L16.6667 8.66667"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <span aria-hidden className="size-[24px] shrink-0 rounded-[4px] border-2 border-divider" />
      )}
      <span className="text-[14px] font-semibold tracking-[-0.28px] text-muted">{label}</span>
    </label>
  );
}
