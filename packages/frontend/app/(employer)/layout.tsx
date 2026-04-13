import { EmployerSidebar } from '@/components/layout/EmployerSidebar';

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <EmployerSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
