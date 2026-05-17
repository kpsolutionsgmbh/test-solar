'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { GlobalContent, ResolvedGlobalContent } from '@/lib/global-content-types';
import { uploadFile } from '@/lib/upload';
import { Save, Plus, Trash2, Upload, Loader2, ImageIcon, Info } from 'lucide-react';

type FullGlobalContent = ResolvedGlobalContent;

interface Props {
  initial: FullGlobalContent;
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-fg-subtle mt-1.5 flex items-start gap-1.5">
      <Info className="h-3 w-3 mt-0.5 shrink-0 opacity-70" />
      <span>{children}</span>
    </p>
  );
}

function ImagePickerField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, 'logos');
      if (!url) throw new Error('Upload fehlgeschlagen');
      onChange(url);
      toast({ title: 'Bild hochgeladen', description: 'Wird auf allen Angebotsräumen sichtbar.' });
    } catch (e) {
      toast({
        title: 'Upload fehlgeschlagen',
        description: e instanceof Error ? e.message : 'Bitte erneut versuchen.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-surface-sub border border-border shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Vorschau" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-fg-subtle">
              <ImageIcon className="h-7 w-7" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {value ? 'Bild ersetzen' : 'Bild hochladen'}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange('')}
                className="gap-2 text-fg-muted"
              >
                <Trash2 className="h-4 w-4" />
                Entfernen
              </Button>
            )}
          </div>
          <FieldHint>PNG, JPEG, WebP oder SVG bis 5 MB. Idealgröße quadratisch (1:1) für die Über-uns-Sektion.</FieldHint>
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0] || null)}
      />
    </div>
  );
}

export function GlobalContentEditor({ initial }: Props) {
  const [content, setContent] = useState<FullGlobalContent>(initial);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/global-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Gespeichert', description: 'Wirkt sofort auf alle Angebotsräume.' });
      router.refresh();
    } catch (e) {
      toast({
        title: 'Speichern fehlgeschlagen',
        description: e instanceof Error ? e.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateAbout = (patch: Partial<NonNullable<GlobalContent['about']>>) =>
    setContent(c => ({ ...c, about: { ...c.about, ...patch } }));

  const updateAboutBullet = (i: number, patch: Partial<{ title: string; detail: string }>) =>
    setContent(c => ({
      ...c,
      about: {
        ...c.about,
        bullets: c.about.bullets.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
      },
    }));

  const addAboutBullet = () =>
    setContent(c => ({
      ...c,
      about: { ...c.about, bullets: [...c.about.bullets, { title: '', detail: '' }] },
    }));

  const removeAboutBullet = (i: number) =>
    setContent(c => ({
      ...c,
      about: { ...c.about, bullets: c.about.bullets.filter((_, idx) => idx !== i) },
    }));

  const updateStep = (
    i: number,
    patch: Partial<{ step: string; title: string; description: string }>
  ) =>
    setContent(c => ({
      ...c,
      steps: {
        ...c.steps,
        items: c.steps.items.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
      },
    }));

  return (
    <div className="space-y-6 max-w-3xl pb-32">
      {/* About */}
      <Card className="border-border shadow-raised">
        <CardHeader>
          <CardTitle className="text-base font-bold">Über uns</CardTitle>
          <p className="text-xs text-fg-muted mt-1">
            Die Vorstellung der Firma — erscheint vor dem FAQ.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label htmlFor="about-kicker">Mini-Label</Label>
            <Input
              id="about-kicker"
              value={content.about.kicker}
              onChange={e => updateAbout({ kicker: e.target.value })}
              placeholder="z. B. Über uns"
            />
            <FieldHint>Kurzer Text in Großbuchstaben über der Headline (max. 25 Zeichen).</FieldHint>
          </div>
          <div>
            <Label htmlFor="about-headline">Headline</Label>
            <Input
              id="about-headline"
              value={content.about.headline}
              onChange={e => updateAbout({ headline: e.target.value })}
              placeholder="z. B. Solarheld. Ihr Partner für saubere Energie."
            />
          </div>
          <div>
            <Label htmlFor="about-subheadline">Beschreibung</Label>
            <Textarea
              id="about-subheadline"
              rows={3}
              value={content.about.subheadline}
              onChange={e => updateAbout({ subheadline: e.target.value })}
              placeholder="Zwei bis drei Sätze die Ihre Firma vorstellen."
            />
          </div>

          <div>
            <Label>Bild</Label>
            <div className="mt-2">
              <ImagePickerField
                value={content.about.imageUrl}
                onChange={url => updateAbout({ imageUrl: url })}
              />
            </div>
          </div>

          <div>
            <Label>Drei Argumente (Bullet Points)</Label>
            <FieldHint>Pro Punkt ein kurzer Titel und ein Detailsatz. Erscheinen mit grünem Häkchen.</FieldHint>
            <div className="space-y-3 mt-3">
              {content.about.bullets.map((b, i) => (
                <div key={i} className="flex gap-3 items-start rounded-lg border border-border p-3 bg-surface">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Titel (z. B. 4.000+ Kunden)"
                      value={b.title}
                      onChange={e => updateAboutBullet(i, { title: e.target.value })}
                    />
                    <Input
                      placeholder="Detail (z. B. Familien & Unternehmen vertrauen uns.)"
                      value={b.detail}
                      onChange={e => updateAboutBullet(i, { detail: e.target.value })}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAboutBullet(i)}
                    disabled={content.about.bullets.length <= 1}
                    aria-label="Bullet entfernen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {content.about.bullets.length < 5 && (
                <Button variant="outline" size="sm" onClick={addAboutBullet} className="gap-2">
                  <Plus className="h-4 w-4" /> Bullet hinzufügen
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card className="border-border shadow-raised">
        <CardHeader>
          <CardTitle className="text-base font-bold">So einfach geht&apos;s</CardTitle>
          <p className="text-xs text-fg-muted mt-1">Die drei Schritte unter dem Hero.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="steps-kicker">Mini-Label</Label>
              <Input
                id="steps-kicker"
                value={content.steps.kicker}
                onChange={e =>
                  setContent(c => ({ ...c, steps: { ...c.steps, kicker: e.target.value } }))
                }
                placeholder="z. B. In drei Schritten"
              />
            </div>
            <div>
              <Label htmlFor="steps-headline">Headline</Label>
              <Input
                id="steps-headline"
                value={content.steps.headline}
                onChange={e =>
                  setContent(c => ({ ...c, steps: { ...c.steps, headline: e.target.value } }))
                }
                placeholder="z. B. So einfach geht's"
              />
            </div>
          </div>
          <div className="space-y-3 pt-2">
            {content.steps.items.map((s, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-surface">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    placeholder={`Schritt ${i + 1}`}
                    value={s.step}
                    onChange={e => updateStep(i, { step: e.target.value })}
                  />
                  <Input
                    className="sm:col-span-2"
                    placeholder="Titel"
                    value={s.title}
                    onChange={e => updateStep(i, { title: e.target.value })}
                  />
                </div>
                <Textarea
                  rows={2}
                  placeholder="Beschreibung dieses Schritts"
                  value={s.description}
                  onChange={e => updateStep(i, { description: e.target.value })}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Final CTA */}
      <Card className="border-border shadow-raised">
        <CardHeader>
          <CardTitle className="text-base font-bold">Letzte Aufforderung</CardTitle>
          <p className="text-xs text-fg-muted mt-1">Der Call-to-Action ganz unten auf der Seite.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cta-title">Titel</Label>
            <Input
              id="cta-title"
              value={content.finalCta.title}
              onChange={e =>
                setContent(c => ({ ...c, finalCta: { ...c.finalCta, title: e.target.value } }))
              }
              placeholder="z. B. Bereit für den nächsten Schritt?"
            />
          </div>
          <div>
            <Label htmlFor="cta-sub">Untertitel</Label>
            <Textarea
              id="cta-sub"
              rows={2}
              value={content.finalCta.subtitle}
              onChange={e =>
                setContent(c => ({ ...c, finalCta: { ...c.finalCta, subtitle: e.target.value } }))
              }
            />
          </div>
          <div>
            <Label htmlFor="cta-btn">Button-Text</Label>
            <Input
              id="cta-btn"
              value={content.finalCta.buttonLabel}
              onChange={e =>
                setContent(c => ({
                  ...c,
                  finalCta: { ...c.finalCta, buttonLabel: e.target.value },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Proof */}
      <Card className="border-border shadow-raised">
        <CardHeader>
          <CardTitle className="text-base font-bold">Trust-Strip</CardTitle>
          <p className="text-xs text-fg-muted mt-1">Die Vertrauen-Zeile unter den Buttons.</p>
        </CardHeader>
        <CardContent>
          <Label htmlFor="sp-label">Kunden-Text</Label>
          <Input
            id="sp-label"
            value={content.socialProof.customersLabel}
            onChange={e =>
              setContent(c => ({
                ...c,
                socialProof: { ...c.socialProof, customersLabel: e.target.value },
              }))
            }
            placeholder="z. B. 4.500+ zufriedene Kunden"
          />
          <FieldHint>Erscheint unter den 5 Sternen im Trust-Block.</FieldHint>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[240px] bg-surface border-t border-border shadow-modal p-4 z-30">
        <div className="max-w-3xl mx-auto md:mx-0 flex items-center justify-end gap-3">
          <p className="text-xs text-fg-muted hidden sm:block">
            Änderungen wirken sofort auf alle Angebotsräume.
          </p>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Speichert…' : 'Speichern'}
          </Button>
        </div>
      </div>
    </div>
  );
}
