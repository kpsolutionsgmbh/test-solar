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

  // Contact person: assigned team member or admin fallback
  const contact = assignedMember || (admin ? {
    name: admin.name,
    position: 'Geschäftsführer',
    email: 'info@guendesliundkollegen.de',
    phone: '02261/5016320',
    avatar_url: admin.avatar_url,
  } : null);

  useEffect(() => {
    const cleanup = initDealroomTracking(dealroom.id);
    // Check cookie consent
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

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShowCookieBanner(false);
  };

  const brandColor = admin?.brand_color || '#11485e';
  const formattedDate = new Date(dealroom.created_at).toLocaleDateString(
    dealroom.language === 'de' ? 'de-DE' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
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

      {/* ALL TABS preloaded, only visibility toggled for instant switching */}
      <main>
        {/* ==================== OVERVIEW TAB ==================== */}
        <div className={activeTab === 'overview' ? '' : 'hidden'}>
          {content && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-20">
              {/* Hero + Contact Person */}
              <section className="fade-in-up">
                <div className="text-center mb-8">
                  {dealroom.client_logo_url && (
                    <div className="mb-6">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={dealroom.client_logo_url} alt={dealroom.client_company} className="h-14 object-contain mx-auto" />
                    </div>
                  )}
                  <p className="text-sm uppercase tracking-wider font-medium mb-3" style={{ color: brandColor }}>
                    {tr.hero.preparedFor}
                  </p>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] mb-4 leading-tight">
                    {content.hero_title}
                  </h1>
                  <p className="text-lg text-[#6b7280] max-w-2xl mx-auto">
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

                {/* Contact Person Card - prominent */}
                {contact && (
                  <div className="max-w-lg mx-auto rounded-2xl p-6 border-2 shadow-sm" style={{ borderColor: brandColor + '25', backgroundColor: brandColor + '05' }}>
                    <p className="text-xs uppercase tracking-wider font-semibold mb-4" style={{ color: brandColor }}>
                      {tr.hero.by}
                    </p>
                    <div className="flex items-center gap-4">
                      <div
                        className="h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-semibold shrink-0 shadow-md"
                        style={{ backgroundColor: brandColor }}
                      >
                        {contact.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={contact.avatar_url} alt={contact.name} className="h-16 w-16 rounded-full object-cover" />
                        ) : (
                          contact.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-[#1a1a1a]">
                          <span className="px-2 py-0.5 rounded-md" style={{ backgroundColor: brandColor + '15', color: brandColor }}>
                            {contact.name}
                          </span>
                        </p>
                        {contact.position && (
                          <p className="text-sm text-[#6b7280]">{contact.position}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                          {contact.phone && (
                            <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:underline" style={{ color: brandColor }}>
                              <Phone className="h-3.5 w-3.5" /> {contact.phone}
                            </a>
                          )}
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:underline" style={{ color: brandColor }}>
                              <Mail className="h-3.5 w-3.5" /> {contact.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Video */}
              {dealroom.video_url && (
                <section className="fade-in-up">
                  <div className="flex items-center gap-2 mb-5">
                    <Play className="h-5 w-5" style={{ color: brandColor }} />
                    <h2 className="text-xl font-semibold text-[#1a1a1a]">
                      {tr.sections.videoTitle}
                    </h2>
                  </div>
                  <div className="aspect-video rounded-2xl overflow-hidden bg-[#fafafa] border border-[#e5e7eb] shadow-sm">
                    <iframe
                      src={getVideoEmbedUrl(dealroom.video_url) || ''}
                      className="w-full h-full"
                      allowFullScreen
                      allow="autoplay; fullscreen"
                      onLoad={() => trackEvent(dealroom.id, 'video_play')}
                    />
                  </div>
                </section>
              )}

              {/* Situation / At a Glance - VERTICAL layout */}
              <section className="fade-in-up space-y-8">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-white mb-4" style={{ backgroundColor: brandColor }}>
                    <Target className="h-3.5 w-3.5" />
                    {tr.sections.situationTitle}
                  </div>
                </div>

                {/* Pain points */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: brandColor }}>
                    {tr.sections.situationSubtitle}
                  </h3>
                  <div className="space-y-3">
                    {content.situation_points.map((point, i) => {
                      const Icon = getIcon(point.icon);
                      return (
                        <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-[#e5e7eb] bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: brandColor + '12' }}>
                            <Icon className="h-5 w-5" style={{ color: brandColor }} />
                          </div>
                          <span className="text-[#1a1a1a] pt-2">{point.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Goal */}
                <div className="p-6 rounded-2xl border-2" style={{ borderColor: brandColor + '30', backgroundColor: brandColor + '06' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-5 w-5" style={{ color: brandColor }} />
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: brandColor }}>
                      {tr.sections.goalTitle}
                    </h3>
                  </div>
                  <p className="text-lg text-[#1a1a1a] font-medium">{content.goal}</p>
                </div>

                {/* Approach */}
                <div className="p-6 rounded-2xl bg-[#fafafa] border border-[#e5e7eb]">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-5 w-5" style={{ color: brandColor }} />
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: brandColor }}>
                      {tr.sections.approachTitle}
                    </h3>
                  </div>
                  <p className="text-[#6b7280] leading-relaxed">{content.approach}</p>
                </div>
              </section>

              {/* Cost of Inaction */}
              <section className="fade-in-up">
                <div className="bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 rounded-2xl p-8 sm:p-10 border border-red-100 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Ban className="h-5 w-5 text-red-500" />
                    <h2 className="text-xl font-semibold text-[#1a1a1a]">
                      {content.cost_of_inaction.headline}
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {content.cost_of_inaction.consequences.map((c, i) => {
                      const Icon = getIcon(c.icon);
                      return (
                        <div key={i} className="flex items-start gap-4 bg-white/90 rounded-xl p-5 border border-red-100/50">
                          <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                            <Icon className="h-5 w-5 text-red-500" />
                          </div>
                          <span className="text-[#1a1a1a] pt-2">{c.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Outcome Vision */}
              <section className="fade-in-up">
                <div className="flex items-center gap-2 mb-8 justify-center">
                  <CheckCircle2 className="h-5 w-5" style={{ color: brandColor }} />
                  <h2 className="text-xl font-semibold text-[#1a1a1a]">
                    {tr.sections.outcomeTitle}
                  </h2>
                </div>
                <div className="space-y-3">
                  {content.outcome_vision.map((outcome, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-5 rounded-xl border-2"
                      style={{ borderColor: brandColor + '20', backgroundColor: brandColor + '04' }}
                    >
                      <CheckCircle2 className="h-6 w-6 shrink-0 mt-0.5" style={{ color: brandColor }} />
                      <p className="text-[#1a1a1a] font-medium text-lg">{outcome}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Process Steps */}
              <section className="fade-in-up">
                <div className="flex items-center gap-2 mb-8 justify-center">
                  <Timer className="h-5 w-5" style={{ color: brandColor }} />
                  <h2 className="text-xl font-semibold text-[#1a1a1a]">
                    {tr.sections.processTitle}
                  </h2>
                </div>
                <div className="space-y-0 relative">
                  {/* Vertical line */}
                  <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-[#e5e7eb]" />
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
                      <div className="flex-1 bg-white rounded-xl p-5 border border-[#e5e7eb] shadow-sm">
                        <h3 className="font-semibold text-[#1a1a1a] text-lg mb-2">{step.title}</h3>
                        <div className="flex gap-4 mb-3">
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: brandColor + '12', color: brandColor }}>
                            <Clock className="h-3 w-3" />
                            {tr.sections.processDuration}: {step.duration}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#fafafa] text-[#6b7280] font-medium">
                            <Timer className="h-3 w-3" />
                            {tr.sections.processEffort}: {step.effort}
                          </span>
                        </div>
                        <p className="text-sm text-[#6b7280] leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Guarantee */}
              <section className="fade-in-up">
                <div
                  className="rounded-2xl p-8 sm:p-10 text-center border-2 shadow-sm"
                  style={{ borderColor: brandColor + '25', backgroundColor: brandColor + '06' }}
                >
                  <div className="h-16 w-16 rounded-full mx-auto mb-5 flex items-center justify-center shadow-md" style={{ backgroundColor: brandColor }}>
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">
                    {tr.sections.guaranteeTitle}
                  </h2>
                  <p className="text-[#6b7280] max-w-xl mx-auto leading-relaxed text-lg">
                    {content.guarantee_text}
                  </p>
                </div>
              </section>

              {/* CTA */}
              <section className="fade-in-up text-center">
                <button
                  onClick={() => {
                    switchTab('offer');
                    trackEvent(dealroom.id, 'cta_click', { cta: 'main' });
                  }}
                  className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-white font-semibold text-lg shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: brandColor }}
                >
                  {content.cta_text || tr.sections.ctaDefault}
                  <ArrowRight className="h-5 w-5" />
                </button>
                <p className="text-sm text-[#6b7280] mt-5">
                  {tr.sections.ctaContact}
                </p>
                {contact && (
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-sm">
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:underline" style={{ color: brandColor }}>
                        <Phone className="h-3.5 w-3.5" /> {contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:underline" style={{ color: brandColor }}>
                        <Mail className="h-3.5 w-3.5" /> {contact.email}
                      </a>
                    )}
                  </div>
                )}
              </section>

              {/* Static "About Us" Block */}
              <section className="fade-in-up">
                <div className="rounded-2xl overflow-hidden border border-[#e5e7eb] shadow-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Left: Info */}
                    <div className="p-8 sm:p-10" style={{ backgroundColor: brandColor + '06' }}>
                      <h3 className="text-xl font-semibold text-[#1a1a1a] mb-4">
                        Gündesli & Kollegen
                      </h3>
                      <p className="text-sm text-[#6b7280] leading-relaxed mb-6">
                        {dealroom.language === 'de'
                          ? 'Als Bezirksdirektion der SIGNAL IDUNA Gruppe betreuen wir seit fast 25 Jahren über 4.000 zufriedene Kunden. Unser Team aus 6 Experten berät Sie in 8 Sprachen – persönlich, kompetent und mit über 50 Auszeichnungen für exzellente Beratung.'
                          : 'As a district directorate of SIGNAL IDUNA Group, we have been serving over 4,000 satisfied clients for nearly 25 years. Our team of 6 experts advises you in 8 languages – personally, competently, and with over 50 awards for excellent consulting.'}
                      </p>
                      {/* Trust badges */}
                      <div className="flex flex-wrap gap-3">
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
                    {/* Right: Stats / Visual */}
                    <div className="p-8 sm:p-10 flex flex-col justify-center" style={{ backgroundColor: brandColor }}>
                      <div className="grid grid-cols-2 gap-6 text-white">
                        <div>
                          <p className="text-3xl font-bold">4.000+</p>
                          <p className="text-sm opacity-80">{dealroom.language === 'de' ? 'Zufriedene Kunden' : 'Satisfied Clients'}</p>
                        </div>
                        <div>
                          <p className="text-3xl font-bold">50+</p>
                          <p className="text-sm opacity-80">{dealroom.language === 'de' ? 'Auszeichnungen' : 'Awards'}</p>
                        </div>
                        <div>
                          <p className="text-3xl font-bold">25</p>
                          <p className="text-sm opacity-80">{dealroom.language === 'de' ? 'Jahre Erfahrung' : 'Years Experience'}</p>
                        </div>
                        <div>
                          <p className="text-3xl font-bold">8</p>
                          <p className="text-sm opacity-80">{dealroom.language === 'de' ? 'Sprachen' : 'Languages'}</p>
                        </div>
                      </div>
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

        {/* ==================== REFERENCES TAB ==================== */}
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
              <div className="space-y-6">
                {references.map((ref) => (
                  <div
                    key={ref.id}
                    className="fade-in-up p-6 sm:p-8 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {ref.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ref.logo_url} alt={ref.client_company} className="h-12 object-contain" />
                      ) : (
                        <div
                          className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: brandColor }}
                        >
                          {ref.client_company.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[#1a1a1a] text-lg">{ref.client_company}</p>
                        <p className="text-sm text-[#6b7280]">{ref.client_name}</p>
                      </div>
                      {ref.result_summary && (
                        <div
                          className="ml-auto px-4 py-1.5 rounded-full text-sm font-semibold text-white"
                          style={{ backgroundColor: brandColor }}
                        >
                          {ref.result_summary}
                        </div>
                      )}
                    </div>
                    {ref.quote && (
                      <blockquote className="text-[#6b7280] italic text-lg leading-relaxed pl-4 border-l-4 mb-4" style={{ borderColor: brandColor + '40' }}>
                        &ldquo;{ref.quote}&rdquo;
                      </blockquote>
                    )}
                    {ref.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ref.image_url} alt="" className="rounded-xl w-full object-cover max-h-64 mb-4" />
                    )}
                    {ref.video_url && (
                      <div className="aspect-video rounded-xl overflow-hidden border border-[#e5e7eb]">
                        <iframe
                          src={getVideoEmbedUrl(ref.video_url) || ''}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer with DSGVO links */}
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
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: brandColor }}>
              {contact.name.charAt(0)}
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
