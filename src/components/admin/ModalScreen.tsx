export function ModalScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-sidebar-active">
      <div className="flex flex-col items-center justify-center gap-[20px] rounded-[12px] bg-white p-[24px] shadow-[2px_4px_3px_rgba(0,0,0,0.2)]">
        {children}
      </div>
    </div>
  );
}
