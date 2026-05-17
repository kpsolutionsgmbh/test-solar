'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { GlobalContent, ResolvedGlobalContent } from '@/lib/global-content-types';
import { Save, Plus, Trash2 } from 'lucide-react';

type FullGlobalContent = ResolvedGlobalContent;

interface Props {
  initial: FullGlobalContent;
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
      toast({ title: 'Gespeichert', description: 'Änderungen wirken sofort auf alle Angebotsräume.' });
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
    <div className="space-y-6 max-w-3xl pb-24">
      {/* About */}
      <Card className="border-border shadow-raised">
        <CardHeader>
          <CardTitle className="text-base font-bold">Über uns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="about-kicker">Kicker (kleines Label)</Label>
            <Input
              id="about-kicker"
              value={content.about.kicker}
              onChange={e => updateAbout({ kicker: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="about-headline">Headline</Label>
            <Input
              id="about-headline"
              value={content.about.headline}
              onChange={e => updateAbout({ headline: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="about-subheadline">Subheadline</Label>
            <Textarea
              id="about-subheadline"
              rows={3}
              value={content.about.subheadline}
              onChange={e => updateAbout({ subheadline: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="about-image">Bild-URL</Label>
            <Input
              id="about-image"
              value={content.about.imageUrl}
              onChange={e => updateAbout({ imageUrl: e.target.value })}
              placeholder="/images/team/team-lg.jpeg"
            />
            <p className="text-xs text-fg-subtle mt-1">
              Pfad zu einem Bild unter /public oder eine vollständige URL.
            </p>
          </div>

          <div>
            <Label>Bullet Points</Label>
            <div className="space-y-3 mt-2">
              {content.about.bullets.map((b, i) => (
                <div key={i} className="flex gap-3 items-start rounded-lg border border-border p-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Titel"
                      value={b.title}
                      onChange={e => updateAboutBullet(i, { title: e.target.value })}
                    />
                    <Input
                      placeholder="Detail"
                      value={b.detail}
                      onChange={e => updateAboutBullet(i, { detail: e.target.value })}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAboutBullet(i)}
                    disabled={content.about.bullets.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addAboutBullet} className="gap-2">
                <Plus className="h-4 w-4" /> Bullet hinzufügen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card className="border-border shadow-raised">
        <CardHeader>
          <CardTitle className="text-base font-bold">So einfach geht&apos;s</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="steps-kicker">Kicker</Label>
              <Input
                id="steps-kicker"
                value={content.steps.kicker}
                onChange={e =>
                  setContent(c => ({ ...c, steps: { ...c.steps, kicker: e.target.value } }))
                }
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
              />
            </div>
          </div>
          <div className="space-y-3">
            {content.steps.items.map((s, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="z.B. Schritt 1"
                    value={s.step}
                    onChange={e => updateStep(i, { step: e.target.value })}
                  />
                  <Input
                    placeholder="Titel"
                    value={s.title}
                    onChange={e => updateStep(i, { title: e.target.value })}
                  />
                </div>
                <Textarea
                  rows={2}
                  placeholder="Beschreibung"
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
          <CardTitle className="text-base font-bold">Final CTA</CardTitle>
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
            />
          </div>
          <div>
            <Label htmlFor="cta-sub">Subtitel</Label>
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
            <Label htmlFor="cta-btn">Button Text</Label>
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
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="sp-label">Kunden-Label</Label>
            <Input
              id="sp-label"
              value={content.socialProof.customersLabel}
              onChange={e =>
                setContent(c => ({
                  ...c,
                  socialProof: { ...c.socialProof, customersLabel: e.target.value },
                }))
              }
            />
            <p className="text-xs text-fg-subtle mt-1">
              Erscheint unter den 5 Sternen im Trust-Block jedes Angebots.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[240px] bg-surface border-t border-border shadow-modal p-4 z-30">
        <div className="max-w-3xl mx-auto md:mx-0 flex items-center justify-end gap-3">
          <p className="text-xs text-fg-muted hidden sm:block">
            Änderungen wirken sofort auf alle Angebotsräume.
          </p>
          <Button onClick={save} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Speichert…' : 'Speichern'}
          </Button>
        </div>
      </div>
    </div>
  );
}
