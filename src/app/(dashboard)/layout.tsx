import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Dealroom Gündesli & Kollegen',
    default: 'Dashboard | Dealroom Gündesli & Kollegen',
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

  return (
    <div className="flex h-screen bg-[#fafafa]">
      <DashboardSidebar
        userName={adminUser?.name || user.email || 'Admin'}
        companyName={adminUser?.company_name || 'Gündesli & Kollegen'}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userName={adminUser?.name || user.email || 'Admin'} />
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
