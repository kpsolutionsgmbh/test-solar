import { createServiceRoleClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Dealroom, DealroomContent, Reference, TeamMember } from '@/types/database';
import { t } from '@/lib/i18n';
import { DealroomClient } from '@/components/dealroom/dealroom-client';

export const revalidate = 60;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createServiceRoleClient();
  const { data: dealroom } = await supabase
    .from('dealrooms')
    .select('generated_content, custom_content, client_company')
    .eq('slug', params.slug)
    .single();

  const content = dealroom?.custom_content || dealroom?.generated_content;
  const title = content?.hero_title || `Angebot für ${dealroom?.client_company || 'Sie'}`;

  return {
    title: `${title} | Gündesli & Kollegen`,
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
  };
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

  // Fetch admin, team member, and references in parallel
  const [{ data: admin }, { data: member }, { data: refs }] = await Promise.all([
    supabase
      .from('admin_users')
      .select('name, avatar_url, company_name, company_logo_url, brand_color')
      .eq('id', dr.admin_id)
      .single(),
    dr.assigned_member_id
      ? supabase
          .from('team_members')
          .select('*')
          .eq('id', dr.assigned_member_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from('references')
      .select('id, client_name, client_company, quote, result_summary, situation_text, method_text, image_url, video_url, logo_url, sort_order')
      .eq('admin_id', dr.admin_id)
      .eq('is_active', true)
      .order('sort_order'),
  ]);

  const translations = t(dr.language);

  return (
    <DealroomClient
      dealroom={dr}
      content={content}
      admin={admin}
      assignedMember={member as TeamMember | null}
      references={(refs as Reference[]) || []}
      translations={translations}
    />
  );
}
