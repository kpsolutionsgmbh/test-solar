'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Dealroom, DealroomContent, Reference, TeamMember } from '@/types/database';
import { Translations } from '@/lib/i18n';
import { initDealroomTracking, trackEvent } from '@/lib/tracking';
import {
  AlertTriangle,
  Clock,
  TrendingDown,
  Ban,
  HeartPulse,
  Users,
  CheckCircle2,
  Shield,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Award,
  Globe,
  Star,
  Play,
  Target,
  Zap,
  Timer,
  Cookie,
  FileText,
  Lightbulb,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  'alert-triangle': AlertTriangle,
  clock: Clock,
  'trending-down': TrendingDown,
  ban: Ban,
  'heart-pulse': HeartPulse,
  users: Users,
  'users-x': Users,
  shield: Shield,
  star: Star,
  award: Award,
  target: Target,
  zap: Zap,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getIcon(name: string) {
  return iconMap[name] || AlertTriangle;
}

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;
  return url;
}

// Helper to render guarantee text with **bold** markdown
function renderBoldText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part
  );
}

// Helper to get outcome text (supports string or {text, detail} format)
function getOutcomeText(outcome: string | { text: string; detail?: string }): string {
  return typeof outcome === 'string' ? outcome : outcome.text;
}

function getOutcomeDetail(outcome: string | { text: string; detail?: string }): string | undefined {
  return typeof outcome === 'string' ? undefined : outcome.detail;
}

interface Props {
  dealroom: Dealroom;
  content: DealroomContent | null;
  admin: { name: string; avatar_url: string | null; company_name: string; company_logo_url: string | null; brand_color: string } | null;
  assignedMember: TeamMember | null;
  references: Reference[];
  translations: Translations;
}

type TabKey = 'overview' | 'offer' | 'references';

export function DealroomClient({ dealroom, content, admin, assignedMember, references, translations: tr }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showCookieBanner, setShowCookieBanner] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const contact = assignedMember || (admin ? {
    name: admin.name,
    position: 'Geschäftsführer',
    email: 'info@guendesliundkollegen.de',
    phone: '02261/5016320',
    avatar_url: admin.avatar_url,
  } : null);

  useEffect(() => {
    const cleanup = initDealroomTracking(dealroom.id);
    if (typeof window !== 'undefined' && localStorage.getItem('cookie_consent')) {
      setShowCookieBanner(false);
    }
    return cleanup;
  }, [dealroom.id]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll('.fade-in-up').forEach((el) => {
      observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, [activeTab]);

  const switchTab = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    trackEvent(dealroom.id, 'tab_switch', { tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dealroom.id]);

  const handleCta = useCallback((ctaName: string) => {
    switchTab('offer');
    trackEvent(dealroom.id, 'cta_click', { cta: ctaName });
  }, [dealroom.id, switchTab]);

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShowCookieBanner(false);
  };

  const brandColor = admin?.brand_color || '#11485e';
  const formattedDate = new Date(dealroom.created_at).toLocaleDateString(
    dealroom.language === 'de' ? 'de-DE' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  // Reusable CTA block component
  const CtaBlock = ({ text, derisking, ctaName, className = '' }: { text: string; derisking: string; ctaName: string; className?: string }) => (
    <div className={`text-center py-8 ${className}`}>
      <button
        onClick={() => handleCta(ctaName)}
        className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-white font-semibold text-lg shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        style={{ backgroundColor: brandColor }}
      >
        {text}
        <ArrowRight className="h-5 w-5" />
      </button>
      <p className="text-sm text-[#9ca3af] mt-3">{derisking}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Cookie Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-[#e5e7eb] shadow-2xl p-4 sm:p-6">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Cookie className="h-5 w-5 shrink-0" style={{ color: brandColor }} />
            <p className="text-sm text-[#6b7280] flex-1">
              {dealroom.language === 'de'
                ? 'Diese Seite verwendet Cookies und Tracking, um Ihnen ein optimales Erlebnis zu bieten. Mit der Nutzung stimmen Sie unserer Datenschutzerklärung zu.'
                : 'This page uses cookies and tracking to provide you with an optimal experience. By using this page, you agree to our privacy policy.'}
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={acceptCookies}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: brandColor }}
              >
                {dealroom.language === 'de' ? 'Akzeptieren' : 'Accept'}
              </button>
              <a
                href="https://guendesliundkollegen.de/datenschutz"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium border rounded-lg text-[#6b7280] hover:bg-[#fafafa] transition-colors"
              >
                {dealroom.language === 'de' ? 'Mehr erfahren' : 'Learn more'}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <header className="border-b border-[#e5e7eb] bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Trust badges bar */}
          <div className="flex items-center justify-between py-2 border-b border-[#f0f0f0]">
            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto text-xs text-[#6b7280]">
              <span className="flex items-center gap-1.5 whitespace-nowrap font-medium">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/logo-blue.svg" alt="Gündesli & Kollegen" className="h-5 object-contain" />
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Award className="h-3.5 w-3.5" style={{ color: brandColor }} />
                {tr.trust.awards}
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Users className="h-3.5 w-3.5" style={{ color: brandColor }} />
                {tr.trust.customers}
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Globe className="h-3.5 w-3.5" style={{ color: brandColor }} />
                {tr.trust.languages}
              </span>
            </div>
          </div>
          {/* Tab navigation */}
          <nav className="flex items-center">
            {(['overview', 'offer', 'references'] as TabKey[]).map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className="relative px-5 py-3.5 text-sm font-medium transition-all"
                style={{
                  color: activeTab === tab ? brandColor : '#6b7280',
                }}
              >
                {tr.tabs[tab]}
                {activeTab === tab && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full"
                    style={{ backgroundColor: brandColor }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {/* ==================== OVERVIEW TAB ==================== */}
        <div className={activeTab === 'overview' ? '' : 'hidden'}>
          {content && (
            <div>
              {/* ===== 1. HERO SECTION ===== */}
              <section className="fade-in-up bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8">
                  <div className="text-center mb-10">
                    {dealroom.client_logo_url && (
                      <div className="mb-6">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={dealroom.client_logo_url} alt={dealroom.client_company} className="h-14 object-contain mx-auto" />
                      </div>
                    )}
                    <p className="text-sm uppercase tracking-wider font-medium mb-3" style={{ color: brandColor }}>
                      {tr.hero.preparedFor}
                    </p>
                    <h1 className="text-[28px] sm:text-[40px] font-bold text-[#1a1a1a] mb-4 leading-tight max-w-3xl mx-auto">
                      {content.hero_title}
                    </h1>
                    <p className="text-[17px] text-[#6b7280] max-w-2xl mx-auto leading-relaxed">
                      {content.hero_subtitle}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-sm text-[#6b7280]">
                      <span className="font-medium text-[#1a1a1a]">{dealroom.client_company}</span>
                      <span className="h-1 w-1 rounded-full bg-[#d1d5db]" />
                      <span>{dealroom.client_name}</span>
                      <span className="h-1 w-1 rounded-full bg-[#d1d5db]" />
                      <span>{tr.hero.date} {formattedDate}</span>
                    </div>
                  </div>

                  {/* Contact Person Card - PROMINENT */}
                  {contact && (
                    <div className="max-w-xl mx-auto rounded-2xl p-6 sm:p-8 border-2 shadow-sm" style={{ borderColor: brandColor + '25', backgroundColor: brandColor + '05' }}>
                      <p className="text-xs uppercase tracking-wider font-semibold mb-5" style={{ color: brandColor }}>
                        {tr.hero.by}
                      </p>
                      <div className="flex items-center gap-5">
                        <div className="h-20 w-20 rounded-full flex items-center justify-center text-white text-2xl font-semibold shrink-0 shadow-lg overflow-hidden" style={{ backgroundColor: brandColor }}>
                          {contact.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={contact.avatar_url} alt={contact.name} className="h-20 w-20 rounded-full object-cover" />
                          ) : (
                            contact.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="text-xl font-bold text-[#1a1a1a] mb-1">
                            <span className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: brandColor + '15', color: brandColor }}>
                              {contact.name}
                            </span>
                          </p>
                          {contact.position && (
                            <p className="text-sm text-[#6b7280] mb-2">{contact.position}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            {contact.phone && (
                              <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 font-medium hover:underline" style={{ color: brandColor }}>
                                <Phone className="h-4 w-4" /> {contact.phone}
                              </a>
                            )}
                            {contact.email && (
                              <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 font-medium hover:underline" style={{ color: brandColor }}>
                                <Mail className="h-4 w-4" /> {contact.email}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hero CTA */}
                  <CtaBlock
                    text={content.cta_text || tr.sections.ctaDefault}
                    derisking={content.cta_derisking || tr.sections.ctaDerisking}
                    ctaName="hero"
                  />
                </div>
              </section>

              {/* ===== 2. VIDEO SECTION ===== */}
              {dealroom.video_url && (
                <section className="fade-in-up bg-[#fafafa]">
                  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
                    <div className="flex items-center gap-2 mb-5">
                      <Play className="h-5 w-5" style={{ color: brandColor }} />
                      <h2 className="text-xl font-semibold text-[#1a1a1a]">
                        {tr.sections.videoTitle}
                      </h2>
                    </div>
                    <div className="aspect-video rounded-2xl overflow-hidden bg-white border border-[#e5e7eb] shadow-sm">
                      <iframe
                        src={getVideoEmbedUrl(dealroom.video_url) || ''}
                        className="w-full h-full"
                        allowFullScreen
                        allow="autoplay; fullscreen"
                        onLoad={() => trackEvent(dealroom.id, 'video_play')}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* ===== 3. AUTHORITY BAR - Real Award Logos ===== */}
              <section className="fade-in-up border-y border-[#e5e7eb] bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                  <p className="text-center text-sm font-medium text-[#9ca3af] uppercase tracking-wider mb-6">
                    {tr.sections.authorityTitle}
                  </p>
                  <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
                    {/* eslint-disable @next/next/no-img-element */}
                    <img src="/images/awards/focus-money.webp" alt="Focus Money" className="h-16 sm:h-20 object-contain opacity-90 hover:opacity-100 transition-opacity" />
                    <img src="/images/awards/stiftung-warentest.webp" alt="Stiftung Warentest" className="h-16 sm:h-20 object-contain opacity-90 hover:opacity-100 transition-opacity" />
                    <img src="/images/awards/disq-rating.jpg" alt="DISQ Rating" className="h-16 sm:h-20 object-contain opacity-90 hover:opacity-100 transition-opacity" />
                    {/* eslint-enable @next/next/no-img-element */}
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa]">
                      <Shield className="h-5 w-5" style={{ color: brandColor }} />
                      <span className="text-sm font-semibold text-[#4b5563]">SIGNAL IDUNA</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa]">
                      <Users className="h-5 w-5" style={{ color: brandColor }} />
                      <span className="text-sm font-semibold text-[#4b5563]">BVK Mitglied</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ===== 4. PAIN SECTION - Dark Cards ===== */}
              <section className="fade-in-up bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-4">
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <h2 className="text-2xl sm:text-[28px] font-bold text-[#1a1a1a] mb-3">
                      {content.cost_of_inaction.headline}
                    </h2>
                    <p className="text-[#6b7280] max-w-xl mx-auto">
                      {tr.sections.situationDescription}
                    </p>
                  </div>

                  {/* Dark Pain Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {content.situation_points.map((point, i) => (
                      <div
                        key={i}
                        className="rounded-2xl p-6 border border-[#2a2a3e]/20 shadow-lg"
                        style={{ backgroundColor: '#0f1a24' }}
                      >
                        <div className="text-3xl mb-4">
                          {point.emoji || '⚠️'}
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2 leading-snug">
                          {point.heading || point.text}
                        </h3>
                        {point.subtext && (
                          <p className="text-[#94a3b8] text-sm leading-relaxed">
                            {point.subtext}
                          </p>
                        )}
                        {/* Subtle amber glow at bottom */}
                        <div className="mt-4 h-0.5 rounded-full bg-gradient-to-r from-amber-500/40 via-red-500/30 to-transparent" />
                      </div>
                    ))}
                  </div>

                  {/* Cost of Inaction consequences */}
                  {content.cost_of_inaction.consequences.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {content.cost_of_inaction.consequences.map((c, i) => (
                        <div
                          key={i}
                          className="rounded-xl p-5 border border-[#2a2a3e]/20"
                          style={{ backgroundColor: '#0f1a24' }}
                        >
                          <div className="text-2xl mb-3">{c.emoji || '💸'}</div>
                          <h4 className="text-white font-semibold text-sm mb-1">
                            {c.heading || c.text}
                          </h4>
                          {c.subtext && (
                            <p className="text-[#94a3b8] text-xs leading-relaxed">{c.subtext}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA after Pain */}
                  <CtaBlock
                    text={tr.sections.ctaAfterPain}
                    derisking={tr.sections.ctaDeriskingPain}
                    ctaName="after-pain"
                  />
                </div>
              </section>

              {/* ===== 5. DREAM OUTCOME - Green Gradient Card ===== */}
              <section className="fade-in-up bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
                  <div
                    className="rounded-3xl p-8 sm:p-12 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${brandColor} 0%, #0d3b4d 50%, #0a4a3a 100%)`,
                    }}
                  >
                    {/* Subtle glow effects */}
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: `radial-gradient(circle, #10b981, transparent)` }} />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${brandColor}, transparent)` }} />

                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 text-emerald-300 mb-6">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {tr.sections.outcomeSubtitle}
                      </div>

                      <h2 className="text-2xl sm:text-[28px] font-bold text-white mb-8 leading-tight max-w-2xl">
                        {tr.sections.outcomeTitle.replace('Sie', dealroom.client_company)}
                      </h2>

                      <div className="space-y-4 mb-8">
                        {content.outcome_vision.map((outcome, i) => (
                          <div key={i} className="flex items-start gap-4">
                            <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-white font-semibold text-lg">{getOutcomeText(outcome)}</p>
                              {getOutcomeDetail(outcome) && (
                                <p className="text-white/60 text-sm mt-1">{getOutcomeDetail(outcome)}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Vision Quote */}
                      {content.outcome_quote && (
                        <div className="border-l-4 border-emerald-400/50 pl-6 py-2">
                          <p className="text-white/90 text-lg italic leading-relaxed">
                            &ldquo;{content.outcome_quote}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA after Outcome */}
                  <CtaBlock
                    text={tr.sections.ctaAfterOutcome}
                    derisking={tr.sections.ctaDeriskingOutcome}
                    ctaName="after-outcome"
                  />
                </div>
              </section>

              {/* ===== 6. HOW IT WORKS - Process Steps ===== */}
              <section className="fade-in-up bg-[#fafafa]">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full mb-4" style={{ backgroundColor: brandColor + '12' }}>
                      <Timer className="h-6 w-6" style={{ color: brandColor }} />
                    </div>
                    <h2 className="text-2xl sm:text-[28px] font-bold text-[#1a1a1a]">
                      {tr.sections.processTitle}
                    </h2>
                  </div>

                  <div className="space-y-0 relative max-w-3xl mx-auto">
                    {/* Vertical line */}
                    <div className="absolute left-5 top-6 bottom-6 w-0.5" style={{ backgroundColor: brandColor + '20' }} />
                    {content.process_steps.map((step) => (
                      <div key={step.step} className="flex gap-6 relative py-4">
                        <div className="shrink-0 z-10">
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                            style={{ backgroundColor: brandColor }}
                          >
                            {step.step}
                          </div>
                        </div>
                        <div className="flex-1 bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
                          <h3 className="font-bold text-[#1a1a1a] text-lg mb-3">{step.title}</h3>
                          <div className="flex flex-wrap gap-3 mb-3">
                            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold" style={{ backgroundColor: brandColor + '12', color: brandColor }}>
                              <Clock className="h-3 w-3" />
                              {step.duration}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                              <Timer className="h-3 w-3" />
                              {step.effort}
                            </span>
                          </div>
                          <p className="text-sm text-[#6b7280] leading-relaxed mb-2">{step.description}</p>
                          {step.customer_action && (
                            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 mt-2 font-medium">
                              {tr.sections.processYourAction} {step.customer_action}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA after Process */}
                  <CtaBlock
                    text={tr.sections.ctaAfterProcess}
                    derisking={tr.sections.ctaDeriskingProcess}
                    ctaName="after-process"
                  />
                </div>
              </section>

              {/* ===== 7. GUARANTEE - Dark Teal Card ===== */}
              <section className="fade-in-up bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
                  <div
                    className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
                    style={{ backgroundColor: '#0a2e3d' }}
                  >
                    {/* Subtle glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${brandColor}, transparent)` }} />

                    <div className="relative z-10">
                      <div
                        className="h-16 w-16 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: brandColor, boxShadow: `0 0 40px ${brandColor}40` }}
                      >
                        <Shield className="h-8 w-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-4">
                        {content.guarantee_title || tr.sections.guaranteeTitle}
                      </h2>
                      <p className="text-[#94a3b8] max-w-xl mx-auto leading-relaxed text-lg">
                        {renderBoldText(content.guarantee_text)}
                      </p>
                    </div>
                  </div>

                  {/* CTA after Guarantee */}
                  <CtaBlock
                    text={tr.sections.ctaAfterGuarantee}
                    derisking={tr.sections.ctaDeriskingGuarantee}
                    ctaName="after-guarantee"
                  />
                </div>
              </section>

              {/* ===== 8. SOCIAL PROOF INLINE (1-2 references if available) ===== */}
              {references.length > 0 && (
                <section className="fade-in-up bg-[#fafafa]">
                  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
                    <div className="text-center mb-8">
                      <Star className="h-6 w-6 mx-auto mb-3" style={{ color: brandColor }} />
                      <h2 className="text-xl font-bold text-[#1a1a1a]">{tr.references.title}</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                      {references.slice(0, 2).map((ref) => (
                        <div key={ref.id} className="bg-white rounded-2xl p-6 border border-[#e5e7eb] shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            {ref.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={ref.logo_url} alt={ref.client_company} className="h-10 object-contain" />
                            ) : (
                              <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: brandColor }}>
                                {ref.client_company.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-[#1a1a1a] text-sm">{ref.client_company}</p>
                              <p className="text-xs text-[#6b7280]">{ref.client_name}</p>
                            </div>
                          </div>
                          {ref.quote && (
                            <p className="text-[#6b7280] italic text-sm leading-relaxed">
                              &ldquo;{ref.quote}&rdquo;
                            </p>
                          )}
                          {ref.result_summary && (
                            <div className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: brandColor }}>
                              {ref.result_summary}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {references.length > 2 && (
                      <div className="text-center mt-6">
                        <button
                          onClick={() => switchTab('references')}
                          className="text-sm font-medium hover:underline"
                          style={{ color: brandColor }}
                        >
                          {dealroom.language === 'de' ? 'Alle Referenzen ansehen →' : 'View all references →'}
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ===== 9. ABOUT US (Static) ===== */}
              <section className="fade-in-up bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
                  <div className="rounded-2xl overflow-hidden border border-[#e5e7eb] shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Left: Info */}
                      <div className="p-8 sm:p-10" style={{ backgroundColor: brandColor + '06' }}>
                        <h3 className="text-xl font-bold text-[#1a1a1a] mb-4">
                          {tr.about.title}
                        </h3>
                        <p className="text-sm text-[#6b7280] leading-relaxed mb-6">
                          {tr.about.description}
                        </p>
                        {/* Team Photo */}
                        <div className="rounded-xl overflow-hidden mb-6">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/images/team/team-lg.jpeg" alt="Gündesli & Kollegen Team" className="w-full h-48 object-cover" />
                        </div>
                        {/* Trust badges */}
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e5e7eb] text-xs font-medium text-[#6b7280]">
                            <Shield className="h-3.5 w-3.5" style={{ color: brandColor }} />
                            SIGNAL IDUNA
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e5e7eb] text-xs font-medium text-[#6b7280]">
                            <Award className="h-3.5 w-3.5" style={{ color: brandColor }} />
                            Stiftung Warentest
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e5e7eb] text-xs font-medium text-[#6b7280]">
                            <Star className="h-3.5 w-3.5" style={{ color: brandColor }} />
                            Focus Money
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e5e7eb] text-xs font-medium text-[#6b7280]">
                            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: brandColor }} />
                            DISQ Rating
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e5e7eb] text-xs font-medium text-[#6b7280]">
                            <Users className="h-3.5 w-3.5" style={{ color: brandColor }} />
                            BVK Mitglied
                          </div>
                        </div>
                      </div>
                      {/* Right: Stats */}
                      <div className="p-8 sm:p-10 flex flex-col justify-center" style={{ backgroundColor: brandColor }}>
                        <div className="grid grid-cols-2 gap-6 text-white">
                          <div>
                            <p className="text-3xl font-bold">4.000+</p>
                            <p className="text-sm opacity-80">{tr.about.statCustomers}</p>
                          </div>
                          <div>
                            <p className="text-3xl font-bold">50+</p>
                            <p className="text-sm opacity-80">{tr.about.statAwards}</p>
                          </div>
                          <div>
                            <p className="text-3xl font-bold">25</p>
                            <p className="text-sm opacity-80">{tr.about.statYears}</p>
                          </div>
                          <div>
                            <p className="text-3xl font-bold">8</p>
                            <p className="text-sm opacity-80">{tr.about.statLanguages}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ===== 10. FINAL CTA BLOCK ===== */}
              <section className="fade-in-up bg-[#fafafa]">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
                  <div
                    className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
                    style={{ backgroundColor: brandColor }}
                  >
                    <div className="relative z-10">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                        {tr.sections.finalCtaTitle}
                      </h2>
                      <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
                        {tr.sections.finalCtaSubtitle}
                      </p>
                      <button
                        onClick={() => handleCta('final')}
                        className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-white font-semibold text-lg shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                        style={{ color: brandColor }}
                      >
                        {content.cta_text || tr.sections.ctaDefault}
                        <ArrowRight className="h-5 w-5" />
                      </button>
                      <p className="text-white/60 text-sm mt-4">
                        {content.cta_derisking || tr.sections.ctaDerisking}
                      </p>

                      {/* Contact info */}
                      {contact && (
                        <div className="flex flex-wrap items-center justify-center gap-5 mt-6 text-sm text-white/80">
                          {contact.phone && (
                            <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                              <Phone className="h-4 w-4" /> {contact.phone}
                            </a>
                          )}
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                              <Mail className="h-4 w-4" /> {contact.email}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* ==================== OFFER TAB ==================== */}
        <div className={activeTab === 'offer' ? '' : 'hidden'}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <div className="text-center mb-8 fade-in-up">
              <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">
                {tr.offer.title}
              </h2>
              <p className="text-[#6b7280]">{tr.offer.subtitle}</p>
            </div>
            {dealroom.pandadoc_embed_url ? (
              <div className="fade-in-up rounded-2xl overflow-hidden border border-[#e5e7eb] shadow-sm" style={{ minHeight: '80vh' }}>
                <iframe
                  src={dealroom.pandadoc_embed_url}
                  className="w-full"
                  style={{ height: '80vh' }}
                  onLoad={() => trackEvent(dealroom.id, 'pandadoc_open')}
                />
              </div>
            ) : (
              <div className="text-center py-20 bg-[#fafafa] rounded-2xl border-2 border-dashed border-[#e5e7eb]">
                <p className="text-[#6b7280]">{tr.offer.noPandadoc}</p>
              </div>
            )}
          </div>
        </div>

        {/* ==================== REFERENCES TAB - Split Layout ==================== */}
        <div className={activeTab === 'references' ? '' : 'hidden'}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <div className="text-center mb-10 fade-in-up">
              <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">
                {tr.references.title}
              </h2>
              <p className="text-[#6b7280]">{tr.references.subtitle}</p>
            </div>
            {references.length === 0 ? (
              <div className="text-center py-16 text-[#6b7280]">
                <Star className="h-12 w-12 mx-auto mb-4 text-[#d1d5db]" />
                <p>{dealroom.language === 'de' ? 'Referenzen werden in Kürze hinzugefügt.' : 'References will be added shortly.'}</p>
              </div>
            ) : (
              <div className="space-y-8">
                {references.map((ref) => (
                  <div
                    key={ref.id}
                    className="fade-in-up rounded-2xl bg-white border border-[#e5e7eb] shadow-sm overflow-hidden"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Left: Video or Image */}
                      <div className="bg-[#fafafa] flex items-center justify-center min-h-[280px]">
                        {ref.video_url ? (
                          <div className="w-full h-full">
                            <iframe
                              src={getVideoEmbedUrl(ref.video_url) || ''}
                              className="w-full h-full min-h-[280px]"
                              allowFullScreen
                            />
                          </div>
                        ) : ref.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ref.image_url} alt={ref.client_company} className="w-full h-full object-cover min-h-[280px]" />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8 text-center">
                            <div className="h-20 w-20 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3" style={{ backgroundColor: brandColor }}>
                              {ref.client_company.charAt(0)}
                            </div>
                            <p className="text-lg font-semibold text-[#1a1a1a]">{ref.client_company}</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Details */}
                      <div className="p-6 sm:p-8 flex flex-col justify-center">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                          {ref.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ref.logo_url} alt={ref.client_company} className="h-10 object-contain" />
                          ) : (
                            <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: brandColor }}>
                              {ref.client_company.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-[#1a1a1a]">{ref.client_company}</p>
                            <p className="text-sm text-[#6b7280]">{ref.client_name}</p>
                          </div>
                        </div>

                        {/* Quote */}
                        {ref.quote && (
                          <blockquote className="text-lg italic leading-relaxed pl-4 border-l-4 mb-5" style={{ borderColor: brandColor + '40', color: brandColor }}>
                            &ldquo;{ref.quote}&rdquo;
                          </blockquote>
                        )}

                        {/* Situation / Method / Result */}
                        <div className="space-y-3">
                          {ref.situation_text && (
                            <div className="flex items-start gap-3">
                              <div className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                                <FileText className="h-3.5 w-3.5 text-red-500" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af] mb-0.5">{tr.references.situation}</p>
                                <p className="text-sm text-[#6b7280]">{ref.situation_text}</p>
                              </div>
                            </div>
                          )}
                          {ref.method_text && (
                            <div className="flex items-start gap-3">
                              <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: brandColor + '12' }}>
                                <Lightbulb className="h-3.5 w-3.5" style={{ color: brandColor }} />
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af] mb-0.5">{tr.references.method}</p>
                                <p className="text-sm text-[#6b7280]">{ref.method_text}</p>
                              </div>
                            </div>
                          )}
                          {ref.result_summary && (
                            <div className="flex items-start gap-3">
                              <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af] mb-0.5">{tr.references.result}</p>
                                <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: brandColor }}>
                                  {ref.result_summary}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e5e7eb] py-8 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6b7280]">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo-blue.svg" alt="Gündesli & Kollegen" className="h-5 object-contain" />
              <span className="font-medium">{tr.footer.copyright}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-3 w-3" />
              <span>{tr.footer.address}</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="tel:02261/5016320" className="hover:underline">02261/5016320</a>
              <a href="mailto:info@guendesliundkollegen.de" className="hover:underline">info@guendesliundkollegen.de</a>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[#9ca3af]">
            <span>Bezirksdirektion der SIGNAL IDUNA Gruppe</span>
            <span>|</span>
            <a href="https://guendesliundkollegen.de/impressum" target="_blank" rel="noopener noreferrer" className="hover:underline">
              {tr.footer.imprint}
            </a>
            <span>|</span>
            <a href="https://guendesliundkollegen.de/datenschutz" target="_blank" rel="noopener noreferrer" className="hover:underline">
              {tr.footer.privacy}
            </a>
            <span>|</span>
            <button onClick={() => setShowCookieBanner(true)} className="hover:underline">
              Cookies
            </button>
          </div>
        </div>
      </footer>

      {/* Sticky Contact Bar (mobile) */}
      {contact && (
        <div className="fixed bottom-0 left-0 right-0 sm:hidden z-40 bg-white border-t border-[#e5e7eb] p-3 flex items-center justify-between" style={{ marginBottom: showCookieBanner ? '120px' : 0 }}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden" style={{ backgroundColor: brandColor }}>
              {contact.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={contact.avatar_url} alt={contact.name} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                contact.name.charAt(0)
              )}
            </div>
            <span className="text-sm font-semibold truncate px-1.5 py-0.5 rounded" style={{ backgroundColor: brandColor + '15', color: brandColor }}>{contact.name}</span>
          </div>
          <div className="flex gap-2">
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="h-9 w-9 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: brandColor }}>
                <Phone className="h-4 w-4" />
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="h-9 w-9 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: brandColor }}>
                <Mail className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
