import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Solarheld',
    default: 'Dashboard | Solarheld',
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();

  // Try to get admin user info, but don't require auth
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .limit(1)
    .single();

  const showOnboarding = !(adminUser?.has_completed_onboarding);

  return (
    <DashboardShell showOnboarding={showOnboarding}>
      <div className="flex h-screen bg-[#fafafa]">
        <DashboardSidebar
          userName={adminUser?.name || 'Admin'}
          companyName={adminUser?.company_name || 'Solarheld'}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="hidden md:block">
            <DashboardHeader userName={adminUser?.name || 'Admin'} />
          </div>
          <div className="flex-1 overflow-y-auto pt-14 md:pt-0 pb-16 md:pb-0">
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </DashboardShell>
  );
}
