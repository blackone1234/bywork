export function SearchInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex w-[600px] items-center justify-between rounded-[30px] border border-divider py-[8px] pr-[14px] pl-[30px]">
      <input
        type="text"
        placeholder={placeholder}
        className="w-full bg-transparent text-[14px] font-semibold tracking-[-0.28px] text-black placeholder:text-muted focus:outline-none"
      />
      <span aria-hidden className="flex size-[30px] items-center justify-center text-muted">
        🔍
      </span>
    </div>
  );
}
