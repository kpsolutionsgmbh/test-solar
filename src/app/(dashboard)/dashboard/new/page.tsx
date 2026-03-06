'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { DealroomContent, TeamMember } from '@/types/database';
import { DynamicIcon } from '@/lib/icon-resolver';
import {
  ArrowLeft,
  ArrowRight,
  Mic,
  MicOff,
  Type,
  Loader2,
  Sparkles,
  Eye,
  Send,
  Globe,
  Users,
  Upload,
  ImageIcon,
} from 'lucide-react';
import { uploadFile } from '@/lib/upload';

type Step = 'client' | 'language' | 'input' | 'review' | 'media' | 'publish';

const steps: { key: Step; label: string }[] = [
  { key: 'client', label: 'Kundendaten' },
  { key: 'language', label: 'Sprache' },
  { key: 'input', label: 'Beschreibung' },
  { key: 'review', label: 'Content Review' },
  { key: 'media', label: 'Video & Angebot' },
  { key: 'publish', label: 'Veröffentlichen' },
];

export default function NewDealroomPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const audioRecorder = useAudioRecorder();

  const [currentStep, setCurrentStep] = useState<Step>('client');
  const [loading, setLoading] = useState(false);
  const [inputMethod, setInputMethod] = useState<'text' | 'audio'>('text');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assignedMemberId, setAssignedMemberId] = useState<string>('');

  // Form state
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientPosition, setClientPosition] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientLogoUrl, setClientLogoUrl] = useState('');
  const [language, setLanguage] = useState<'de' | 'en'>('de');
  const [inputText, setInputText] = useState('');
  const [generatedContent, setGeneratedContent] = useState<DealroomContent | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [pandadocUrl, setPandadocUrl] = useState('');

  // Fetch team members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('team_members')
        .select('*')
        .eq('admin_id', user.id)
        .eq('is_active', true)
        .order('name');
      setTeamMembers((data as TeamMember[]) || []);
    };
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fill inputText from live transcript when recording stops
  useEffect(() => {
    if (!audioRecorder.isRecording && audioRecorder.transcript && inputMethod === 'audio') {
      setInputText(audioRecorder.transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRecorder.isRecording, audioRecorder.transcript]);

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

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

  const generateContent = async () => {
    if (!inputText.trim()) {
      toast({ title: 'Fehler', description: 'Bitte geben Sie eine Beschreibung ein.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText,
          clientName,
          clientCompany,
          language,
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setGeneratedContent(data.content);
      goNext();
    } catch {
      toast({ title: 'Fehler', description: 'Content-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const publishDealroom = async (asDraft = false) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const slug = nanoid(16);
      const { error } = await supabase.from('dealrooms').insert({
        admin_id: user.id,
        slug,
        status: asDraft ? 'draft' : 'published',
        client_name: clientName,
        client_company: clientCompany,
        client_position: clientPosition || null,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        client_address: clientAddress || null,
        client_logo_url: clientLogoUrl || null,
        video_url: videoUrl || null,
        pandadoc_embed_url: pandadocUrl || null,
        ai_input_text: inputText || null,
        generated_content: generatedContent,
        language,
        assigned_member_id: assignedMemberId && assignedMemberId !== 'none' ? assignedMemberId : null,
        published_at: asDraft ? null : new Date().toISOString(),
      });

      if (error) throw error;

      const dealroomUrl = `${window.location.origin}/d/${slug}`;

      if (!asDraft) {
        // Auto-copy link to clipboard
        navigator.clipboard.writeText(dealroomUrl).catch(() => {});
      }

      toast({
        title: asDraft ? 'Entwurf gespeichert' : 'Dealroom veröffentlicht!',
        description: asDraft
          ? 'Der Dealroom wurde als Entwurf gespeichert.'
          : `Link wurde in die Zwischenablage kopiert: ${dealroomUrl}`,
      });

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error(err);
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#1a1a1a] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </button>

      <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-2">
        Neuer Dealroom
      </h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                i <= currentStepIndex
                  ? 'bg-primary text-white'
                  : 'bg-[#e7eef1] text-[#6b7280]'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                i === currentStepIndex ? 'text-[#1a1a1a] font-medium' : 'text-[#6b7280]'
              }`}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div className="w-6 h-px bg-[#e5e7eb]" />
            )}
          </div>
        ))}
      </div>

      {/* Step: Client Data */}
      {currentStep === 'client' && (
        <Card>
          <CardHeader>
            <CardTitle>Kundendaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Name *</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Max Mustermann"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientCompany">Firma *</Label>
                <Input
                  id="clientCompany"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder="Musterfirma GmbH"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPosition">Position</Label>
                <Input
                  id="clientPosition"
                  value={clientPosition}
                  onChange={(e) => setClientPosition(e.target.value)}
                  placeholder="Geschäftsführer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">E-Mail</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="max@musterfirma.de"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Telefon</Label>
                <Input
                  id="clientPhone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+49 ..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientAddress">Adresse</Label>
                <Input
                  id="clientAddress"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Straße, PLZ Ort"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
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
            </div>

            {teamMembers.length > 0 && (
              <div className="space-y-2 pt-2">
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
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                onClick={goNext}
                disabled={!clientName || !clientCompany}
              >
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Language */}
      {currentStep === 'language' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Sprache des Dealrooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <button
                onClick={() => setLanguage('de')}
                className={`p-6 rounded-xl border-2 text-center transition-all ${
                  language === 'de'
                    ? 'border-primary bg-[#e7eef1]'
                    : 'border-[#e5e7eb] hover:border-[#cfdde3]'
                }`}
              >
                <span className="text-2xl mb-2 block">🇩🇪</span>
                <span className="font-medium">Deutsch</span>
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`p-6 rounded-xl border-2 text-center transition-all ${
                  language === 'en'
                    ? 'border-primary bg-[#e7eef1]'
                    : 'border-[#e5e7eb] hover:border-[#cfdde3]'
                }`}
              >
                <span className="text-2xl mb-2 block">🇬🇧</span>
                <span className="font-medium">English</span>
              </button>
            </div>
            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
              <Button onClick={goNext}>
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Input */}
      {currentStep === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle>Kundensituation beschreiben</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 mb-4">
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
                Audio
              </Button>
            </div>

            {inputMethod === 'text' ? (
              <div className="space-y-2">
                <Label>
                  Beschreiben Sie die Kundensituation: Ist-Zustand, Probleme, Ziele, Motivation
                </Label>
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
                <p className="text-sm text-[#6b7280]">
                  Sprechen Sie die Kundensituation ein. Beschreiben Sie Ist-Zustand, Probleme, Ziele und Motivation.
                </p>
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
                        <Button
                          variant="destructive"
                          onClick={audioRecorder.stopRecording}
                        >
                          <MicOff className="h-4 w-4 mr-2" />
                          Stoppen
                        </Button>
                      </div>
                      {audioRecorder.transcript && (
                        <div className="bg-[#f0f5f7] rounded-lg p-3 text-sm text-[#374151] border border-[#e7eef1]">
                          <p className="text-xs text-[#6b7280] mb-1 font-medium">Live-Transkription:</p>
                          {audioRecorder.transcript}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 w-full">
                      <audio
                        controls
                        src={audioRecorder.audioUrl || undefined}
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={audioRecorder.resetRecording}
                        >
                          Neue Aufnahme
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Transkription / Zusätzliche Notizen</Label>
                        <Textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Die Live-Transkription wird hier automatisch eingefügt. Sie können den Text bearbeiten oder ergänzen..."
                          rows={6}
                        />
                        {inputText && (
                          <p className="text-xs text-[#6b7280]">
                            {inputText.split(/\s+/).filter(Boolean).length} Wörter – Sie können den Text vor der Content-Generierung noch bearbeiten.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
              <Button onClick={generateContent} disabled={loading || !inputText.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Generiere Content...' : 'Content generieren'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Review */}
      {currentStep === 'review' && generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Content Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Hero-Titel</Label>
              <Input
                value={generatedContent.hero_title}
                onChange={(e) =>
                  setGeneratedContent({ ...generatedContent, hero_title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Hero-Untertitel</Label>
              <Input
                value={generatedContent.hero_subtitle}
                onChange={(e) =>
                  setGeneratedContent({ ...generatedContent, hero_subtitle: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Ausgangslage (Schmerzpunkte)</Label>
              {generatedContent.situation_points.map((point, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-[#11485e]/10 flex items-center justify-center">
                    <DynamicIcon name={point.icon} className="h-4 w-4 text-[#11485e]" />
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

            <div className="space-y-2">
              <Label>Ziel</Label>
              <Input
                value={generatedContent.goal}
                onChange={(e) =>
                  setGeneratedContent({ ...generatedContent, goal: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Ansatz</Label>
              <Textarea
                value={generatedContent.approach}
                onChange={(e) =>
                  setGeneratedContent({ ...generatedContent, approach: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Ergebnis-Vision</Label>
              {generatedContent.outcome_vision.map((outcome, i) => (
                <Input
                  key={i}
                  value={outcome}
                  onChange={(e) => {
                    const updated = [...generatedContent.outcome_vision];
                    updated[i] = e.target.value;
                    setGeneratedContent({ ...generatedContent, outcome_vision: updated });
                  }}
                />
              ))}
            </div>

            <div className="space-y-2">
              <Label>Garantie-Text</Label>
              <Textarea
                value={generatedContent.guarantee_text}
                onChange={(e) =>
                  setGeneratedContent({ ...generatedContent, guarantee_text: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>CTA-Text</Label>
              <Input
                value={generatedContent.cta_text}
                onChange={(e) =>
                  setGeneratedContent({ ...generatedContent, cta_text: e.target.value })
                }
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
              <Button onClick={goNext}>
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Media */}
      {currentStep === 'media' && (
        <Card>
          <CardHeader>
            <CardTitle>Video & Angebot einbinden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video-URL (Loom oder YouTube)</Label>
              <Input
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.loom.com/share/... oder https://youtube.com/watch?v=..."
              />
              <p className="text-xs text-[#6b7280]">
                Optional: Persönliche Videonachricht für den Kunden
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pandadocUrl">PandaDoc Embed-URL</Label>
              <Input
                id="pandadocUrl"
                value={pandadocUrl}
                onChange={(e) => setPandadocUrl(e.target.value)}
                placeholder="https://app.pandadoc.com/s/..."
              />
              <p className="text-xs text-[#6b7280]">
                Optional: Das Angebotsdokument zum Unterschreiben
              </p>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
              <Button onClick={goNext}>
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Publish */}
      {currentStep === 'publish' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Dealroom veröffentlichen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-[#fafafa] rounded-xl p-6 space-y-3 mb-6">
              <h3 className="font-medium text-[#1a1a1a]">Zusammenfassung</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-[#6b7280]">Kunde:</span>{' '}
                  <span className="font-medium">{clientName}</span>
                </div>
                <div>
                  <span className="text-[#6b7280]">Firma:</span>{' '}
                  <span className="font-medium">{clientCompany}</span>
                </div>
                <div>
                  <span className="text-[#6b7280]">Sprache:</span>{' '}
                  <Badge variant="outline">{language === 'de' ? 'Deutsch' : 'English'}</Badge>
                </div>
                <div>
                  <span className="text-[#6b7280]">Video:</span>{' '}
                  <span className="font-medium">{videoUrl ? 'Ja' : 'Nein'}</span>
                </div>
                <div>
                  <span className="text-[#6b7280]">PandaDoc:</span>{' '}
                  <span className="font-medium">{pandadocUrl ? 'Ja' : 'Nein'}</span>
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

            <div className="flex justify-between">
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
