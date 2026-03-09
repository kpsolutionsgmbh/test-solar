'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Reference } from '@/types/database';
import { Plus, Pencil, Trash2, Star, GripVertical, Upload, Image, Video, Play } from 'lucide-react';
import { uploadFile } from '@/lib/upload';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type MediaType = 'none' | 'image' | 'video';

function getVideoThumbnail(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://cdn.loom.com/sessions/thumbnails/${loomMatch[1]}-with-play.gif`;
  return null;
}

function SortableReferenceItem({
  reference,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  reference: Reference;
  onEdit: (ref: Reference) => void;
  onDelete: (id: string) => void;
  onToggleActive: (ref: Reference) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: reference.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`transition-opacity ${!reference.is_active ? 'opacity-50' : ''} ${isDragging ? 'shadow-lg ring-2 ring-[#11485e]/20' : ''}`}>
        <CardContent className="flex items-center justify-between py-4 px-5">
          <div className="flex items-center gap-4 min-w-0">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-[#d1d5db] hover:text-[#11485e] shrink-0 touch-none"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            {reference.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={reference.image_url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
            ) : (
              <div className="h-10 w-10 rounded bg-[#11485e]/8 flex items-center justify-center text-[#11485e] font-semibold text-sm shrink-0">
                {reference.client_company.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-[#1a1a1a]">{reference.client_company}</h3>
                {reference.result_summary && (
                  <Badge variant="outline" className="text-[10px]">{reference.result_summary}</Badge>
                )}
                {reference.video_url && (
                  <Video className="h-3.5 w-3.5 text-[#6b7280]" />
                )}
              </div>
              <p className="text-sm text-[#6b7280] truncate">
                {reference.client_name}
                {reference.quote && ` - "${reference.quote.substring(0, 60)}..."`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={reference.is_active}
              onCheckedChange={() => onToggleActive(reference)}
            />
            <Button variant="ghost" size="sm" onClick={() => onEdit(reference)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(reference.id)} className="text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReferencesPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRef, setEditingRef] = useState<Reference | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [quote, setQuote] = useState('');
  const [resultSummary, setResultSummary] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('none');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchRefs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('references')
      .select('*')
      .order('sort_order');
    setReferences((data as Reference[]) || []);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchRefs(); }, []);

  const resetForm = () => {
    setClientName('');
    setClientCompany('');
    setQuote('');
    setResultSummary('');
    setVideoUrl('');
    setImageUrl('');
    setMediaType('none');
    setEditingRef(null);
  };

  const openEdit = (ref: Reference) => {
    setEditingRef(ref);
    setClientName(ref.client_name);
    setClientCompany(ref.client_company);
    setQuote(ref.quote || '');
    setResultSummary(ref.result_summary || '');
    setVideoUrl(ref.video_url || '');
    setImageUrl(ref.image_url || '');
    setMediaType(ref.video_url ? 'video' : ref.image_url ? 'image' : 'none');
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file, 'references');
    if (!url) {
      toast({ title: 'Fehler', description: 'Upload fehlgeschlagen.', variant: 'destructive' });
      return;
    }

    setImageUrl(url);
    toast({ title: 'Bild hochgeladen' });
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      client_name: clientName,
      client_company: clientCompany,
      quote: quote || null,
      result_summary: resultSummary || null,
      video_url: mediaType === 'video' ? (videoUrl || null) : null,
      image_url: mediaType === 'image' ? (imageUrl || null) : null,
    };

    if (editingRef) {
      await supabase.from('references').update(payload).eq('id', editingRef.id);
      toast({ title: 'Referenz aktualisiert' });
    } else {
      await supabase.from('references').insert({
        ...payload,
        admin_id: user.id,
        sort_order: references.length,
      });
      toast({ title: 'Referenz erstellt' });
    }
    resetForm();
    setDialogOpen(false);
    fetchRefs();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('references').delete().eq('id', id);
    toast({ title: 'Referenz gelöscht' });
    fetchRefs();
  };

  const toggleActive = async (ref: Reference) => {
    await supabase.from('references').update({ is_active: !ref.is_active }).eq('id', ref.id);
    fetchRefs();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = references.findIndex((r) => r.id === active.id);
    const newIndex = references.findIndex((r) => r.id === over.id);
    const newOrder = arrayMove(references, oldIndex, newIndex);
    setReferences(newOrder);

    // Batch update sort_order in Supabase
    await Promise.all(
      newOrder.map((ref, index) =>
        supabase.from('references').update({ sort_order: index }).eq('id', ref.id)
      )
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">Kundenstimmen</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Referenzen die in Ihren Angebotsräumen angezeigt werden.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neue Referenz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRef ? 'Referenz bearbeiten' : 'Neue Referenz'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              {/* Left: Text fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Kundenname *</Label>
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Max Mustermann" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Firma *</Label>
                    <Input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} placeholder="Musterfirma GmbH" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Zitat / Testimonial</Label>
                  <Textarea value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Die Zusammenarbeit war..." rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label>Ergebnis-Zusammenfassung</Label>
                  <Input value={resultSummary} onChange={(e) => setResultSummary(e.target.value)} placeholder="z.B. 40% Ersparnis" />
                </div>
              </div>

              {/* Right: Media uploads */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Medientyp</Label>
                  <div className="flex gap-2">
                    {([['none', 'Keins'], ['image', 'Bild'], ['video', 'Video']] as const).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMediaType(val as MediaType)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          mediaType === val
                            ? 'border-[#11485e] bg-[#11485e]/5 text-[#11485e]'
                            : 'border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]'
                        }`}
                      >
                        {val === 'image' && <Image className="h-3.5 w-3.5 inline mr-1.5" />}
                        {val === 'video' && <Video className="h-3.5 w-3.5 inline mr-1.5" />}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {mediaType === 'image' && (
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Image className="h-3.5 w-3.5" />
                      Bild
                    </Label>
                    <div className="flex items-center gap-3">
                      {imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="" className="h-12 w-12 rounded object-cover" />
                      )}
                      <label className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="h-3.5 w-3.5 mr-1" />
                            {imageUrl ? 'Bild ändern' : 'Bild hochladen'}
                          </span>
                        </Button>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      {imageUrl && (
                        <Button variant="ghost" size="sm" onClick={() => setImageUrl('')} className="text-destructive text-xs">
                          Entfernen
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {mediaType === 'video' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5" />
                        Video-URL (YouTube / Loom)
                      </Label>
                      <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=... oder https://loom.com/share/..." />
                    </div>
                    {videoUrl && getVideoThumbnail(videoUrl) && (
                      <div className="relative rounded-lg overflow-hidden border border-[#e5e7eb]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getVideoThumbnail(videoUrl)!} alt="Thumbnail" className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="h-5 w-5 text-[#1a1a1a] ml-0.5" />
                          </div>
                        </div>
                        <p className="text-[10px] text-[#9ca3af] px-2 py-1">Automatisches Thumbnail</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-[#e5e7eb] mt-4">
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={!clientName || !clientCompany}>
                {editingRef ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="py-6"><div className="h-4 bg-muted rounded w-1/3" /></CardContent></Card>
          ))}
        </div>
      ) : references.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Star className="h-12 w-12 text-[#d1d5db] mb-4" />
            <p className="text-[#6b7280] mb-1 font-medium">Noch keine Referenzen vorhanden</p>
            <p className="text-sm text-[#9ca3af] mb-4">Fügen Sie Kundenreferenzen hinzu</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Erste Referenz erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={references.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {references.map((ref) => (
                <SortableReferenceItem
                  key={ref.id}
                  reference={ref}
                  onEdit={openEdit}
                  onDelete={(id) => setDeleteConfirmId(id)}
                  onToggleActive={toggleActive}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) handleDelete(deleteConfirmId);
        }}
        title="Referenz löschen?"
        description="Diese Referenz wird unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Löschen"
        variant="destructive"
      />
    </div>
  );
}
