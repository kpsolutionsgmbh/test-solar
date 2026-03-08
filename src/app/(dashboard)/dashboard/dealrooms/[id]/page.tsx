'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useDebouncedCallback } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dealroom, DealroomContent, TeamMember } from '@/types/database';
import { DynamicIcon } from '@/lib/icon-resolver';
import { uploadFile } from '@/lib/upload';
import { SaveTemplateModal } from '@/components/dashboard/save-template-modal';
import { EmailSendModal } from '@/components/dashboard/email-send-modal';
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Activity,
  Loader2,
  Archive,
  Globe,
  Trash2,
  User2,
  Building2,
  Video,
  Target,
  Lightbulb,
  AlertTriangle,
  Rocket,
  ListChecks,
  MousePointerClick,
  MessageSquareQuote,
  Users,
  Upload,
  ImageIcon,
  Undo2,
  Redo2,
  Check,
  StickyNote,
  FileStack,
  Mail,
  FileUp,
  File,
  X,
  ChevronRight,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  draft: { label: 'Entwurf', color: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-400' },
  published: { label: 'Live', color: 'bg-emerald-100 text-emerald-700', dotColor: 'bg-emerald-400' },
  signed: { label: 'Signiert', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-400' },
  inactive: { label: 'Inaktiv', color: 'bg-orange-100 text-orange-700', dotColor: 'bg-orange-400' },
  archived: { label: 'Archiviert', color: 'bg-gray-100 text-gray-500', dotColor: 'bg-gray-400' },
};

function CollapsibleSection({
  title,
  icon: Icon,
  iconColor = 'text-[#11485e]',
  status,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  status?: 'complete' | 'warning' | 'info';
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#e5e7eb] rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#fafafa] transition-colors gap-4"
      >
        <div className="flex items-center gap-2 shrink-0">
          <ChevronRight
            size={16}
            className={`text-[#6b7280] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
          />
          <Icon size={16} className={`${iconColor} shrink-0`} />
          <span className="text-[14px] font-semibold text-[#1a1a1a] whitespace-nowrap">{title}</span>
          {status && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 whitespace-nowrap ${
              status === 'complete' ? 'bg-emerald-50 text-emerald-700' :
              status === 'warning' ? 'bg-amber-50 text-amber-700' :
              'bg-gray-100 text-[#6b7280]'
            }`}>
              {status === 'complete' ? 'Vollständig' : 'Unvollständig'}
            </span>
          )}
        </div>
        {summary && (
          <span className="text-[11px] text-[#6b7280] truncate hidden sm:block">{summary}</span>
        )}
      </button>
      <div className={`transition-all duration-200 ease-out ${
        isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <div className="px-5 pb-5 pt-2 border-t border-[#e5e7eb]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function EditDealroomPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const { toast } = useToast();

  const [dealroom, setDealroom] = useState<Dealroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<DealroomContent | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Undo/Redo
  type FormSnapshot = { clientName: string; clientCompany: string; clientPosition: string; clientEmail: string; clientPhone: string; videoUrl: string; pandadocUrl: string; clientLogoUrl: string; language: 'de' | 'en'; assignedMemberId: string; content: DealroomContent | null };
  const historyRef = useRef<FormSnapshot[]>([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);
  const initializedRef = useRef(false);

  // Editable fields
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientPosition, setClientPosition] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pandadocUrl, setPandadocUrl] = useState('');
  const [status, setStatus] = useState<Dealroom['status']>('draft');
  const [language, setLanguage] = useState<'de' | 'en'>('de');
  const [assignedMemberId, setAssignedMemberId] = useState('');
  const [clientLogoUrl, setClientLogoUrl] = useState('');

  // Internal Notes
  const [internalNotes, setInternalNotes] = useState<Array<{id: string; text: string; created_at: string; author: string}>>([]);
  const [newNote, setNewNote] = useState('');
  const [adminName, setAdminName] = useState('');

  // Documents
  const [documents, setDocuments] = useState<Array<{id: string; name: string; file_url: string; file_type: string; file_size: number}>>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Modals
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  useEffect(() => {
    const fetchDealroom = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data }, { data: members }, { data: adminUser }, { data: docs }] = await Promise.all([
        supabase.from('dealrooms').select('*').eq('id', params.id).single(),
        supabase.from('team_members').select('*').eq('admin_id', user.id).eq('is_active', true).order('name'),
        supabase.from('admin_users').select('name').eq('id', user.id).single(),
        supabase.from('dealroom_documents').select('*').eq('dealroom_id', params.id).order('sort_order'),
      ]);
      if (docs) setDocuments(docs);
      if (adminUser?.name) setAdminName(adminUser.name);

      if (data) {
        setDealroom(data as Dealroom);
        setClientName(data.client_name);
        setClientCompany(data.client_company);
        setClientPosition(data.client_position || '');
        setClientEmail(data.client_email || '');
        setClientPhone(data.client_phone || '');
        setVideoUrl(data.video_url || '');
        setPandadocUrl(data.pandadoc_embed_url || '');
        setStatus(data.status);
        setLanguage(data.language);
        setAssignedMemberId(data.assigned_member_id || '');
        setClientLogoUrl(data.client_logo_url || '');
        setContent(data.custom_content || data.generated_content);
        setInternalNotes(data.internal_notes || []);
      }
      setTeamMembers((members as TeamMember[]) || []);
      setLoading(false);
    };
    fetchDealroom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Internal Notes functions
  const addNote = async () => {
    if (!newNote.trim() || !dealroom) return;
    const note = {
      id: crypto.randomUUID(),
      text: newNote.trim(),
      created_at: new Date().toISOString(),
      author: adminName,
    };
    const updated = [note, ...internalNotes];
    setInternalNotes(updated);
    setNewNote('');
    await supabase.from('dealrooms').update({ internal_notes: updated }).eq('id', params.id);
  };

  const deleteNote = async (noteId: string) => {
    const updated = internalNotes.filter((n) => n.id !== noteId);
    setInternalNotes(updated);
    await supabase.from('dealrooms').update({ internal_notes: updated }).eq('id', params.id);
  };

  const getSnapshot = useCallback((): FormSnapshot => ({
    clientName, clientCompany, clientPosition, clientEmail, clientPhone,
    videoUrl, pandadocUrl, clientLogoUrl, language, assignedMemberId, content,
  }), [clientName, clientCompany, clientPosition, clientEmail, clientPhone, videoUrl, pandadocUrl, clientLogoUrl, language, assignedMemberId, content]);

  const applySnapshot = useCallback((s: FormSnapshot) => {
    isUndoRedoRef.current = true;
    setClientName(s.clientName);
    setClientCompany(s.clientCompany);
    setClientPosition(s.clientPosition);
    setClientEmail(s.clientEmail);
    setClientPhone(s.clientPhone);
    setVideoUrl(s.videoUrl);
    setPandadocUrl(s.pandadocUrl);
    setClientLogoUrl(s.clientLogoUrl);
    setLanguage(s.language);
    setAssignedMemberId(s.assignedMemberId);
    setContent(s.content);
    setTimeout(() => { isUndoRedoRef.current = false; }, 50);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      applySnapshot(historyRef.current[historyIndexRef.current]);
    }
  }, [applySnapshot]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      applySnapshot(historyRef.current[historyIndexRef.current]);
    }
  }, [applySnapshot]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // Auto-save with debounce
  const debouncedAutoSave = useDebouncedCallback(async () => {
    if (!dealroom) return;
    setAutoSaveStatus('saving');
    const { error } = await supabase
      .from('dealrooms')
      .update({
        client_name: clientName,
        client_company: clientCompany,
        client_position: clientPosition || null,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        client_logo_url: clientLogoUrl || null,
        video_url: videoUrl || null,
        pandadoc_embed_url: pandadocUrl || null,
        status,
        language,
        assigned_member_id: assignedMemberId && assignedMemberId !== 'none' ? assignedMemberId : null,
        custom_content: content,
      })
      .eq('id', params.id);

    if (error) {
      setAutoSaveStatus('error');
    } else {
      setAutoSaveStatus('saved');
      setDealroom(prev => prev ? { ...prev, client_name: clientName, client_company: clientCompany, custom_content: content } : null);
      if (dealroom?.slug) {
        fetch('/api/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: dealroom.slug }) }).catch(() => {});
      }
    }
  }, 1500);

  // Track changes for auto-save and undo/redo history
  useEffect(() => {
    if (loading || !dealroom) return;
    const snap = getSnapshot();

    if (!initializedRef.current) {
      historyRef.current = [snap];
      historyIndexRef.current = 0;
      initializedRef.current = true;
      return;
    }

    if (isUndoRedoRef.current) return;

    // Push to history
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(snap);
    if (newHistory.length > 50) newHistory.shift();
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;

    // Trigger auto-save
    setAutoSaveStatus('idle');
    debouncedAutoSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientName, clientCompany, clientPosition, clientEmail, clientPhone, videoUrl, pandadocUrl, clientLogoUrl, language, assignedMemberId, content]);

  const handleSave = async (statusOverride?: Dealroom['status']) => {
    const saveStatus = statusOverride || status;
    if (statusOverride) setStatus(statusOverride);
    const { error } = await supabase
      .from('dealrooms')
      .update({
        client_name: clientName,
        client_company: clientCompany,
        client_position: clientPosition || null,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        client_logo_url: clientLogoUrl || null,
        video_url: videoUrl || null,
        pandadoc_embed_url: pandadocUrl || null,
        status: saveStatus,
        language,
        assigned_member_id: assignedMemberId && assignedMemberId !== 'none' ? assignedMemberId : null,
        custom_content: content,
        published_at: saveStatus === 'published' && dealroom?.status !== 'published'
          ? new Date().toISOString()
          : dealroom?.published_at,
      })
      .eq('id', params.id);

    if (error) {
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen.', variant: 'destructive' });
    } else {
      // Update local dealroom state to reflect saved changes
      setDealroom(prev => prev ? {
        ...prev,
        client_name: clientName,
        client_company: clientCompany,
        client_position: clientPosition || null,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        client_logo_url: clientLogoUrl || null,
        video_url: videoUrl || null,
        pandadoc_embed_url: pandadocUrl || null,
        status: saveStatus,
        language,
        assigned_member_id: assignedMemberId && assignedMemberId !== 'none' ? assignedMemberId : null,
        custom_content: content,
        published_at: saveStatus === 'published' && prev.status !== 'published'
          ? new Date().toISOString()
          : prev.published_at,
      } : null);
      toast({ title: 'Gespeichert', description: 'Änderungen wurden gespeichert.' });
      // Revalidate the public dealroom page cache
      if (dealroom?.slug) {
        fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: dealroom.slug }),
        }).catch(() => {});
      }
    }
  };

  const copyLink = () => {
    if (dealroom) {
      navigator.clipboard.writeText(`${window.location.origin}/d/${dealroom.slug}`);
      toast({ title: 'Link kopiert' });
    }
  };

  const handleDuplicate = async () => {
    if (!dealroom) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const slug = nanoid(16);
    const { data, error } = await supabase.from('dealrooms').insert({
      admin_id: user.id,
      slug,
      status: 'draft',
      client_name: '',
      client_company: '',
      client_position: null,
      client_email: null,
      client_phone: null,
      client_address: null,
      client_logo_url: null,
      customer_id: null,
      generated_content: dealroom.generated_content,
      custom_content: content,
      video_url: dealroom.video_url,
      pandadoc_embed_url: null,
      language,
      assigned_member_id: assignedMemberId && assignedMemberId !== 'none' ? assignedMemberId : null,
      ai_input_text: dealroom.ai_input_text,
    }).select().single();

    if (error) {
      toast({ title: 'Fehler', description: 'Duplizieren fehlgeschlagen.', variant: 'destructive' });
    } else if (data) {
      toast({ title: 'Dealroom dupliziert!', description: 'Bitte Kundendaten ausfüllen.' });
      router.push(`/dashboard/dealrooms/${data.id}`);
    }
  };

  const handleClientLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file, 'logos');
    if (!url) {
      toast({ title: 'Fehler', description: 'Logo-Upload fehlgeschlagen.', variant: 'destructive' });
      return;
    }

    setClientLogoUrl(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!dealroom) {
    return <p className="text-[#6b7280]">Dealroom nicht gefunden.</p>;
  }

  const config = statusConfig[status];

  return (
    <div>
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#1a1a1a] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zum Dashboard
      </button>

      {/* Header with status badge */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-[#1a1a1a]">
                {clientCompany || dealroom.client_company}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
                {config.label}
              </span>
            </div>
            <p className="text-sm text-[#6b7280] mt-0.5">{clientName || dealroom.client_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Link
          </Button>
          {dealroom.status === 'published' && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/d/${dealroom.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Vorschau
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/dealrooms/${dealroom.id}/activity`}>
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              Aktivitäten
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Duplizieren
          </Button>
          {content && (
            <Button variant="outline" size="sm" onClick={() => setTemplateModalOpen(true)}>
              <FileStack className="h-3.5 w-3.5 mr-1.5" />
              Als Template
            </Button>
          )}
          {clientEmail && (
            <Button variant="outline" size="sm" onClick={() => setEmailModalOpen(true)}>
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              E-Mail
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {/* Client Data */}
          <CollapsibleSection
            title="Kundendaten"
            icon={User2}
            defaultOpen={true}
            status={clientName && clientCompany && clientEmail ? 'complete' : 'warning'}
            summary={clientName ? `${clientName}${clientCompany ? ` · ${clientCompany}` : ''}` : undefined}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Firma</Label>
                <Input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Position</Label>
                <Input value={clientPosition} onChange={(e) => setClientPosition(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">E-Mail</Label>
                <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Telefon</Label>
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Kundenlogo
                </Label>
                <div className="flex items-center gap-3">
                  {clientLogoUrl && (
                    <img src={clientLogoUrl} alt="Kundenlogo" className="h-10 object-contain rounded" />
                  )}
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        {clientLogoUrl ? 'Ändern' : 'Hochladen'}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleClientLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {clientLogoUrl && (
                    <Button variant="ghost" size="sm" onClick={() => setClientLogoUrl('')} className="text-xs text-red-500 hover:text-red-700">
                      Entfernen
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Settings */}
          <CollapsibleSection
            title="Einstellungen"
            icon={Building2}
            status="complete"
            summary={`${statusConfig[status]?.label || status} · ${language === 'de' ? 'DE' : 'EN'}`}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Dealroom['status'])}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Entwurf</SelectItem>
                    <SelectItem value="published">Veröffentlicht</SelectItem>
                    <SelectItem value="signed">Signiert</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                    <SelectItem value="archived">Archiviert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Sprache
                </Label>
                <Select value={language} onValueChange={(v) => setLanguage(v as 'de' | 'en')}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {teamMembers.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Ansprechpartner
                  </Label>
                  <Select value={assignedMemberId || 'none'} onValueChange={setAssignedMemberId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kein Ansprechpartner</SelectItem>
                      {teamMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}{m.position ? ` - ${m.position}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Media & Documents */}
          <CollapsibleSection
            title="Medien & Dokumente"
            icon={Video}
            status={videoUrl || pandadocUrl ? 'complete' : 'warning'}
            summary={[videoUrl ? 'Video' : null, pandadocUrl ? 'PandaDoc' : null, documents.length > 0 ? `${documents.length} Dok.` : null].filter(Boolean).join(' · ') || 'Keine Medien'}
          >
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Video-URL (Loom/YouTube)</Label>
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="h-9" placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">PandaDoc Embed-URL</Label>
                <Input value={pandadocUrl} onChange={(e) => setPandadocUrl(e.target.value)} className="h-9" placeholder="https://..." />
              </div>

              {/* Documents */}
              <div className="space-y-2 border-t border-[#e5e7eb] pt-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1">
                    <FileUp className="h-3 w-3" />
                    Dokumente
                  </Label>
                  <label className={`text-xs text-[#11485e] font-medium flex items-center gap-1 ${uploadingDoc ? 'opacity-50' : 'cursor-pointer hover:underline'}`}>
                    {uploadingDoc ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    {uploadingDoc ? 'Lädt...' : 'Hochladen'}
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
                      disabled={uploadingDoc}
                      onChange={async (e) => {
                        if (!e.target.files?.length) return;
                        setUploadingDoc(true);
                        const files = Array.from(e.target.files);
                        let uploaded = 0;
                        for (const file of files) {
                          const fileUrl = await uploadFile(file, 'documents');
                          if (fileUrl) {
                            const { data: doc } = await supabase.from('dealroom_documents').insert({
                              dealroom_id: params.id,
                              name: file.name,
                              file_url: fileUrl,
                              file_type: file.type || 'application/octet-stream',
                              file_size: file.size,
                              sort_order: documents.length + uploaded,
                            }).select().single();
                            if (doc) { setDocuments(prev => [...prev, doc]); uploaded++; }
                          } else {
                            toast({ title: 'Fehler', description: `"${file.name}" konnte nicht hochgeladen werden.`, variant: 'destructive' });
                          }
                        }
                        setUploadingDoc(false);
                        e.target.value = '';
                        if (uploaded > 0) toast({ title: `${uploaded} Dokument${uploaded !== 1 ? 'e' : ''} hochgeladen` });
                      }}
                    />
                  </label>
                </div>
                {documents.length > 0 && (
                  <div className="space-y-1">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 bg-[#fafafa] rounded-lg px-2.5 py-1.5 group">
                        <File className="h-3.5 w-3.5 text-[#6b7280] shrink-0" />
                        <span className="text-xs text-[#1a1a1a] truncate flex-1">{doc.name}</span>
                        <span className="text-[10px] text-[#9ca3af] shrink-0">{(doc.file_size / 1024).toFixed(0)} KB</span>
                        <button
                          onClick={async () => {
                            await supabase.from('dealroom_documents').delete().eq('id', doc.id);
                            setDocuments(prev => prev.filter(d => d.id !== doc.id));
                          }}
                          className="text-[#9ca3af] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Internal Notes */}
          <CollapsibleSection
            title="Interne Notizen"
            icon={StickyNote}
            summary={internalNotes.length > 0 ? `${internalNotes.length} Notiz${internalNotes.length !== 1 ? 'en' : ''}` : 'Keine Notizen'}
          >
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Notiz schreiben..." className="h-9" />
                <Button size="sm" onClick={addNote} disabled={!newNote.trim()}>Hinzufügen</Button>
              </div>
              {internalNotes.map(note => (
                <div key={note.id} className="bg-[#fafafa] rounded-lg p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[#374151]">{note.text}</p>
                    <button onClick={() => deleteNote(note.id)} className="text-[#9ca3af] hover:text-red-500 shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-[#9ca3af] mt-1">
                    {new Date(note.created_at).toLocaleDateString('de-DE')} {new Date(note.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    {note.author && ` – ${note.author}`}
                  </p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>

        {/* Right column: Content editor as card blocks */}
        <div className="lg:col-span-2 space-y-4">
          {content ? (
            <>
              {/* Hero */}
              <CollapsibleSection
                title="Hero-Bereich"
                icon={Rocket}
                defaultOpen={true}
                status={content.hero_title && content.hero_subtitle ? 'complete' : 'warning'}
                summary={content.hero_title ? content.hero_title.substring(0, 50) : undefined}
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Titel</Label>
                    <Input
                      value={content.hero_title}
                      onChange={(e) => setContent({ ...content, hero_title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Untertitel</Label>
                    <Input
                      value={content.hero_subtitle}
                      onChange={(e) => setContent({ ...content, hero_subtitle: e.target.value })}
                    />
                  </div>
                </div>
              </CollapsibleSection>

              {/* Situation Points */}
              <CollapsibleSection
                title="Ausgangslage / Schmerzpunkte"
                icon={AlertTriangle}
                status={content.situation_points?.length > 0 ? 'complete' : 'warning'}
                summary={`${content.situation_points?.length || 0} Punkte`}
              >
                <div className="space-y-2">
                  {content.situation_points.map((point, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="shrink-0 h-8 w-8 rounded-lg bg-[#11485e]/10 flex items-center justify-center">
                        <DynamicIcon name={point.icon} className="h-4 w-4 text-[#11485e]" />
                      </div>
                      <Input
                        value={point.text}
                        onChange={(e) => {
                          const updated = [...content.situation_points];
                          updated[i] = { ...updated[i], text: e.target.value };
                          setContent({ ...content, situation_points: updated });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Goal + Approach */}
              <CollapsibleSection
                title="Ziel & Ansatz"
                icon={Target}
                status={content.goal && content.approach ? 'complete' : 'warning'}
                summary={content.goal ? content.goal.substring(0, 50) : undefined}
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ziel</Label>
                    <Input
                      value={content.goal}
                      onChange={(e) => setContent({ ...content, goal: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ansatz</Label>
                    <Textarea
                      value={content.approach}
                      onChange={(e) => setContent({ ...content, approach: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </CollapsibleSection>

              {/* Cost of Inaction */}
              <CollapsibleSection
                title="Kosten der Untätigkeit"
                icon={AlertTriangle}
                iconColor="text-red-600"
                status={content.cost_of_inaction?.consequences?.length > 0 ? 'complete' : 'warning'}
                summary={`${content.cost_of_inaction?.consequences?.length || 0} Konsequenzen`}
              >
                <div className="space-y-2">
                  <Input
                    value={content.cost_of_inaction.headline}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        cost_of_inaction: { ...content.cost_of_inaction, headline: e.target.value },
                      })
                    }
                    className="font-medium"
                  />
                  {content.cost_of_inaction.consequences.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="shrink-0 h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                        <DynamicIcon name={c.icon} className="h-4 w-4 text-red-500" />
                      </div>
                      <Input
                        value={c.text}
                        onChange={(e) => {
                          const updated = [...content.cost_of_inaction.consequences];
                          updated[i] = { ...updated[i], text: e.target.value };
                          setContent({
                            ...content,
                            cost_of_inaction: { ...content.cost_of_inaction, consequences: updated },
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Outcome Vision */}
              <CollapsibleSection
                title="Ergebnis-Vision"
                icon={Lightbulb}
                status={content.outcome_vision?.length > 0 ? 'complete' : 'warning'}
                summary={`${content.outcome_vision?.length || 0} Ergebnisse`}
              >
                <div className="space-y-2">
                  {content.outcome_vision.map((outcome, i) => (
                    <Input
                      key={i}
                      value={typeof outcome === 'string' ? outcome : outcome.text}
                      onChange={(e) => {
                        const updated = [...content.outcome_vision];
                        updated[i] = e.target.value;
                        setContent({ ...content, outcome_vision: updated });
                      }}
                    />
                  ))}
                </div>
              </CollapsibleSection>

              {/* Process Steps */}
              <CollapsibleSection
                title="Prozess-Schritte"
                icon={ListChecks}
                status={content.process_steps?.length > 0 ? 'complete' : 'warning'}
                summary={`${content.process_steps?.length || 0} Schritte`}
              >
                <div className="space-y-3">
                  {content.process_steps.map((step, i) => (
                    <div key={i} className="bg-[#f8fafb] border border-[#e7eef1] p-3 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-[#11485e] text-white text-xs flex items-center justify-center font-semibold shrink-0">
                          {step.step}
                        </span>
                        <Input
                          value={step.title}
                          onChange={(e) => {
                            const updated = [...content.process_steps];
                            updated[i] = { ...updated[i], title: e.target.value };
                            setContent({ ...content, process_steps: updated });
                          }}
                          className="font-medium h-8"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-8">
                        <Input
                          value={step.duration}
                          onChange={(e) => {
                            const updated = [...content.process_steps];
                            updated[i] = { ...updated[i], duration: e.target.value };
                            setContent({ ...content, process_steps: updated });
                          }}
                          placeholder="Dauer"
                          className="h-8 text-sm"
                        />
                        <Input
                          value={step.effort}
                          onChange={(e) => {
                            const updated = [...content.process_steps];
                            updated[i] = { ...updated[i], effort: e.target.value };
                            setContent({ ...content, process_steps: updated });
                          }}
                          placeholder="Aufwand"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="pl-8">
                        <Textarea
                          value={step.description}
                          onChange={(e) => {
                            const updated = [...content.process_steps];
                            updated[i] = { ...updated[i], description: e.target.value };
                            setContent({ ...content, process_steps: updated });
                          }}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* CTA */}
              <CollapsibleSection
                title="Call-to-Action"
                icon={MousePointerClick}
                status={content.cta_text ? 'complete' : 'warning'}
                summary={content.cta_text || undefined}
              >
                <div className="space-y-1.5">
                  <Label className="text-xs">CTA-Text</Label>
                  <Input
                    value={content.cta_text}
                    onChange={(e) => setContent({ ...content, cta_text: e.target.value })}
                  />
                </div>
              </CollapsibleSection>
            </>
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <MessageSquareQuote className="h-10 w-10 text-[#6b7280] mb-3" />
                <p className="text-[#6b7280]">Kein Content generiert.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-[#e5e7eb] px-6 py-3 -mx-6 mt-8 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Löschen
        </Button>
        <div className="flex items-center gap-3">
          {/* Auto-save status */}
          <span className="text-xs text-[#6b7280] flex items-center gap-1">
            {autoSaveStatus === 'saving' && <><Loader2 className="h-3 w-3 animate-spin" /> Speichert...</>}
            {autoSaveStatus === 'saved' && <><Check className="h-3 w-3 text-emerald-500" /> Gespeichert</>}
            {autoSaveStatus === 'error' && <><AlertTriangle className="h-3 w-3 text-red-500" /> Fehler</>}
          </span>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={historyIndexRef.current <= 0}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-[#11485e] hover:bg-[#e7eef1] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Rückgängig (Cmd+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={redo}
              disabled={historyIndexRef.current >= historyRef.current.length - 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-[#11485e] hover:bg-[#e7eef1] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Wiederholen (Cmd+Shift+Z)"
            >
              <Redo2 size={16} />
            </button>
          </div>

          <div className="w-px h-6 bg-[#e5e7eb]" />

          <div className="flex gap-2">
            {status === 'draft' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave('published')}
              >
                Veröffentlichen
              </Button>
            )}
            {status === 'published' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave('archived')}
              >
                <Archive className="h-4 w-4 mr-1" />
                Archivieren
              </Button>
            )}
          </div>
        </div>
      </div>
      {content && (
        <SaveTemplateModal
          open={templateModalOpen}
          onClose={() => setTemplateModalOpen(false)}
          content={content}
          videoUrl={videoUrl || null}
          language={language}
        />
      )}

      <EmailSendModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        dealroomId={dealroom.id}
        clientName={clientName}
        clientCompany={clientCompany}
        clientEmail={clientEmail}
        contactName={teamMembers.find(m => m.id === assignedMemberId)?.name || 'Gündesli & Kollegen'}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (dealroom?.slug) {
            await fetch('/api/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: dealroom.slug }) });
          }
          await supabase.from('dealrooms').delete().eq('id', params.id);
          router.push('/dashboard');
          router.refresh();
        }}
        title="Dealroom löschen?"
        description={`Der Dealroom "${clientCompany} - ${clientName}" wird unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmText="Löschen"
        variant="destructive"
      />
    </div>
  );
}
