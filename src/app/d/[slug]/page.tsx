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

  if (!dealroom) {
    return {
      title: 'Nicht verfügbar | Gündesli & Kollegen',
      robots: { index: false, follow: false },
    };
  }

  const content = dealroom?.custom_content || dealroom?.generated_content;
  const title = content?.hero_title || `Angebot für ${dealroom?.client_company || 'Sie'}`;

  return {
    title: `${title} | Gündesli & Kollegen`,
    robots: { index: false, follow: false },
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
    notFound();
  }

  const dr = dealroom as Dealroom;
  const content = (dr.custom_content || dr.generated_content) as DealroomContent | null;

  // Fetch admin, team member, references, and documents in parallel
  const [{ data: admin }, { data: member }, { data: refs }, { data: docs }] = await Promise.all([
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
    supabase
      .from('dealroom_documents')
      .select('id, name, file_url, file_type, file_size')
      .eq('dealroom_id', dr.id)
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
      documents={docs || []}
      translations={translations}
    />
  );
}
