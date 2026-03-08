'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Send } from 'lucide-react';

interface EmailSendModalProps {
  open: boolean;
  onClose: () => void;
  dealroomId: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  contactName: string;
}

export function EmailSendModal({
  open,
  onClose,
  dealroomId,
  clientName,
  clientCompany,
  clientEmail,
  contactName,
}: EmailSendModalProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState(clientEmail);
  const [subject, setSubject] = useState(
    `Ihr persönliches Angebot – Gündesli & Kollegen`
  );

  // Generate default body based on client data
  const defaultBody = `Sehr geehrte/r ${clientName},

vielen Dank für unser Gespräch. Wie besprochen habe ich Ihr persönliches Angebot für ${clientCompany} zusammengestellt.

Hier können Sie es direkt einsehen:
[LINK]

Bei Fragen stehe ich Ihnen jederzeit zur Verfügung.

Mit freundlichen Grüßen
${contactName}
Gündesli & Kollegen`;

  const [body, setBody] = useState(defaultBody);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (open) {
      setEmail(clientEmail);
      setSubject(`Ihr persönliches Angebot – Gündesli & Kollegen`);
      setBody(`Sehr geehrte/r ${clientName},

vielen Dank für unser Gespräch. Wie besprochen habe ich Ihr persönliches Angebot für ${clientCompany} zusammengestellt.

Hier können Sie es direkt einsehen:
[LINK]

Bei Fragen stehe ich Ihnen jederzeit zur Verfügung.

Mit freundlichen Grüßen
${contactName}
Gündesli & Kollegen`);
    }
  }, [open, clientEmail, clientName, clientCompany, contactName]);

  const handleSend = async () => {
    if (!email.trim()) {
      toast({ title: 'Fehler', description: 'Bitte E-Mail-Adresse eingeben.', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealroomId,
          recipientEmail: email,
          subject,
          body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast({ title: 'E-Mail gesendet!', description: `An ${email}` });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast({ title: 'Fehler', description: msg, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            E-Mail senden
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs">An</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kunde@firma.de" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Betreff</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nachricht</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="text-sm" />
            <p className="text-[10px] text-[#9ca3af]">[LINK] wird automatisch durch den Dealroom-Link ersetzt.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Abbrechen</Button>
            <Button size="sm" onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
              {sending ? 'Sende...' : 'E-Mail senden'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
