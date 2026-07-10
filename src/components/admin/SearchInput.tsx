export function SearchInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex w-full max-w-[600px] items-center justify-between rounded-[30px] border border-divider py-[8px] pr-[14px] pl-[30px] transition-[border,box-shadow] focus-within:border-2 focus-within:border-black focus-within:shadow-[2px_4px_2px_rgba(0,0,0,0.2)]">
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
