import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

const defaultFlows = [
  {
    name: 'Dealroom-Versand',
    description: 'Wird gesendet wenn ein Dealroom veröffentlicht wird',
    trigger_type: 'manual',
    trigger_days: 0,
    subject_template: 'Ihr persönliches Angebot, {{anrede}} {{nachname}}',
    body_template: `Sehr geehrte{{r}} {{anrede}} {{nachname}},

wir haben für {{firma}} ein persönliches Angebot zusammengestellt, das genau auf Ihre Anforderungen zugeschnitten ist.

Über den folgenden Link können Sie sich alle Details in Ruhe ansehen:

Bei Fragen stehe ich Ihnen jederzeit gerne zur Verfügung.

Mit freundlichen Grüßen
{{ansprechpartner_name}}
{{ansprechpartner_email}}`,
    is_active: false,
    max_sends: 1,
    skip_weekends: true,
    skip_if_signed: true,
    skip_if_inactive: true,
  },
  {
    name: 'Erinnerung: Nicht geöffnet',
    description: '3 Tage nach Versand, wenn Kunde nicht geöffnet hat',
    trigger_type: 'not_opened',
    trigger_days: 3,
    subject_template: '{{anrede}} {{nachname}}, Ihr Angebot wartet auf Sie',
    body_template: `Sehr geehrte{{r}} {{anrede}} {{nachname}},

wir haben Ihnen kürzlich ein persönliches Angebot für {{firma}} zusammengestellt.

Falls Sie noch keine Gelegenheit hatten, sich die Details anzusehen – über den folgenden Link erreichen Sie Ihr Angebot jederzeit:

Bei Fragen stehe ich Ihnen jederzeit zur Verfügung.

Mit freundlichen Grüßen
{{ansprechpartner_name}}
{{ansprechpartner_telefon}}
{{ansprechpartner_email}}`,
    is_active: false,
    max_sends: 1,
    skip_weekends: true,
    skip_if_signed: true,
    skip_if_inactive: true,
  },
  {
    name: 'Erinnerung: Nicht unterschrieben',
    description: '3 Tage nachdem Kunde Angebot angesehen hat',
    trigger_type: 'offer_not_signed',
    trigger_days: 3,
    subject_template: 'Haben Sie noch Fragen zum Angebot, {{anrede}} {{nachname}}?',
    body_template: `Sehr geehrte{{r}} {{anrede}} {{nachname}},

wir haben gesehen, dass Sie sich das Angebot für {{firma}} bereits angesehen haben. Das freut uns!

Falls Sie noch Fragen haben oder Anpassungen wünschen, melden Sie sich gerne bei mir. Ich bin jederzeit für Sie da.

Sie können das Angebot auch nochmal in Ruhe ansehen:

Mit freundlichen Grüßen
{{ansprechpartner_name}}
{{ansprechpartner_telefon}}
{{ansprechpartner_email}}`,
    is_active: false,
    max_sends: 1,
    skip_weekends: true,
    skip_if_signed: true,
    skip_if_inactive: true,
  },
  {
    name: 'Erinnerung: Inaktivität',
    description: '7 Tage ohne Aktivität',
    trigger_type: 'inactive',
    trigger_days: 7,
    subject_template: 'Ihr Angebot ist noch gültig – {{firma}}',
    body_template: `Sehr geehrte{{r}} {{anrede}} {{nachname}},

Ihr persönliches Angebot für {{firma}} ist weiterhin für Sie verfügbar.

Falls sich Ihre Anforderungen geändert haben oder Sie weitere Informationen benötigen, lassen Sie es mich gerne wissen.

Hier gelangen Sie direkt zu Ihrem Angebot:

Mit freundlichen Grüßen
{{ansprechpartner_name}}
{{ansprechpartner_telefon}}
{{ansprechpartner_email}}`,
    is_active: false,
    max_sends: 1,
    skip_weekends: true,
    skip_if_signed: true,
    skip_if_inactive: true,
  },
];

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serviceClient = createServiceRoleClient();

    // Check if flows already exist for this admin
    const { count } = await serviceClient
      .from('email_flows')
      .select('id', { count: 'exact', head: true })
      .eq('admin_id', user.id);

    if ((count || 0) > 0) {
      return NextResponse.json({ message: 'Flows already exist', count });
    }

    // Insert default flows
    const { data, error } = await serviceClient
      .from('email_flows')
      .insert(defaultFlows.map(f => ({ ...f, admin_id: user.id })))
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ created: data?.length || 0 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
