import { Sidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full items-stretch bg-white">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col bg-page">
        {children}
      </div>
    </div>
  );
}
