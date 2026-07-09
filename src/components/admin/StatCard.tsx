export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-[14px] rounded-[10px] border border-line bg-white p-[20px]">
      <p className="text-[14px] font-semibold tracking-[-0.28px] text-black">{label}</p>
      <p className="text-right text-[32px] font-extrabold tracking-[-0.64px] text-black">
        {value}
      </p>
    </div>
  );
}
