'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
import { useToast } from '@/hooks/use-toast';
import { FileStack, Plus, Pencil, Trash2, BarChart3, Globe, Loader2 } from 'lucide-react';

interface Template {
  id: string;
  admin_id: string;
  name: string;
  description: string | null;
  product_type: string | null;
  language: string;
  is_active: boolean;
  usage_count: number;
  content: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

const PRODUCT_TYPES = [
  'BAV',
  'bKV',
  'Gewerbeversicherung',
  'Betriebshaftpflicht',
  'Sachversicherung',
  'Sonstige',
];

export default function TemplatesPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formProductType, setFormProductType] = useState('');
  const [formLanguage, setFormLanguage] = useState('Deutsch');
  const [formIsActive, setFormIsActive] = useState(true);

  // Delete
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Fehler', description: 'Templates konnten nicht geladen werden.', variant: 'destructive' });
    } else {
      setTemplates((data as Template[]) || []);
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchTemplates(); }, []);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormProductType('');
    setFormLanguage('Deutsch');
    setFormIsActive(true);
    setEditingTemplate(null);
  };

  const openEditDialog = (t: Template) => {
    setEditingTemplate(t);
    setFormName(t.name);
    setFormDescription(t.description || '');
    setFormProductType(t.product_type || '');
    setFormLanguage(t.language || 'Deutsch');
    setFormIsActive(t.is_active);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({ title: 'Fehler', description: 'Name ist erforderlich.', variant: 'destructive' });
      return;
    }

    setSaving(true);

    if (editingTemplate) {
      const { error } = await supabase
        .from('templates')
        .update({
          name: formName.trim(),
          description: formDescription.trim() || null,
          product_type: formProductType || null,
          language: formLanguage,
          is_active: formIsActive,
        })
        .eq('id', editingTemplate.id);

      if (error) {
        toast({ title: 'Fehler', description: 'Template konnte nicht aktualisiert werden.', variant: 'destructive' });
      } else {
        toast({ title: 'Template aktualisiert' });
      }
    }

    setSaving(false);
    resetForm();
    setDialogOpen(false);
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('templates').delete().eq('id', id);
    if (error) {
      toast({ title: 'Fehler', description: 'Template konnte nicht gelöscht werden.', variant: 'destructive' });
    } else {
      toast({ title: 'Template gelöscht' });
    }
    fetchTemplates();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#6b7280]" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">Vorlagen</h1>
          <p className="text-sm text-[#6b7280] mt-1">Vorgefertigte Angebote für wiederkehrende Produkte.</p>
        </div>
        <div title="Templates werden aus bestehenden Dealrooms erstellt">
          <Button size="sm" disabled>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Neues Template
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16">
          <FileStack className="h-12 w-12 text-[#d1d5db] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#1a1a1a]">Noch keine Templates</p>
          <p className="text-xs text-[#9ca3af] mt-1 max-w-sm mx-auto">
            Templates werden aus bestehenden Dealrooms erstellt. Öffnen Sie einen Dealroom und klicken Sie auf &quot;Als Template speichern&quot;.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id} className={`transition-opacity ${!t.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#1a1a1a] truncate">{t.name}</p>
                      {t.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium shrink-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Aktiv
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-[#6b7280] bg-[#f3f4f6] px-2 py-0.5 rounded-full font-medium shrink-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#9ca3af]" />
                          Inaktiv
                        </span>
                      )}
                    </div>
                    {t.description && (
                      <p className="text-xs text-[#6b7280] mt-1 truncate">{t.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#9ca3af]">
                      {t.product_type && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#11485e]/10 text-[#11485e] font-medium">
                          {t.product_type}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {t.usage_count}× verwendet
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {t.language || 'Deutsch'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTemplateId(t.id)} className="text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Template bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="z.B. BAV – Standard"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Beschreibung</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Kurze Beschreibung des Templates"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Produkttyp</Label>
              <Select value={formProductType} onValueChange={setFormProductType}>
                <SelectTrigger>
                  <SelectValue placeholder="Produkttyp auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((pt) => (
                    <SelectItem key={pt} value={pt}>
                      {pt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sprache</Label>
              <Select value={formLanguage} onValueChange={setFormLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Sprache auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Deutsch">Deutsch</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktiv</Label>
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={!formName.trim() || saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Aktualisieren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTemplateId}
        onClose={() => setDeleteTemplateId(null)}
        onConfirm={() => {
          if (deleteTemplateId) handleDelete(deleteTemplateId);
        }}
        title="Template löschen?"
        description="Das Template wird unwiderruflich gelöscht. Bestehende Dealrooms, die aus diesem Template erstellt wurden, sind nicht betroffen."
        confirmText="Löschen"
        variant="destructive"
      />
    </div>
  );
}
