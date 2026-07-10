import { Sidebar } from "@/components/admin/Sidebar";
import { MobileGnb } from "@/components/admin/MobileGnb";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white lg:flex-row lg:items-stretch">
      <MobileGnb />

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex min-h-screen flex-1 flex-col bg-page">
        {children}
      </div>
    </div>
  );
}
