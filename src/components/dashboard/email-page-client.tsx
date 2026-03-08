'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmailFlow } from '@/types/database';
import { EmailFlowSeedButton } from '@/components/dashboard/email-flow-seed-button';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Clock,
  Send,
  Search,
  Lightbulb,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  SkipForward,
  MailOpen,
  MousePointerClick,
  Eye,
  AlertTriangle,
  Check,
} from 'lucide-react';

type Tab = 'automatic' | 'single' | 'history';

interface EmailLog {
  id: string;
  flow_id: string | null;
  dealroom_id: string | null;
  recipient_email: string;
  subject: string;
  status: string;
  skip_reason: string | null;
  source?: string;
  opened_at?: string | null;
  clicked_at?: string | null;
  sent_at: string;
}

interface DealroomOption {
  id: string;
  client_name: string;
  client_company: string;
  client_email: string | null;
  slug: string;
  status: string;
  customer_id: string | null;
  assigned_member_id: string | null;
  customers: { salutation: string; first_name: string; last_name: string; company: string } | null;
  team_members: { name: string; email: string; phone: string | null } | null;
}

interface AdminProfile {
  name: string;
  email: string;
}

interface Props {
  flows: EmailFlow[];
  lastExecutions: Record<string, string>;
  logs: EmailLog[];
  dealrooms: DealroomOption[];
  adminProfile?: AdminProfile;
}

const triggerLabels: Record<string, string> = {
  manual: 'Wird manuell ausgelöst',
  not_opened: 'Kunde hat Angebotsraum nicht geöffnet',
  opened_not_offer: 'Geöffnet, aber Angebot nicht angesehen',
  offer_not_signed: 'Angebot angesehen, aber nicht unterschrieben',
  inactive: 'Keine Aktivität seit mehreren Tagen',
};

const emailTemplates = [
  {
    name: 'Erstversand',
    subject: 'Ihr persönliches Angebot, {{anrede}} {{nachname}}',
    body: `Sehr geehrte{{r}} {{anrede}} {{nachname}},

vielen Dank für unser Gespräch. Wir haben für {{firma}} ein persönliches Angebot zusammengestellt.

Über den folgenden Link können Sie sich alle Details in Ruhe ansehen:
{{dealroom_link}}

Bei Fragen stehe ich Ihnen jederzeit gerne zur Verfügung.

Mit freundlichen Grüßen
{{ansprechpartner_name}}
{{ansprechpartner_email}}`,
  },
  {
    name: 'Nachfass',
    subject: 'Kurze Rückfrage, {{anrede}} {{nachname}}',
    body: `Sehr geehrte{{r}} {{anrede}} {{nachname}},

ich wollte kurz nachfragen, ob Sie sich das Angebot für {{firma}} bereits ansehen konnten.

Falls Sie noch Fragen haben oder Anpassungen wünschen, melden Sie sich gerne bei mir.

Hier ist nochmal der Link zu Ihrem Angebot:
{{dealroom_link}}

Mit freundlichen Grüßen
{{ansprechpartner_name}}
{{ansprechpartner_telefon}}`,
  },
  {
    name: 'Terminvereinbarung',
    subject: 'Sollen wir einen Termin machen?',
    body: `Sehr geehrte{{r}} {{anrede}} {{nachname}},

gerne bespreche ich offene Fragen zum Angebot für {{firma}} persönlich mit Ihnen.

Wann passt es Ihnen am besten? Ich bin flexibel und richte mich nach Ihrem Kalender.

Mit freundlichen Grüßen
{{ansprechpartner_name}}
{{ansprechpartner_telefon}}
{{ansprechpartner_email}}`,
  },
  {
    name: 'Freie E-Mail',
    subject: '',
    body: '',
  },
];

const personalizationLabels = [
  { label: '{{anrede}}', desc: 'Herr/Frau' },
  { label: '{{vorname}}', desc: 'Vorname' },
  { label: '{{nachname}}', desc: 'Nachname' },
  { label: '{{firma}}', desc: 'Firmenname' },
  { label: '{{ansprechpartner_name}}', desc: 'Ihr Name' },
  { label: '{{ansprechpartner_telefon}}', desc: 'Ihre Telefonnummer' },
  { label: '{{ansprechpartner_email}}', desc: 'Ihre E-Mail' },
  { label: '{{dealroom_link}}', desc: 'Link zum Angebot' },
];

function replacePlaceholders(template: string, replacements: Record<string, string>): string {
  let result = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replaceAll(placeholder, value);
  }
  return result;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Noch nie ausgeführt';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Gerade eben';
  if (diffMins < 60) return `vor ${diffMins} Min.`;
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  if (diffDays === 1) return 'gestern';
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  return date.toLocaleDateString('de-DE');
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  if (d.toDateString() === today.toDateString()) return `Heute, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Gestern, ${time}`;
  return `${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}, ${time}`;
}

export function EmailPageClient({ flows, lastExecutions, logs, dealrooms, adminProfile }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('automatic');
  const router = useRouter();
  const { toast } = useToast();

  // Composer state
  const [selectedDealroomId, setSelectedDealroomId] = useState('');
  const [dealroomSearch, setDealroomSearch] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // History filter
  const [historyFilter, setHistoryFilter] = useState<'all' | 'flow' | 'manual'>('all');
  const [historySearch, setHistorySearch] = useState('');

  const selectedDealroom = dealrooms.find(d => d.id === selectedDealroomId);

  const filteredDealrooms = dealrooms.filter(d => {
    const q = dealroomSearch.toLowerCase();
    return !q || d.client_name.toLowerCase().includes(q) || d.client_company.toLowerCase().includes(q);
  });

  // Build placeholder replacements for preview
  const placeholderReplacements = useMemo((): Record<string, string> => {
    if (!selectedDealroom) return {} as Record<string, string>;

    const customer = selectedDealroom.customers;
    const member = selectedDealroom.team_members;
    const nameParts = selectedDealroom.client_name.split(' ');

    const anrede = customer?.salutation || '';
    const vorname = customer?.first_name || nameParts[0] || '';
    const nachname = customer?.last_name || nameParts.slice(1).join(' ') || '';
    const firma = customer?.company || selectedDealroom.client_company || '';
    const dealroomLink = typeof window !== 'undefined'
      ? `${window.location.origin}/d/${selectedDealroom.slug}`
      : `/d/${selectedDealroom.slug}`;

    return {
      '{{anrede}}': anrede,
      '{{vorname}}': vorname,
      '{{nachname}}': nachname,
      '{{firma}}': firma,
      '{{produkt}}': '',
      '{{ansprechpartner_name}}': member?.name || adminProfile?.name || '',
      '{{ansprechpartner_telefon}}': member?.phone || '',
      '{{ansprechpartner_email}}': member?.email || adminProfile?.email || '',
      '{{dealroom_link}}': dealroomLink,
      '{{r}}': anrede === 'Herr' ? 'r' : '',
    };
  }, [selectedDealroom, adminProfile]);

  // Live preview text
  const previewSubject = useMemo(
    () => emailSubject ? replacePlaceholders(emailSubject, placeholderReplacements) : '',
    [emailSubject, placeholderReplacements]
  );
  const previewBody = useMemo(
    () => emailBody ? replacePlaceholders(emailBody, placeholderReplacements) : '',
    [emailBody, placeholderReplacements]
  );

  // Detect missing variables
  const missingVariables = useMemo(() => {
    const combined = previewSubject + previewBody;
    const remaining = combined.match(/\{\{[a-z_]+\}\}/g) || [];
    return Array.from(new Set(remaining));
  }, [previewSubject, previewBody]);

  const applyTemplate = (tmpl: typeof emailTemplates[0]) => {
    setEmailSubject(tmpl.subject);
    setEmailBody(tmpl.body);
    if (tmpl.body) setShowPreview(true);
  };

  const insertLabel = (label: string) => {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newVal = emailBody.substring(0, start) + label + emailBody.substring(end);
    setEmailBody(newVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + label.length, start + label.length);
    }, 0);
  };

  const handleSendEmail = async () => {
    if (!selectedDealroom?.client_email || !emailSubject.trim() || !emailBody.trim()) {
      toast({ title: 'Fehler', description: 'Bitte füllen Sie alle Felder aus.', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      // Send raw template — server does the placeholder replacement
      const res = await fetch('/api/email-flows/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealroomId: selectedDealroomId,
          recipientEmail: selectedDealroom.client_email,
          subject: emailSubject,
          bodyHtml: emailBody,
        }),
      });

      if (res.ok) {
        toast({ title: 'E-Mail gesendet', description: `An ${selectedDealroom.client_email}` });
        setEmailSubject('');
        setEmailBody('');
        setSelectedDealroomId('');
        setDealroomSearch('');
        setShowPreview(false);
        router.refresh();
      } else {
        const data = await res.json();
        toast({ title: 'Fehler', description: data.error || 'E-Mail konnte nicht gesendet werden.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Fehler', description: 'E-Mail konnte nicht gesendet werden.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (historyFilter === 'flow' && log.source === 'manual') return false;
    if (historyFilter === 'manual' && log.source !== 'manual') return false;
    if (historySearch) {
      const q = historySearch.toLowerCase();
      return log.recipient_email.toLowerCase().includes(q) || log.subject.toLowerCase().includes(q);
    }
    return true;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'automatic', label: 'Automatische E-Mails' },
    { key: 'single', label: 'Einzelne E-Mail' },
    { key: 'history', label: 'Verlauf' },
  ];

  const autoFlows = flows.filter(f => f.trigger_type !== 'manual');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">E-Mails</h1>
        <p className="text-sm text-[#6b7280] mt-1">
          Automatische und manuelle E-Mails an Ihre Kunden.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f0f5f7] rounded-lg p-1 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-[#11485e] shadow-sm'
                : 'text-[#6b7280] hover:text-[#1a1a1a]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Automatic */}
      {activeTab === 'automatic' && (
        <div>
          {flows.length === 0 ? (
            <EmailFlowSeedButton />
          ) : (
            <>
              <div className="flex items-start gap-2 mb-4 p-3 bg-[#f9fafb] rounded-lg border border-[#e5e7eb]">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-[#6b7280]">
                  Diese E-Mails werden automatisch versendet wenn die Bedingung eintritt. Sie können jede E-Mail anpassen oder deaktivieren.
                </p>
              </div>

              <div className="space-y-3">
                {autoFlows.map((flow) => (
                  <Link
                    key={flow.id}
                    href={`/dashboard/email-flows/${flow.id}`}
                    className="block"
                  >
                    <Card className="group border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-150 hover:border-[#cfdde3] hover:shadow-md">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-9 w-9 rounded-lg bg-[#e7eef1] flex items-center justify-center shrink-0">
                              <Mail size={16} className="text-[#11485e]" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2.5">
                                <h3 className="text-[14px] font-semibold text-[#1a1a1a] truncate group-hover:text-[#11485e] transition-colors duration-75">
                                  {flow.name}
                                </h3>
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
                                  flow.is_active
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-[#fafafa] text-[#6b7280] border-[#e5e7eb]'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${flow.is_active ? 'bg-emerald-500' : 'bg-[#6b7280]'}`} />
                                  {flow.is_active ? 'Aktiv' : 'Inaktiv'}
                                </span>
                              </div>
                              <p className="text-[12px] text-[#6b7280] mt-0.5 truncate">
                                {flow.trigger_days} Tage &ndash; {triggerLabels[flow.trigger_type] || flow.trigger_type}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#9ca3af] shrink-0 ml-4">
                            <Clock size={13} strokeWidth={1.75} />
                            <span>{formatRelativeTime(lastExecutions[flow.id] || null)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              <Link href="/dashboard/email-flows/new" className="block mt-4">
                <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-[#e5e7eb] text-sm text-[#6b7280] hover:border-[#11485e] hover:text-[#11485e] hover:bg-[#11485e]/5 transition-colors">
                  <Plus className="h-4 w-4" />
                  Neue automatische E-Mail erstellen
                </button>
              </Link>
              <p className="text-xs text-[#9ca3af] mt-2 flex items-center gap-1">
                <Lightbulb className="h-3 w-3 text-amber-500" />
                Erstellen Sie eigene Regeln, z.B. &quot;5 Tage nach Veröffentlichung, wenn Video nicht angesehen&quot;
              </p>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Single Email */}
      {activeTab === 'single' && (
        <div className="space-y-5">
          {/* Recipient selection */}
          <div className="space-y-2">
            <Label>An wen?</Label>
            {!selectedDealroomId ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                  <Input
                    value={dealroomSearch}
                    onChange={(e) => setDealroomSearch(e.target.value)}
                    placeholder="Kunden oder Angebotsraum suchen..."
                    className="pl-10"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-[#e5e7eb] rounded-lg divide-y divide-[#e5e7eb]">
                  {filteredDealrooms.length === 0 ? (
                    <p className="text-sm text-[#6b7280] py-4 text-center">Keine Angebotsräume gefunden</p>
                  ) : (
                    filteredDealrooms.map(d => (
                      <button
                        key={d.id}
                        onClick={() => { setSelectedDealroomId(d.id); setDealroomSearch(''); }}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#f9fafb] transition-colors text-left"
                      >
                        <div>
                          <p className="text-sm font-medium text-[#1a1a1a]">{d.client_name}</p>
                          <p className="text-xs text-[#6b7280]">{d.client_company}</p>
                        </div>
                        {d.client_email ? (
                          <span className="text-xs text-[#9ca3af]">{d.client_email}</span>
                        ) : (
                          <span className="text-xs text-red-400">Keine E-Mail</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-[#f0f5f7] rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#1a1a1a]">{selectedDealroom?.client_name}</p>
                  <p className="text-xs text-[#6b7280]">{selectedDealroom?.client_email || 'Keine E-Mail hinterlegt'}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDealroomId('')} className="text-xs">
                  Ändern
                </Button>
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Betreff</Label>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Betreff eingeben..."
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label>Nachricht</Label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {personalizationLabels.map(p => (
                <button
                  key={p.label}
                  onClick={() => insertLabel(p.label)}
                  className="text-[11px] px-2 py-1 rounded border border-[#e5e7eb] text-[#11485e] hover:bg-[#11485e]/5 transition-colors"
                  title={p.desc}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Textarea
              ref={bodyRef}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Ihre Nachricht..."
              rows={10}
              className="resize-none"
            />
          </div>

          {/* Templates */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              Vorlagen
            </Label>
            <div className="flex gap-2 flex-wrap">
              {emailTemplates.map(tmpl => (
                <button
                  key={tmpl.name}
                  onClick={() => applyTemplate(tmpl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    emailSubject === tmpl.subject && emailBody === tmpl.body
                      ? 'border-[#11485e] bg-[#11485e]/5 text-[#11485e]'
                      : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#11485e] hover:text-[#11485e]'
                  }`}
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Toggle */}
          {selectedDealroom && emailBody.trim() && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 text-sm text-[#11485e] hover:text-[#0d3648] transition-colors font-medium"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
            </button>
          )}

          {/* Preview Section */}
          {showPreview && selectedDealroom && emailBody.trim() && (
            <div className="space-y-3">
              <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
                <div className="bg-[#f9fafb] px-4 py-2.5 border-b border-[#e5e7eb]">
                  <p className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wider">
                    Vorschau
                  </p>
                </div>
                <div className="p-5 bg-white">
                  {/* Preview Subject */}
                  <div className="mb-4 pb-4 border-b border-[#f0f0f0]">
                    <p className="text-[11px] text-[#9ca3af] mb-0.5">Betreff:</p>
                    <p className="text-sm font-semibold text-[#1a1a1a]">
                      {previewSubject || '(Kein Betreff)'}
                    </p>
                  </div>

                  {/* Preview Body */}
                  <div className="text-sm text-[#374151] leading-relaxed whitespace-pre-line">
                    {previewBody}
                  </div>

                  {/* CTA Button Preview */}
                  {previewBody.includes(`/d/${selectedDealroom.slug}`) && (
                    <div className="mt-5 text-center">
                      <span className="inline-block px-6 py-3 bg-[#11485e] text-white rounded-xl text-sm font-semibold">
                        Jetzt Angebot ansehen
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Missing Variables Warning */}
              {missingVariables.length > 0 ? (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Nicht alle Variablen konnten ausgefüllt werden:
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {missingVariables.map(v => (
                        <li key={v} className="text-xs text-amber-700">
                          {v} &mdash; Bitte manuell ersetzen oder Kundendaten ergänzen
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-emerald-600 flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  Alle Variablen wurden ausgefüllt.
                </p>
              )}
            </div>
          )}

          {/* Send button */}
          <Button
            onClick={handleSendEmail}
            disabled={sending || !selectedDealroom?.client_email || !emailSubject.trim() || !emailBody.trim()}
            className="w-full"
            size="lg"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                E-Mail wird gesendet...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                E-Mail senden
              </>
            )}
          </Button>
        </div>
      )}

      {/* Tab 3: History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
              <Input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Suchen..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-1">
              {([['all', 'Alle'], ['flow', 'Automatisch'], ['manual', 'Manuell']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setHistoryFilter(val)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    historyFilter === val
                      ? 'bg-[#11485e] text-white'
                      : 'bg-[#f0f5f7] text-[#6b7280] hover:text-[#1a1a1a]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Log entries */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16">
              <Mail className="h-10 w-10 text-[#d1d5db] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#1a1a1a]">Noch keine E-Mails gesendet</p>
              <p className="text-xs text-[#9ca3af] mt-1">Hier erscheinen alle gesendeten E-Mails.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const flow = flows.find(f => f.id === log.flow_id);
                const isManual = log.source === 'manual';

                return (
                  <Card key={log.id} className="border border-[#e5e7eb]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className="h-3.5 w-3.5 text-[#6b7280] shrink-0" />
                            <span className="text-sm font-medium text-[#1a1a1a] truncate">
                              {log.recipient_email}
                            </span>
                          </div>
                          <p className="text-xs text-[#6b7280] truncate mb-1.5">
                            &quot;{log.subject}&quot;
                          </p>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className={`px-1.5 py-0.5 rounded font-medium ${
                              isManual ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                            }`}>
                              {isManual ? 'Manuell' : 'Automatisch'}
                            </span>
                            {flow && (
                              <span className="text-[#9ca3af]">Flow: {flow.name}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] text-[#9ca3af] mb-1">
                            {formatDateTime(log.sent_at)}
                          </p>
                          <div className="flex items-center gap-1.5 justify-end">
                            {log.status === 'sent' && (
                              <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                                <CheckCircle2 className="h-3 w-3" /> Gesendet
                              </span>
                            )}
                            {log.status === 'failed' && (
                              <span className="flex items-center gap-1 text-[11px] text-red-500">
                                <XCircle className="h-3 w-3" /> Fehlgeschlagen
                              </span>
                            )}
                            {log.status === 'skipped' && (
                              <span className="flex items-center gap-1 text-[11px] text-amber-600">
                                <SkipForward className="h-3 w-3" /> Übersprungen
                              </span>
                            )}
                            {log.opened_at && (
                              <span className="flex items-center gap-1 text-[11px] text-blue-500">
                                <MailOpen className="h-3 w-3" /> Geöffnet
                              </span>
                            )}
                            {log.clicked_at && (
                              <span className="flex items-center gap-1 text-[11px] text-[#11485e]">
                                <MousePointerClick className="h-3 w-3" /> Geklickt
                              </span>
                            )}
                          </div>
                          {log.skip_reason && (
                            <p className="text-[10px] text-[#9ca3af] mt-0.5">({log.skip_reason})</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
