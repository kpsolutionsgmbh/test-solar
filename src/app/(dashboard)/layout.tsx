import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Gündesli & Kollegen',
    default: 'Dashboard | Gündesli & Kollegen',
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .single();

  const showOnboarding = !(adminUser?.has_completed_onboarding);

  return (
    <DashboardShell showOnboarding={showOnboarding}>
      <div className="flex h-screen bg-[#fafafa]">
        <DashboardSidebar
          userName={adminUser?.name || user.email || 'Admin'}
          companyName={adminUser?.company_name || 'Gündesli & Kollegen'}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="hidden md:block">
            <DashboardHeader userName={adminUser?.name || user.email || 'Admin'} />
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
