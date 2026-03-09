'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmailFlow, EmailFlowLog } from '@/types/database';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  XCircle,
  SkipForward,
  AlertCircle,
  Search,
} from 'lucide-react';

const triggerOptions = [
  { value: 'manual', label: 'Manuell (per Button)' },
  { value: 'not_opened', label: 'nicht geöffnet hat' },
  { value: 'opened_not_offer', label: 'geöffnet, aber Angebot nicht angesehen hat' },
  { value: 'offer_not_signed', label: 'Angebot angesehen, aber nicht unterschrieben hat' },
  { value: 'inactive', label: 'seit X Tagen keine Aktivität zeigt' },
];

const personalizationLabels = [
  { label: '{{anrede}}', desc: 'Herr/Frau' },
  { label: '{{vorname}}', desc: 'Vorname' },
  { label: '{{nachname}}', desc: 'Nachname' },
  { label: '{{firma}}', desc: 'Firmenname' },
  { label: '{{produkt}}', desc: 'Produkt' },
  { label: '{{ansprechpartner_name}}', desc: 'Berater Name' },
  { label: '{{ansprechpartner_telefon}}', desc: 'Berater Telefon' },
  { label: '{{ansprechpartner_email}}', desc: 'Berater E-Mail' },
  { label: '{{dealroom_link}}', desc: 'Dealroom-Link' },
];

const logStatusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  sent: { icon: CheckCircle2, color: 'text-emerald-600', label: 'Gesendet' },
  delivered: { icon: CheckCircle2, color: 'text-emerald-600', label: 'Zugestellt' },
  opened: { icon: CheckCircle2, color: 'text-blue-600', label: 'Geöffnet' },
  clicked: { icon: CheckCircle2, color: 'text-indigo-600', label: 'Geklickt' },
  failed: { icon: XCircle, color: 'text-red-600', label: 'Fehlgeschl.' },
  skipped: { icon: SkipForward, color: 'text-amber-600', label: 'Übersprungen' },
};

export default function FlowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flow, setFlow] = useState<EmailFlow | null>(null);
  const [logs, setLogs] = useState<EmailFlowLog[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'logs'>('editor');

  // Form state
  const [triggerType, setTriggerType] = useState('not_opened');
  const [triggerDays, setTriggerDays] = useState(3);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [maxSends, setMaxSends] = useState(1);
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [skipIfSigned, setSkipIfSigned] = useState(true);
  const [skipIfInactive, setSkipIfInactive] = useState(true);

  // Audience filter
  const [appliesTo, setAppliesTo] = useState<'all' | 'selected'>('all');
  const [selectedDealroomIds, setSelectedDealroomIds] = useState<string[]>([]);
  const [dealrooms, setDealrooms] = useState<{ id: string; client_name: string; client_company: string }[]>([]);
  const [dealroomSearch, setDealroomSearch] = useState('');

  const loadFlow = useCallback(async () => {
    const [{ data: flowData }, { data: logData }, { data: drData }, { data: selectedDrData }] = await Promise.all([
      supabase.from('email_flows').select('*').eq('id', params.id).single(),
      supabase
        .from('email_flow_logs')
        .select('*')
        .eq('flow_id', params.id)
        .order('sent_at', { ascending: false })
        .limit(50),
      supabase
        .from('dealrooms')
        .select('id, client_name, client_company')
        .order('client_company', { ascending: true }),
      supabase
        .from('email_flow_dealrooms')
        .select('dealroom_id')
        .eq('flow_id', params.id as string),
    ]);

    if (flowData) {
      const f = flowData as EmailFlow;
      setFlow(f);
      setTriggerType(f.trigger_type);
      setTriggerDays(f.trigger_days);
      setSubject(f.subject_template);
      setBody(f.body_template);
      setIsActive(f.is_active);
      setMaxSends(f.max_sends);
      setSkipWeekends(f.skip_weekends);
      setSkipIfSigned(f.skip_if_signed);
      setSkipIfInactive(f.skip_if_inactive);
      setAppliesTo((f as EmailFlow & { applies_to?: string }).applies_to === 'selected' ? 'selected' : 'all');
    }
    setDealrooms(drData || []);
    setSelectedDealroomIds((selectedDrData || []).map((r: { dealroom_id: string }) => r.dealroom_id));
    setLogs((logData as EmailFlowLog[]) || []);
    setLoading(false);
  }, [supabase, params.id]);

  useEffect(() => {
    loadFlow();
  }, [loadFlow]);

  const insertPersonalization = (label: string) => {
    const textarea = bodyRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody = body.slice(0, start) + label + body.slice(end);
    setBody(newBody);

    // Restore cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + label.length;
    }, 0);
  };

  const handleSave = async () => {
    if (!flow) return;
    setSaving(true);

    try {
      const res = await fetch('/api/email-flows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: flow.id,
          trigger_type: triggerType,
          trigger_days: triggerDays,
          subject_template: subject,
          body_template: body,
          is_active: isActive,
          max_sends: maxSends,
          skip_weekends: skipWeekends,
          skip_if_signed: skipIfSigned,
          skip_if_inactive: skipIfInactive,
          applies_to: appliesTo,
          selected_dealroom_ids: appliesTo === 'selected' ? selectedDealroomIds : [],
        }),
      });

      if (!res.ok) throw new Error('Save failed');
      toast.success('Flow gespeichert');
    } catch {
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-10 w-10 text-[#d1d5db] mx-auto mb-3" />
        <p className="text-[#6b7280] font-medium">Flow nicht gefunden</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.push('/dashboard/email-flows')}
        className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#1a1a1a] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu E-Mail Flows
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">{flow.name}</h1>
          <p className="text-sm text-[#6b7280] mt-1">{flow.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-[#fafafa] text-[#6b7280] border-[#e5e7eb]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-[#6b7280]'}`} />
            {isActive ? 'Aktiv' : 'Inaktiv'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#e5e7eb]">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2 text-[13px] font-semibold border-b-2 transition-colors ${
            activeTab === 'editor'
              ? 'border-[#E97E1C] text-[#E97E1C]'
              : 'border-transparent text-[#6b7280] hover:text-[#1a1a1a]'
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-[13px] font-semibold border-b-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-[#E97E1C] text-[#E97E1C]'
              : 'border-transparent text-[#6b7280] hover:text-[#1a1a1a]'
          }`}
        >
          Verlauf ({logs.length})
        </button>
      </div>

      {activeTab === 'editor' ? (
        <div className="space-y-6">
          {/* 1. TRIGGER */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide mb-4">
                1. Wann (Trigger)
              </h2>
              <p className="text-sm text-[#6b7280] mb-3">Diese E-Mail wird gesendet wenn:</p>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-[#6b7280]">Ein Kunde den Dealroom</Label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                    className="mt-1 w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#E97E1C]/20 focus:border-[#E97E1C]"
                  >
                    {triggerOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {triggerType !== 'manual' && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-[#6b7280]">nach</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={triggerDays}
                      onChange={(e) => setTriggerDays(parseInt(e.target.value) || 3)}
                      className="w-20 h-9"
                    />
                    <span className="text-sm text-[#6b7280]">Tagen</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2. AUDIENCE */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide mb-4">
                2. An wen (Empfänger)
              </h2>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="appliesTo"
                    checked={appliesTo === 'all'}
                    onChange={() => setAppliesTo('all')}
                    className="text-[#E97E1C] focus:ring-[#E97E1C]"
                  />
                  <span className="text-sm text-[#374151]">An alle Kunden mit dieser Bedingung</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="appliesTo"
                    checked={appliesTo === 'selected'}
                    onChange={() => setAppliesTo('selected')}
                    className="text-[#E97E1C] focus:ring-[#E97E1C]"
                  />
                  <span className="text-sm text-[#374151]">Nur an bestimmte Angebotsräume</span>
                </label>

                {appliesTo === 'selected' && (
                  <div className="ml-6 mt-2 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9ca3af]" />
                      <Input
                        value={dealroomSearch}
                        onChange={(e) => setDealroomSearch(e.target.value)}
                        placeholder="Angebotsraum suchen..."
                        className="pl-8 h-9 text-sm"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-[#e5e7eb] rounded-md divide-y divide-[#f3f4f6]">
                      {dealrooms
                        .filter(dr => {
                          if (!dealroomSearch) return true;
                          const q = dealroomSearch.toLowerCase();
                          return dr.client_company?.toLowerCase().includes(q) || dr.client_name?.toLowerCase().includes(q);
                        })
                        .map(dr => (
                          <label key={dr.id} className="flex items-center gap-3 px-3 py-2 hover:bg-[#fafafa] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedDealroomIds.includes(dr.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDealroomIds(prev => [...prev, dr.id]);
                                } else {
                                  setSelectedDealroomIds(prev => prev.filter(id => id !== dr.id));
                                }
                              }}
                              className="rounded border-[#d1d5db] text-[#E97E1C] focus:ring-[#E97E1C]"
                            />
                            <div className="min-w-0">
                              <p className="text-sm text-[#1a1a1a] truncate">{dr.client_company}</p>
                              <p className="text-xs text-[#9ca3af] truncate">{dr.client_name}</p>
                            </div>
                          </label>
                        ))}
                      {dealrooms.length === 0 && (
                        <p className="text-xs text-[#9ca3af] py-4 text-center">Keine Angebotsräume vorhanden</p>
                      )}
                    </div>
                    {selectedDealroomIds.length > 0 && (
                      <p className="text-xs text-[#6b7280]">{selectedDealroomIds.length} ausgewählt</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 3. CONTENT */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide mb-4">
                3. Was (E-Mail-Inhalt)
              </h2>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-[#6b7280]">Betreff</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1"
                    placeholder="Ihr persönliches Angebot wartet auf Sie, {{anrede}} {{nachname}}"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#6b7280]">Nachricht</Label>
                  <textarea
                    ref={bodyRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={12}
                    className="mt-1 w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#E97E1C]/20 focus:border-[#E97E1C] resize-y"
                    placeholder="Sehr geehrte{{r}} {{anrede}} {{nachname}},&#10;&#10;wir haben Ihnen kürzlich ein persönliches Angebot zusammengestellt..."
                  />
                </div>

                {/* Personalization labels */}
                <div>
                  <p className="text-xs text-[#6b7280] mb-2">Klicke um einzufügen:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {personalizationLabels.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => insertPersonalization(p.label)}
                        className="px-2.5 py-1 rounded-md bg-[#FEF3E2] text-[#E97E1C] text-[11px] font-semibold hover:bg-[#FDE5C8] transition-colors"
                        title={p.desc}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. RULES */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide mb-4">
                4. Regeln
              </h2>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maxSends === 1}
                    onChange={(e) => setMaxSends(e.target.checked ? 1 : 99)}
                    className="rounded border-[#d1d5db] text-[#E97E1C] focus:ring-[#E97E1C]"
                  />
                  <span className="text-sm text-[#374151]">Maximal 1x pro Kunde senden (nicht wiederholen)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipIfSigned}
                    onChange={(e) => setSkipIfSigned(e.target.checked)}
                    className="rounded border-[#d1d5db] text-[#E97E1C] focus:ring-[#E97E1C]"
                  />
                  <span className="text-sm text-[#374151]">Nicht senden wenn Kunde bereits unterschrieben hat</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipIfInactive}
                    onChange={(e) => setSkipIfInactive(e.target.checked)}
                    className="rounded border-[#d1d5db] text-[#E97E1C] focus:ring-[#E97E1C]"
                  />
                  <span className="text-sm text-[#374151]">Nicht senden wenn Dealroom inaktiv/archiviert ist</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!skipWeekends}
                    onChange={(e) => setSkipWeekends(!e.target.checked)}
                    className="rounded border-[#d1d5db] text-[#E97E1C] focus:ring-[#E97E1C]"
                  />
                  <span className="text-sm text-[#374151]">Auch am Wochenende senden</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </div>
      ) : (
        /* LOGS TAB */
        <Card>
          <CardContent className="p-6">
            {logs.length === 0 ? (
              <p className="text-sm text-[#6b7280] py-8 text-center">Noch keine E-Mails gesendet</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => {
                  const cfg = logStatusConfig[log.status] || logStatusConfig.sent;
                  const Icon = cfg.icon;
                  const date = new Date(log.sent_at);
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 py-2 border-b border-[#f3f4f6] last:border-0"
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                      <span className="text-xs text-[#6b7280] shrink-0 tabular-nums">
                        {date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}.{' '}
                        {date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-sm text-[#374151] truncate flex-1">{log.recipient_email}</span>
                      <span className={`text-[11px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                      {log.skip_reason && (
                        <span className="text-[10px] text-[#9ca3af]">({log.skip_reason})</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
