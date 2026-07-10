export function ModalScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-sidebar-active px-4">
      <div className="flex w-full max-w-[420px] flex-col items-center justify-center gap-[20px] rounded-[12px] bg-white p-6 shadow-[2px_4px_3px_rgba(0,0,0,0.2)] sm:p-[24px]">
        {children}
      </div>
    </div>
  );
}
