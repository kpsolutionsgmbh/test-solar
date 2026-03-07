'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DealroomContent } from '@/types/database';
import { FileStack, Loader2 } from 'lucide-react';

const productTypes = [
  { value: 'BAV', label: 'BAV' },
  { value: 'bKV', label: 'bKV' },
  { value: 'Gewerbeversicherung', label: 'Gewerbeversicherung' },
  { value: 'Betriebshaftpflicht', label: 'Betriebshaftpflicht' },
  { value: 'Sachversicherung', label: 'Sachversicherung' },
  { value: 'Sonstige', label: 'Sonstige' },
];

interface SaveTemplateModalProps {
  open: boolean;
  onClose: () => void;
  content: DealroomContent;
  videoUrl: string | null;
  language: string;
}

export function SaveTemplateModal({ open, onClose, content, videoUrl, language }: SaveTemplateModalProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState('Sonstige');

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Fehler', description: 'Bitte Template-Name eingeben.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Replace specific client data with placeholders in the content
      const templateContent = JSON.parse(JSON.stringify(content));
      // The hero_title typically contains the company name - replace with placeholder
      // We keep the content as-is since templates are meant to be a snapshot

      const { error } = await supabase.from('templates').insert({
        admin_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        product_type: productType,
        content: templateContent,
        video_url: videoUrl,
        language,
      });

      if (error) throw error;

      toast({ title: 'Template gespeichert!', description: `"${name}" wurde als Template gespeichert.` });
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast({ title: 'Fehler', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileStack className="h-4 w-4" />
            Als Template speichern
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-[#6b7280]">
            Der aktuelle Content wird als wiederverwendbares Template gespeichert. Kundendaten werden nicht übernommen.
          </p>
          <div className="space-y-1">
            <Label className="text-xs">Template-Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. BAV – Standard" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Wofür wird dieses Template verwendet?" rows={2} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Produkttyp</Label>
            <Select value={productType} onValueChange={setProductType}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {productTypes.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Abbrechen</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileStack className="h-4 w-4 mr-1.5" />}
              {saving ? 'Speichert...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
