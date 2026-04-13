import { ApplicantSidebar } from '@/components/layout/ApplicantSidebar';

export default function ApplicantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <ApplicantSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
