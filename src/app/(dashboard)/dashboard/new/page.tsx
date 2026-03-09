'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { Customer, DealroomContent, TeamMember } from '@/types/database';

interface Template {
  id: string;
  name: string;
  description: string | null;
  product_type: string | null;
  content: DealroomContent;
  video_url: string | null;
  language: string;
  usage_count: number;
}
import { DynamicIcon } from '@/lib/icon-resolver';
import {
  ArrowLeft,
  ArrowRight,
  Mic,
  MicOff,
  Type,
  Loader2,
  Sparkles,
  Send,
  Users,
  Upload,
  ImageIcon,
  FileStack,
  FileUp,
  X,
  File,
  Lightbulb,
  Check,
  Copy,
  PartyPopper,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { uploadFile } from '@/lib/upload';

type Step = 'client' | 'input' | 'finish';

const steps: { key: Step; label: string; description: string }[] = [
  { key: 'client', label: 'Für wen?', description: 'Kundendaten eingeben' },
  { key: 'input', label: 'Was erzählen?', description: 'Situation beschreiben' },
  { key: 'finish', label: 'Fertigstellen', description: 'Prüfen & veröffentlichen' },
];

function HelpText({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-[12px] text-[#6b7280] mt-1">
      <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
      <span>{children}</span>
    </p>
  );
}

export default function NewDealroomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { toast } = useToast();
  const audioRecorder = useAudioRecorder();

  const [currentStep, setCurrentStep] = useState<Step>('client');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [inputMethod, setInputMethod] = useState<'text' | 'audio'>('text');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assignedMemberId, setAssignedMemberId] = useState<string>('');

  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Customer selection
  const [customerSource, setCustomerSource] = useState<'new' | 'existing'>('new');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Form state
  const [clientSalutation, setClientSalutation] = useState<'Herr' | 'Frau'>('Herr');
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientPosition, setClientPosition] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientLogoUrl, setClientLogoUrl] = useState('');
  const [customerType, setCustomerType] = useState<'private' | 'commercial'>('private');
  const [language, setLanguage] = useState<'de' | 'en'>('de');
  const [inputText, setInputText] = useState('');
  const [generatedContent, setGeneratedContent] = useState<DealroomContent | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [pandadocUrl, setPandadocUrl] = useState('');
  const [pendingDocuments, setPendingDocuments] = useState<Array<{name: string; file_url: string; file_type: string; file_size: number}>>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Success state
  const [published, setPublished] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Content review expanded
  const [showContentReview, setShowContentReview] = useState(false);
  const [contentTab, setContentTab] = useState<'headline' | 'pains' | 'goal' | 'outcomes' | 'cta'>('headline');

  // Fetch team members and customers on mount
  useEffect(() => {
    const fetchData = async () => {
      const [{ data: members }, { data: custs }, { data: tmpls }] = await Promise.all([
        supabase.from('team_members').select('*').eq('is_active', true).order('name'),
        supabase.from('customers').select('*').order('company'),
        supabase.from('templates').select('*').eq('is_active', true).order('usage_count', { ascending: false }),
      ]);
      setTeamMembers((members as TeamMember[]) || []);
      setCustomers((custs as Customer[]) || []);
      setTemplates((tmpls as Template[]) || []);

      // Pre-select customer from query param
      const preselectedId = searchParams.get('customer_id');
      if (preselectedId && custs) {
        const found = (custs as Customer[]).find(c => c.id === preselectedId);
        if (found) {
          setCustomerSource('existing');
          setSelectedCustomerId(found.id);
          setClientSalutation(found.salutation);
          setClientFirstName(found.first_name);
          setClientLastName(found.last_name);
          setClientName(`${found.first_name} ${found.last_name}`);
          setClientCompany(found.company);
          setClientPosition(found.position || '');
          setClientEmail(found.email || '');
          setClientPhone(found.phone || '');
          setClientAddress(found.address || '');
          setClientLogoUrl(found.logo_url || '');
          if (found.assigned_member_id) {
            setAssignedMemberId(found.assigned_member_id);
          }
        }
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fill inputText from live transcript when recording stops
  useEffect(() => {
    if (!audioRecorder.isRecording && audioRecorder.transcript && inputMethod === 'audio') {
      setInputText(audioRecorder.transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRecorder.isRecording, audioRecorder.transcript]);

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      setClientSalutation(cust.salutation);
      setClientFirstName(cust.first_name);
      setClientLastName(cust.last_name);
      setClientName(`${cust.first_name} ${cust.last_name}`);
      setClientCompany(cust.company);
      setClientPosition(cust.position || '');
      setClientEmail(cust.email || '');
      setClientPhone(cust.phone || '');
      setClientAddress(cust.address || '');
      setClientLogoUrl(cust.logo_url || '');
      if (cust.assigned_member_id) {
        setAssignedMemberId(cust.assigned_member_id);
      }
    }
  };

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);
  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const applyTemplate = (templateId: string) => {
    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return;
    setSelectedTemplateId(templateId);
    setGeneratedContent(tmpl.content);
    if (tmpl.video_url) setVideoUrl(tmpl.video_url);
    if (tmpl.language === 'en') setLanguage('en');
    supabase.rpc('increment_template_usage', { template_id: templateId }).then(() => {});
  };

  const generateContent = async () => {
    if (!inputText.trim()) {
      toast({ title: 'Fehler', description: 'Bitte geben Sie eine Beschreibung ein.', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText,
          clientName,
          clientCompany,
          language,
          customerType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setGeneratedContent(data.content);
      goNext();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast({ title: 'Fehler', description: `Generierung fehlgeschlagen: ${msg}`, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const publishDealroom = async (asDraft = false) => {
    setLoading(true);
    try {
      let customerId: string | null = null;

      if (customerSource === 'existing' && selectedCustomerId) {
        customerId = selectedCustomerId;
      } else if (customerSource === 'new' && clientFirstName && clientLastName) {
        const { data: newCustomer, error: custError } = await supabase
          .from('customers')
          .insert({
            admin_id: null,
            salutation: customerType === 'commercial' ? clientSalutation : 'Herr',
            first_name: clientFirstName,
            last_name: clientLastName,
            company: customerType === 'commercial' ? clientCompany : `${clientFirstName} ${clientLastName}`.trim(),
            position: customerType === 'commercial' ? (clientPosition || null) : null,
            email: clientEmail || null,
            phone: clientPhone || null,
            address: clientAddress || null,
            logo_url: customerType === 'commercial' ? (clientLogoUrl || null) : null,
          })
          .select()
          .single();

        if (custError) {
          console.error('Customer creation error:', custError);
        } else if (newCustomer) {
          customerId = newCustomer.id;
        }
      }

      const slug = nanoid(16);
      const { data: newDealroom, error } = await supabase.from('dealrooms').insert({
        admin_id: null,
        slug,
        status: asDraft ? 'draft' : 'published',
        client_name: clientName,
        client_company: customerType === 'commercial' ? clientCompany : clientName,
        client_position: customerType === 'commercial' ? (clientPosition || null) : null,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        client_address: clientAddress || null,
        client_logo_url: customerType === 'commercial' ? (clientLogoUrl || null) : null,
        customer_id: customerId,
        video_url: videoUrl || null,
        pandadoc_embed_url: pandadocUrl || null,
        ai_input_text: inputText || null,
        generated_content: generatedContent,
        language,
        assigned_member_id: assignedMemberId && assignedMemberId !== 'none' ? assignedMemberId : null,
        customer_type: customerType,
        published_at: asDraft ? null : new Date().toISOString(),
      }).select('id').single();

      if (error) throw error;

      if (pendingDocuments.length > 0 && newDealroom?.id) {
        await supabase.from('dealroom_documents').insert(
          pendingDocuments.map((doc, i) => ({
            dealroom_id: newDealroom.id,
            name: doc.name,
            file_url: doc.file_url,
            file_type: doc.file_type,
            file_size: doc.file_size,
            sort_order: i,
          }))
        );
      }

      const dealroomUrl = `${window.location.origin}/d/${slug}`;

      if (asDraft) {
        toast({ title: 'Entwurf gespeichert', description: 'Der Angebotsraum wurde als Entwurf gespeichert.' });
        router.push('/dashboard');
        router.refresh();
      } else {
        // Show success celebration
        setPublishedUrl(dealroomUrl);
        setPublished(true);
        navigator.clipboard.writeText(dealroomUrl).catch(() => {});
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Success celebration screen
  if (published) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="mb-6">
          <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-2">
            Angebotsraum veröffentlicht!
          </h1>
          <p className="text-[#6b7280] max-w-md">
            Der Angebotsraum für <span className="font-medium text-[#1a1a1a]">{clientName}</span>{clientCompany && clientCompany !== clientName ? ` (${clientCompany})` : ''} ist jetzt live.
          </p>
        </div>

        <div className="bg-[#FFF8F0] rounded-xl p-4 mb-6 max-w-lg w-full">
          <p className="text-xs text-[#6b7280] mb-2">Link zum Angebotsraum:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm text-[#E97E1C] bg-white rounded-lg px-3 py-2 border border-[#e5e7eb] truncate">
              {publishedUrl}
            </code>
            <Button size="sm" variant="outline" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-[#9ca3af] mt-2">Link wurde automatisch in die Zwischenablage kopiert</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { router.push('/dashboard'); router.refresh(); }}>
            Zum Dashboard
          </Button>
          <Button onClick={() => { router.push('/dashboard/new'); router.refresh(); }}>
            Weiteren Angebotsraum erstellen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#1a1a1a] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </button>

      <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-1">
        Neuer Angebotsraum
      </h1>
      <p className="text-sm text-[#6b7280] mb-6">
        In 3 Schritten zum fertigen Angebotsraum
      </p>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  i < currentStepIndex
                    ? 'bg-emerald-500 text-white'
                    : i === currentStepIndex
                    ? 'bg-[#E97E1C] text-white'
                    : 'bg-[#FEF3E2] text-[#6b7280]'
                }`}
              >
                {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div className="hidden sm:block">
                <p className={`text-sm font-medium ${i === currentStepIndex ? 'text-[#1a1a1a]' : 'text-[#6b7280]'}`}>
                  {step.label}
                </p>
              </div>
              {i < steps.length - 1 && <div className="w-8 sm:w-12 h-px bg-[#e5e7eb] mx-1" />}
            </div>
          ))}
        </div>
        <div className="w-full bg-[#FEF3E2] rounded-full h-1.5">
          <div
            className="bg-[#E97E1C] h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-[#9ca3af] mt-1 text-right">{progressPercent}%</p>
      </div>

      {/* Generating overlay */}
      {generating && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-[#E97E1C] animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-1">Angebot wird erstellt...</h2>
            <p className="text-sm text-[#6b7280]">Die KI erstellt den Inhalt für Ihren Angebotsraum. Das dauert ca. 15 Sekunden.</p>
          </div>
        </div>
      )}

      {/* Step 1: Für wen? */}
      {currentStep === 'client' && (
        <Card className="border-[#e5e7eb] shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-1">Für wen ist der Angebotsraum?</h2>
              <HelpText>Geben Sie die Daten Ihres Kunden ein. Diese werden im Angebotsraum angezeigt.</HelpText>
            </div>

            {/* Customer Type Selection */}
            <div className="space-y-2">
              <Label>Kundentyp</Label>
              <div className="flex gap-3">
                {([
                  { value: 'private' as const, label: 'Privatkunde', desc: 'Eigenheim / Haushalt', icon: '🏠' },
                  { value: 'commercial' as const, label: 'Gewerbekunde', desc: 'Unternehmen / Gewerbe', icon: '🏢' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCustomerType(opt.value)}
                    className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      customerType === opt.value
                        ? 'border-[#E97E1C] bg-[#E97E1C]/5'
                        : 'border-[#e5e7eb] hover:border-[#E97E1C]/30'
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${customerType === opt.value ? 'text-[#E97E1C]' : 'text-[#1a1a1a]'}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-[#6b7280]">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {customers.length > 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {([['new', 'Neuer Kunde'], ['existing', 'Bestehender Kunde']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setCustomerSource(val);
                        if (val === 'new') {
                          setSelectedCustomerId('');
                          setClientSalutation('Herr'); setClientFirstName(''); setClientLastName('');
                          setClientName(''); setClientCompany(''); setClientPosition('');
                          setClientEmail(''); setClientPhone(''); setClientAddress('');
                          setClientLogoUrl(''); setAssignedMemberId('');
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        customerSource === val
                          ? 'border-[#E97E1C] bg-[#E97E1C]/5 text-[#E97E1C]'
                          : 'border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {customerSource === 'existing' && (
                  <div>
                    <Select value={selectedCustomerId} onValueChange={handleSelectCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kunde auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.company} – {c.first_name} {c.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <HelpText>Wählen Sie einen bereits angelegten Kunden aus Ihrer Kundenliste.</HelpText>
                  </div>
                )}
              </div>
            )}

            {customerSource === 'new' ? (
              <>
                {customerType === 'commercial' ? (
                  <>
                    <div className="grid grid-cols-[100px_1fr_1fr] gap-4">
                      <div className="space-y-2">
                        <Label>Anrede</Label>
                        <Select value={clientSalutation} onValueChange={(v) => setClientSalutation(v as 'Herr' | 'Frau')}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Herr">Herr</SelectItem>
                            <SelectItem value="Frau">Frau</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Vorname *</Label>
                        <Input
                          value={clientFirstName}
                          onChange={(e) => {
                            setClientFirstName(e.target.value);
                            setClientName(`${e.target.value} ${clientLastName}`.trim());
                          }}
                          placeholder="Max"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nachname *</Label>
                        <Input
                          value={clientLastName}
                          onChange={(e) => {
                            setClientLastName(e.target.value);
                            setClientName(`${clientFirstName} ${e.target.value}`.trim());
                          }}
                          placeholder="Mustermann"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label>Firma *</Label>
                        <Input
                          value={clientCompany}
                          onChange={(e) => setClientCompany(e.target.value)}
                          placeholder="Musterfirma GmbH"
                        />
                        <HelpText>Der Firmenname erscheint im Titel des Angebotsraums.</HelpText>
                      </div>
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Select value={clientPosition || 'Geschäftsführer'} onValueChange={setClientPosition}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Geschäftsführer">Geschäftsführer</SelectItem>
                            <SelectItem value="Angestellter">Angestellter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>E-Mail</Label>
                        <Input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="max@musterfirma.de"
                        />
                        <HelpText>Wird für automatische E-Mail-Benachrichtigungen verwendet.</HelpText>
                      </div>
                      <div className="space-y-2">
                        <Label>Telefon</Label>
                        <Input
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="+49 ..."
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Adresse</Label>
                        <Input
                          value={clientAddress}
                          onChange={(e) => setClientAddress(e.target.value)}
                          placeholder="Straße, PLZ Ort"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Vorname *</Label>
                        <Input
                          value={clientFirstName}
                          onChange={(e) => {
                            setClientFirstName(e.target.value);
                            setClientName(`${e.target.value} ${clientLastName}`.trim());
                          }}
                          placeholder="Max"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nachname *</Label>
                        <Input
                          value={clientLastName}
                          onChange={(e) => {
                            setClientLastName(e.target.value);
                            setClientName(`${clientFirstName} ${e.target.value}`.trim());
                          }}
                          placeholder="Mustermann"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label>E-Mail</Label>
                        <Input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="max@mustermann.de"
                        />
                        <HelpText>Wird für automatische E-Mail-Benachrichtigungen verwendet.</HelpText>
                      </div>
                      <div className="space-y-2">
                        <Label>Telefon</Label>
                        <Input
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="+49 ..."
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Adresse</Label>
                        <Input
                          value={clientAddress}
                          onChange={(e) => setClientAddress(e.target.value)}
                          placeholder="Straße, PLZ Ort"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Max Mustermann"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Firma *</Label>
                  <Input
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="Musterfirma GmbH"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input
                    value={clientPosition}
                    onChange={(e) => setClientPosition(e.target.value)}
                    placeholder="Geschäftsführer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-Mail</Label>
                  <Input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="max@musterfirma.de"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+49 ..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="Straße, PLZ Ort"
                  />
                </div>
              </div>
            )}

            {customerType === 'commercial' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4" />
                  Kundenlogo (optional)
                </Label>
                <div className="flex items-center gap-3">
                  {clientLogoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={clientLogoUrl} alt="Kundenlogo" className="h-10 object-contain rounded" />
                  )}
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        {clientLogoUrl ? 'Ändern' : 'Logo hochladen'}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadFile(file, 'logos');
                        if (url) setClientLogoUrl(url);
                      }}
                      className="hidden"
                    />
                  </label>
                  {clientLogoUrl && (
                    <Button variant="ghost" size="sm" onClick={() => setClientLogoUrl('')} className="text-xs text-red-500">
                      Entfernen
                    </Button>
                  )}
                </div>
                <HelpText>Das Logo wird oben im Angebotsraum neben Ihrem Firmenlogo angezeigt.</HelpText>
              </div>
            )}

            {teamMembers.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  Ansprechpartner zuweisen
                </Label>
                <Select value={assignedMemberId} onValueChange={setAssignedMemberId}>
                  <SelectTrigger className="max-w-sm">
                    <SelectValue placeholder="Ansprechpartner wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Ansprechpartner</SelectItem>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}{m.position ? ` – ${m.position}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <HelpText>Ihr Kunde sieht diesen Ansprechpartner als Kontaktperson im Angebotsraum.</HelpText>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                onClick={goNext}
                disabled={
                  customerSource === 'new'
                    ? !clientFirstName || !clientLastName || (customerType === 'commercial' && !clientCompany)
                    : !clientName || (customerType === 'commercial' && !clientCompany)
                }
              >
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Was erzählen? */}
      {currentStep === 'input' && (
        <Card className="border-[#e5e7eb] shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-1">Was möchten Sie dem Kunden erzählen?</h2>
              <HelpText>Beschreiben Sie die Situation des Kunden. Die KI erstellt daraus einen professionellen Angebotsraum.</HelpText>
            </div>

            {/* Inline language toggle */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-[#6b7280] shrink-0">Sprache:</Label>
              <div className="flex gap-1">
                <button
                  onClick={() => setLanguage('de')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    language === 'de' ? 'bg-[#E97E1C] text-white' : 'bg-[#FFF8F0] text-[#6b7280] hover:text-[#1a1a1a]'
                  }`}
                >
                  Deutsch
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    language === 'en' ? 'bg-[#E97E1C] text-white' : 'bg-[#FFF8F0] text-[#6b7280] hover:text-[#1a1a1a]'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Template Selection */}
            {templates.length > 0 && (
              <div className="space-y-2 pb-4 border-b border-[#e5e7eb]">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <FileStack className="h-4 w-4" />
                  Vorlage verwenden
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {templates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        applyTemplate(tmpl.id);
                        setCurrentStep('finish');
                      }}
                      className={`text-left p-3 rounded-lg border transition-colors hover:border-[#E97E1C] hover:bg-[#E97E1C]/5 ${
                        selectedTemplateId === tmpl.id
                          ? 'border-[#E97E1C] bg-[#E97E1C]/5'
                          : 'border-[#e5e7eb]'
                      }`}
                    >
                      <p className="text-sm font-medium text-[#1a1a1a]">{tmpl.name}</p>
                      {tmpl.description && (
                        <p className="text-xs text-[#6b7280] mt-0.5 line-clamp-1">{tmpl.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        {tmpl.product_type && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E97E1C]/10 text-[#E97E1C] font-medium">{tmpl.product_type}</span>
                        )}
                        <span className="text-[10px] text-[#9ca3af]">{tmpl.usage_count}x verwendet</span>
                      </div>
                    </button>
                  ))}
                </div>
                <HelpText>Vorlagen überspringen die KI-Generierung und verwenden vorbereitete Inhalte.</HelpText>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant={inputMethod === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMethod('text')}
              >
                <Type className="h-4 w-4 mr-1" />
                Text
              </Button>
              <Button
                variant={inputMethod === 'audio' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMethod('audio')}
              >
                <Mic className="h-4 w-4 mr-1" />
                Spracheingabe
              </Button>
            </div>

            {inputMethod === 'text' ? (
              <div className="space-y-2">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Der Kunde ist ein mittelständisches Unternehmen mit 50 Mitarbeitern. Aktuell haben sie keine betriebliche Altersvorsorge..."
                  rows={8}
                  className="resize-none"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {!audioRecorder.isRecording && !audioRecorder.audioUrl ? (
                    <Button onClick={audioRecorder.startRecording} size="lg">
                      <Mic className="h-5 w-5 mr-2" />
                      Aufnahme starten
                    </Button>
                  ) : audioRecorder.isRecording ? (
                    <div className="w-full space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
                          <span className="text-sm font-medium">
                            Aufnahme: {Math.floor(audioRecorder.duration / 60)}:{(audioRecorder.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <Button variant="destructive" onClick={audioRecorder.stopRecording}>
                          <MicOff className="h-4 w-4 mr-2" />
                          Stoppen
                        </Button>
                      </div>
                      {audioRecorder.transcript && (
                        <div className="bg-[#FFF8F0] rounded-lg p-3 text-sm text-[#374151] border border-[#FEF3E2]">
                          <p className="text-xs text-[#6b7280] mb-1 font-medium">Live-Transkription:</p>
                          {audioRecorder.transcript}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 w-full">
                      <audio controls src={audioRecorder.audioUrl || undefined} className="w-full" />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={audioRecorder.resetRecording}>
                          Neue Aufnahme
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Die Transkription wird hier automatisch eingefügt..."
                          rows={6}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Help questions - always visible */}
            <div className="bg-[#f9fafb] rounded-lg p-4 border border-[#e5e7eb]">
              <p className="text-xs font-medium text-[#6b7280] mb-2">Diese Fragen helfen Ihnen:</p>
              <ul className="space-y-1.5 text-xs text-[#6b7280]">
                <li className="flex items-start gap-1.5">
                  <span className="text-[#E97E1C] mt-0.5">•</span>
                  Was ist die aktuelle Situation des Kunden? (Ist-Zustand)
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#E97E1C] mt-0.5">•</span>
                  Welche Probleme oder Risiken hat der Kunde? (Schmerzpunkte)
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#E97E1C] mt-0.5">•</span>
                  Was möchte der Kunde erreichen? (Ziele)
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#E97E1C] mt-0.5">•</span>
                  Welche Lösung bieten Sie an? (Ihr Ansatz)
                </li>
              </ul>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
              <Button onClick={generateContent} disabled={generating || !inputText.trim()}>
                <Sparkles className="h-4 w-4 mr-2" />
                Angebot erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Fertigstellen */}
      {currentStep === 'finish' && (
        <Card className="border-[#e5e7eb] shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-1">Angebotsraum fertigstellen</h2>
              <HelpText>Prüfen Sie den generierten Inhalt und fügen Sie optional ein Video oder Dokument hinzu.</HelpText>
            </div>

            {/* Summary */}
            <div className="bg-[#f9fafb] rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-medium text-[#1a1a1a]">Zusammenfassung</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-[#6b7280]">Kunde:</span>{' '}
                  <span className="font-medium">{clientName}</span>
                </div>
                {customerType === 'commercial' && clientCompany && (
                  <div>
                    <span className="text-[#6b7280]">Firma:</span>{' '}
                    <span className="font-medium">{clientCompany}</span>
                  </div>
                )}
                <div>
                  <span className="text-[#6b7280]">Sprache:</span>{' '}
                  <span className="font-medium">{language === 'de' ? 'Deutsch' : 'English'}</span>
                </div>
                {assignedMemberId && assignedMemberId !== 'none' && (
                  <div>
                    <span className="text-[#6b7280]">Ansprechpartner:</span>{' '}
                    <span className="font-medium">
                      {teamMembers.find(m => m.id === assignedMemberId)?.name || '—'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Content review (tabbed) */}
            {generatedContent && (
              <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowContentReview(!showContentReview)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[#1a1a1a] hover:bg-[#f9fafb] transition-colors"
                >
                  <span>Generierter Inhalt bearbeiten</span>
                  {showContentReview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showContentReview && (
                  <div className="border-t border-[#e5e7eb]">
                    {/* Mini-tabs */}
                    <div className="flex gap-1 px-4 pt-3 pb-0 overflow-x-auto">
                      {([
                        { key: 'headline' as const, label: 'Headline' },
                        { key: 'pains' as const, label: 'Schmerzpunkte' },
                        { key: 'goal' as const, label: 'Ziel & Ansatz' },
                        { key: 'outcomes' as const, label: 'Ergebnisse' },
                        { key: 'cta' as const, label: 'CTA' },
                      ]).map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setContentTab(tab.key)}
                          className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors whitespace-nowrap ${
                            contentTab === tab.key
                              ? 'bg-[#E97E1C] text-white'
                              : 'text-[#6b7280] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    <div className="px-4 pb-4 pt-4 space-y-4">
                      {contentTab === 'headline' && (
                        <>
                          <div className="space-y-1.5">
                            <Label>Hero-Titel</Label>
                            <Input
                              value={generatedContent.hero_title}
                              onChange={(e) => setGeneratedContent({ ...generatedContent, hero_title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Hero-Untertitel</Label>
                            <Input
                              value={generatedContent.hero_subtitle}
                              onChange={(e) => setGeneratedContent({ ...generatedContent, hero_subtitle: e.target.value })}
                            />
                          </div>
                        </>
                      )}

                      {contentTab === 'pains' && (
                        <div className="space-y-2">
                          <Label>Ausgangslage (Schmerzpunkte)</Label>
                          {generatedContent.situation_points.map((point, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="shrink-0 h-8 w-8 rounded-lg bg-[#E97E1C]/10 flex items-center justify-center">
                                <DynamicIcon name={point.icon} className="h-4 w-4 text-[#E97E1C]" />
                              </div>
                              <Input
                                value={point.text}
                                onChange={(e) => {
                                  const updated = [...generatedContent.situation_points];
                                  updated[i] = { ...updated[i], text: e.target.value };
                                  setGeneratedContent({ ...generatedContent, situation_points: updated });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {contentTab === 'goal' && (
                        <>
                          <div className="space-y-1.5">
                            <Label>Ziel</Label>
                            <Input
                              value={generatedContent.goal}
                              onChange={(e) => setGeneratedContent({ ...generatedContent, goal: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Ansatz</Label>
                            <Textarea
                              value={generatedContent.approach}
                              onChange={(e) => setGeneratedContent({ ...generatedContent, approach: e.target.value })}
                              rows={3}
                            />
                          </div>
                        </>
                      )}

                      {contentTab === 'outcomes' && (
                        <div className="space-y-2">
                          <Label>Ergebnis-Vision</Label>
                          {generatedContent.outcome_vision.map((outcome, i) => (
                            <Input
                              key={i}
                              value={typeof outcome === 'string' ? outcome : outcome.text}
                              onChange={(e) => {
                                const updated = [...generatedContent.outcome_vision];
                                updated[i] = e.target.value;
                                setGeneratedContent({ ...generatedContent, outcome_vision: updated });
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {contentTab === 'cta' && (
                        <div className="space-y-1.5">
                          <Label>CTA-Text</Label>
                          <Input
                            value={generatedContent.cta_text}
                            onChange={(e) => setGeneratedContent({ ...generatedContent, cta_text: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Video & PandaDoc (optional extras) */}
            <div className="space-y-4 border-t border-[#e5e7eb] pt-5">
              <h3 className="text-sm font-medium text-[#1a1a1a]">Optionale Extras</h3>

              <div className="space-y-2">
                <Label>Video-URL (Loom oder YouTube)</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.loom.com/share/... oder https://youtube.com/watch?v=..."
                />
                <HelpText>Eine persönliche Videonachricht erhöht die Abschlussquote um bis zu 30%.</HelpText>
              </div>

              <div className="space-y-2">
                <Label>PandaDoc Embed-URL</Label>
                <Input
                  value={pandadocUrl}
                  onChange={(e) => setPandadocUrl(e.target.value)}
                  placeholder="https://app.pandadoc.com/s/..."
                />
                <HelpText>Der Kunde kann das Angebot direkt im Angebotsraum unterschreiben.</HelpText>
              </div>

              {/* Documents Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <FileUp className="h-4 w-4" />
                  Dokumente (optional)
                </Label>
                {uploadingDoc ? (
                  <div className="flex items-center justify-center gap-2 border-2 border-dashed border-[#E97E1C] rounded-lg py-6 bg-[#E97E1C]/5">
                    <Loader2 className="h-5 w-5 text-[#E97E1C] animate-spin" />
                    <span className="text-sm text-[#E97E1C]">Wird hochgeladen...</span>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#e5e7eb] rounded-lg py-6 cursor-pointer hover:border-[#E97E1C] hover:bg-[#E97E1C]/5 transition-colors">
                    <Upload className="h-5 w-5 text-[#6b7280]" />
                    <span className="text-sm text-[#6b7280]">{pendingDocuments.length > 0 ? 'Weitere Dateien hinzufügen' : 'Dateien auswählen'}</span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
                      onChange={async (e) => {
                        if (!e.target.files?.length) return;
                        setUploadingDoc(true);
                        const files = Array.from(e.target.files);
                        for (const file of files) {
                          const fileUrl = await uploadFile(file, 'documents');
                          if (fileUrl) {
                            setPendingDocuments(prev => [...prev, {
                              name: file.name,
                              file_url: fileUrl,
                              file_type: file.type || 'application/octet-stream',
                              file_size: file.size,
                            }]);
                          } else {
                            toast({ title: 'Fehler', description: `"${file.name}" konnte nicht hochgeladen werden.`, variant: 'destructive' });
                          }
                        }
                        setUploadingDoc(false);
                        toast({ title: `${files.length} Dokument${files.length !== 1 ? 'e' : ''} hochgeladen` });
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
                {pendingDocuments.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {pendingDocuments.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#fafafa] rounded-lg px-3 py-2">
                        <File className="h-4 w-4 text-[#6b7280] shrink-0" />
                        <span className="text-sm text-[#1a1a1a] truncate flex-1">{doc.name}</span>
                        <span className="text-xs text-[#9ca3af] shrink-0">{(doc.file_size / 1024).toFixed(0)} KB</span>
                        <button
                          type="button"
                          onClick={() => setPendingDocuments(prev => prev.filter((_, j) => j !== i))}
                          className="text-[#6b7280] hover:text-red-500 shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <HelpText>PDFs, Broschüren oder andere Dateien die Ihr Kunde herunterladen kann.</HelpText>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => publishDealroom(true)}
                  disabled={loading}
                >
                  Als Entwurf speichern
                </Button>
                <Button onClick={() => publishDealroom(false)} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Veröffentlichen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
