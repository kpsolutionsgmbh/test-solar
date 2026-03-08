'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2, Lightbulb } from 'lucide-react';

const triggerOptions = [
  { value: 'not_opened', label: 'Angebotsraum nicht geöffnet' },
  { value: 'opened_not_offer', label: 'Geöffnet, aber Angebot nicht angesehen' },
  { value: 'offer_not_signed', label: 'Angebot angesehen, aber nicht unterschrieben' },
  { value: 'inactive', label: 'Keine Aktivität seit X Tagen' },
];

export default function NewEmailFlowPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('not_opened');
  const [triggerDays, setTriggerDays] = useState(3);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSave = async () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast({ title: 'Fehler', description: 'Bitte füllen Sie alle Pflichtfelder aus.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('email_flows')
      .insert({
        admin_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        trigger_type: triggerType,
        trigger_days: triggerDays,
        subject_template: subject,
        body_template: body,
        is_active: false,
      })
      .select('id')
      .single();

    setSaving(false);

    if (error) {
      toast({ title: 'Fehler', description: 'Flow konnte nicht erstellt werden.', variant: 'destructive' });
    } else {
      toast({ title: 'E-Mail Flow erstellt' });
      router.push(`/dashboard/email-flows/${data.id}`);
    }
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#1a1a1a] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </button>

      <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-1">Neue automatische E-Mail</h1>
      <p className="text-sm text-[#6b7280] mb-6">
        Erstellen Sie eine neue Regel für automatische E-Mails.
      </p>

      <Card className="border-[#e5e7eb]">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Erinnerung nach 5 Tagen"
            />
          </div>

          <div className="space-y-2">
            <Label>Beschreibung</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung des Flows"
            />
          </div>

          <div className="space-y-2">
            <Label>Wann soll die E-Mail gesendet werden?</Label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm"
            >
              {triggerOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#6b7280]">Nach</span>
              <Input
                type="number"
                min={1}
                max={30}
                value={triggerDays}
                onChange={(e) => setTriggerDays(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-[#6b7280]">Tagen</span>
            </div>
            <p className="flex items-center gap-1 text-xs text-[#6b7280]">
              <Lightbulb className="h-3 w-3 text-amber-500" />
              Die E-Mail wird gesendet wenn die Bedingung nach der angegebenen Zeit eintritt.
            </p>
          </div>

          <div className="space-y-2 border-t border-[#e5e7eb] pt-5">
            <Label>Betreff *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="z.B. Haben Sie noch Fragen, {{anrede}} {{nachname}}?"
            />
          </div>

          <div className="space-y-2">
            <Label>Nachricht *</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Sehr geehrte{{r}} {{anrede}} {{nachname}},&#10;&#10;..."
              rows={10}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => router.back()}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim() || !subject.trim() || !body.trim()}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Wird erstellt...' : 'Flow erstellen'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
