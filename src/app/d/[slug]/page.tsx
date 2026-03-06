import { createServiceRoleClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Dealroom, DealroomContent, Reference, TeamMember } from '@/types/database';
import { t } from '@/lib/i18n';
import { DealroomClient } from '@/components/dealroom/dealroom-client';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

export default async function DealroomPage({ params }: Props) {
  const supabase = createServiceRoleClient();

  const { data: dealroom } = await supabase
    .from('dealrooms')
    .select('*')
    .eq('slug', params.slug)
    .in('status', ['published', 'signed'])
    .single();

  if (!dealroom) {
    // Check if dealroom exists but is inactive
    const { data: inactiveDr } = await supabase
      .from('dealrooms')
      .select('status')
      .eq('slug', params.slug)
      .eq('status', 'inactive')
      .single();

    if (inactiveDr) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
          <div className="text-center max-w-md">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Nicht mehr verfügbar</h1>
            <p className="text-gray-500">Dieser Dealroom ist nicht mehr aktiv. Bitte kontaktieren Sie Ihren Ansprechpartner für weitere Informationen.</p>
          </div>
        </div>
      );
    }

    notFound();
  }

  const dr = dealroom as Dealroom;
  const content = (dr.custom_content || dr.generated_content) as DealroomContent | null;

  // Fetch admin info for the broker name/avatar
  const { data: admin } = await supabase
    .from('admin_users')
    .select('name, avatar_url, company_name, company_logo_url, brand_color')
    .eq('id', dr.admin_id)
    .single();

  // Fetch assigned team member
  let assignedMember: TeamMember | null = null;
  if (dr.assigned_member_id) {
    const { data: member } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', dr.assigned_member_id)
      .single();
    assignedMember = member as TeamMember | null;
  }

  // Fetch active references
  const { data: refs } = await supabase
    .from('references')
    .select('*')
    .eq('admin_id', dr.admin_id)
    .eq('is_active', true)
    .order('sort_order');

  const translations = t(dr.language);

  return (
    <DealroomClient
      dealroom={dr}
      content={content}
      admin={admin}
      assignedMember={assignedMember}
      references={(refs as Reference[]) || []}
      translations={translations}
    />
  );
}
