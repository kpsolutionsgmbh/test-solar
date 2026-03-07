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
  Star,
  Play,
  Target,
  Zap,
  Timer,
  Cookie,
  FileText,
  Lightbulb,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;
  return url;
}

function renderBoldText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part
  );
}

function getOutcomeText(outcome: string | { text: string; detail?: string }): string {
  return typeof outcome === 'string' ? outcome : outcome.text;
}

function getOutcomeDetail(outcome: string | { text: string; detail?: string }): string | undefined {
  return typeof outcome === 'string' ? undefined : outcome.detail;
}

// Team images for marquee
const teamImages = [
  { src: '/images/team/team-lg.jpeg', alt: 'Team Gündesli & Kollegen' },
  { src: '/images/team/team-md.jpeg', alt: 'Büro Gündesli & Kollegen' },
  { src: '/images/team/team-lg-1.jpeg', alt: 'Team bei der Arbeit' },
  { src: '/images/team/team-lg-2.jpeg', alt: 'Teammeeting' },
];

// Partner logos (white logos for dark background)
const partnerLogos = [
  { src: '/images/partners/citydriver.png', alt: 'CityDriver' },
  { src: '/images/partners/netzwerk.png', alt: 'Netzwerk' },
  { src: '/images/partners/vfl-gummersbach.svg', alt: 'VfL Gummersbach' },
  { src: '/images/partners/partner-invert.png', alt: 'Partner' },
];

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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
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

  // Scroll progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Social proof element (reusable under CTAs) – vertical stack
  const SocialProof = () => (
    <div className="flex flex-col items-center gap-1 mt-3">
      {/* Overlapping avatars */}
      <div className="flex -space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: i === 0 ? brandColor : i === 1 ? '#0d3d28' : '#6b7280' }}
          >
            {['M', 'S', 'K'][i]}
          </div>
        ))}
      </div>
      {/* Stars ABOVE text */}
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      {/* Text directly below stars */}
      <span className="text-sm text-[#6b7280] font-medium">4.500+ {dealroom.language === 'de' ? 'zufriedene Kunden' : 'satisfied clients'}</span>
    </div>
  );

  // Reusable CTA block with social proof
  const CtaBlock = ({ text, derisking, ctaName, className = '' }: { text: string; derisking: string; ctaName: string; className?: string }) => (
    <div className={`text-center py-6 ${className}`}>
      <button
        onClick={() => handleCta(ctaName)}
        className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 rounded-2xl text-white font-semibold text-base sm:text-lg shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] min-h-[48px]"
        style={{ backgroundColor: brandColor }}
      >
        {text}
        <ArrowRight className="h-5 w-5" />
      </button>
      <p className="text-sm text-[#9ca3af] mt-3">{derisking}</p>
      <SocialProof />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[2px] z-[60] transition-all duration-150"
        style={{ width: `${scrollProgress}%`, backgroundColor: brandColor }}
      />

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
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors min-h-[44px]"
                style={{ backgroundColor: brandColor }}
              >
                {dealroom.language === 'de' ? 'Akzeptieren' : 'Accept'}
              </button>
              <a
                href="https://guendesliundkollegen.de/datenschutz"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium border rounded-lg text-[#6b7280] hover:bg-[#fafafa] transition-colors min-h-[44px] flex items-center"
              >
                {dealroom.language === 'de' ? 'Mehr erfahren' : 'Learn more'}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* V5: Simplified Header – centered logo + centered tabs */}
      <header className="border-b border-[#e5e7eb] bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Centered Logo */}
          <div className="flex items-center justify-center py-3 border-b border-[#f0f0f0]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-blue.svg" alt="Gündesli & Kollegen" className="h-6 object-contain" />
          </div>
          {/* Centered Tab Navigation */}
          <nav className="flex items-center justify-center overflow-x-auto">
            {(['overview', 'offer', 'references'] as TabKey[]).map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className="relative px-5 sm:px-6 py-3.5 text-sm font-medium transition-all whitespace-nowrap min-h-[44px]"
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
              {/* ===== 1. HERO ===== */}
              <section className="fade-in-up bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-6">
                  {/* Client Logo + Prepared For */}
                  <div className="text-center mb-8">
                    {dealroom.client_logo_url && (
                      <div className="mb-5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={dealroom.client_logo_url} alt={dealroom.client_company} className="h-12 sm:h-14 object-contain mx-auto" />
                      </div>
                    )}
                    <p className="text-sm uppercase tracking-wider font-medium mb-3" style={{ color: brandColor }}>
                      {tr.hero.preparedFor}
                    </p>
                    {/* V5: H1 = 36px consistent */}
                    <h1 className="text-[28px] sm:text-[36px] font-bold text-[#1a1a1a] mb-4 leading-tight max-w-3xl mx-auto">
                      {content.hero_title}
                    </h1>
                    <p className="text-[15px] sm:text-[17px] text-[#6b7280] max-w-2xl mx-auto leading-relaxed">
                      {content.hero_subtitle}
                    </p>
                  </div>

                  {/* Video with teaser text */}
                  {dealroom.video_url && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Play className="h-5 w-5" style={{ color: brandColor }} />
                        <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1a1a1a]">
                          {tr.sections.videoTitle}
                        </h2>
                      </div>
                      {/* V5: Video teaser text */}
                      <p className="text-sm text-[#6b7280] mb-3">
                        {dealroom.language === 'de'
                          ? `${contact?.name || 'Ihr Berater'} hat eine persönliche Nachricht für Sie aufgenommen.`
                          : `${contact?.name || 'Your advisor'} recorded a personal message for you.`}
                      </p>
                      <div className="aspect-video rounded-2xl overflow-hidden bg-[#fafafa] border border-[#e5e7eb] shadow-sm">
                        <iframe
                          src={getVideoEmbedUrl(dealroom.video_url) || ''}
                          className="w-full h-full"
                          allowFullScreen
                          allow="autoplay; fullscreen"
                          onLoad={() => trackEvent(dealroom.id, 'video_play')}
                        />
                      </div>
                    </div>
                  )}

                  {/* V5: First CTA always "Angebot ansehen" (hardcoded) */}
                  <CtaBlock
                    text={dealroom.language === 'de' ? 'Angebot ansehen' : 'View Proposal'}
                    derisking={content.cta_derisking || tr.sections.ctaDerisking}
                    ctaName="hero"
                  />

                  {/* V5: Awards moved here (after first CTA) */}
                  <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap mt-2 mb-8">
                    {/* eslint-disable @next/next/no-img-element */}
                    <img src="/images/awards/focus-money.webp" alt="Focus Money" className="h-16 sm:h-20 object-contain opacity-90" />
                    <img src="/images/awards/stiftung-warentest.webp" alt="Stiftung Warentest" className="h-16 sm:h-20 object-contain opacity-90" />
                    <img src="/images/awards/disq-rating.jpg" alt="DISQ Rating" className="h-16 sm:h-20 object-contain opacity-90" />
                    {/* eslint-enable @next/next/no-img-element */}
                  </div>

                  {/* Contact Person Card */}
                  {contact && (
                    <div className="max-w-xl mx-auto rounded-2xl p-5 sm:p-7 border-2 shadow-sm" style={{ borderColor: brandColor + '25', backgroundColor: brandColor + '05' }}>
                      <p className="text-xs uppercase tracking-wider font-semibold mb-4" style={{ color: brandColor }}>
                        {tr.hero.by}
                      </p>
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
                        <div className="h-20 w-20 rounded-full flex items-center justify-center text-white text-2xl font-semibold shrink-0 shadow-lg overflow-hidden" style={{ backgroundColor: brandColor }}>
                          {contact.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={contact.avatar_url} alt={contact.name} className="h-20 w-20 rounded-full object-cover" />
                          ) : (
                            contact.name.charAt(0)
                          )}
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-xl font-bold text-[#1a1a1a] mb-1">
                            <span className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: brandColor + '15', color: brandColor }}>
                              {contact.name}
                            </span>
                          </p>
                          {contact.position && (
                            <p className="text-sm text-[#6b7280] mb-2">{contact.position}</p>
                          )}
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm">
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
                </div>
              </section>

              {/* ===== 2. PAIN SECTION - Dark Red-Brown Container ===== */}
              <section className="fade-in-up bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                  <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 overflow-hidden" style={{ backgroundColor: '#1f0f12' }}>
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-400" />
                      </div>
                      <h2 className="text-[22px] sm:text-[28px] font-bold text-white mb-2">
                        {content.cost_of_inaction.headline}
                      </h2>
                      <p className="text-[#d1d5db] text-sm sm:text-base max-w-lg mx-auto">
                        {tr.sections.situationDescription}
                      </p>
                    </div>

                    {/* Pain Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {content.situation_points.map((point, i) => (
                        <div
                          key={i}
                          className="rounded-xl p-5 border"
                          style={{ backgroundColor: '#3a1a1d', borderColor: 'rgba(255,100,100,0.15)' }}
                        >
                          <div className="text-[32px] sm:text-[36px] mb-3 leading-none">
                            {point.emoji || '⚠️'}
                          </div>
                          <h3 className="text-white font-bold text-base sm:text-[18px] mb-2 leading-snug">
                            {point.heading || point.text}
                          </h3>
                          {point.subtext && (
                            <p className="text-[#d1d5db] text-sm leading-relaxed">
                              {point.subtext}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Cost of Inaction consequences */}
                    {content.cost_of_inaction.consequences.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {content.cost_of_inaction.consequences.map((c, i) => (
                          <div
                            key={i}
                            className="rounded-xl p-4 border"
                            style={{ backgroundColor: '#3a1a1d', borderColor: 'rgba(255,100,100,0.1)' }}
                          >
                            <div className="text-2xl mb-2">{c.emoji || '💸'}</div>
                            <h4 className="text-white font-semibold text-sm mb-1">
                              {c.heading || c.text}
                            </h4>
                            {c.subtext && (
                              <p className="text-[#d1d5db] text-xs leading-relaxed">{c.subtext}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CTA after Pain */}
                  <CtaBlock
                    text={tr.sections.ctaAfterPain}
                    derisking={tr.sections.ctaDeriskingPain}
                    ctaName="after-pain"
                  />
                </div>
              </section>

              {/* ===== 3. DREAM OUTCOME - Pure Green Gradient Card ===== */}
              <section className="fade-in-up bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                  <div
                    className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(160deg, #0a2e1a 0%, #0d3d28 60%, #0a2e1a 100%)',
                    }}
                  >
                    {/* Green glow */}
                    <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, #4ade80, transparent)' }} />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }} />

                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6" style={{ backgroundColor: 'rgba(74,222,128,0.12)', color: '#a3e0b5' }}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {tr.sections.outcomeSubtitle}
                      </div>

                      <h2 className="text-[22px] sm:text-[28px] font-bold text-white mb-8 leading-tight max-w-2xl">
                        {tr.sections.outcomeTitle.replace('Sie', dealroom.client_company)}
                      </h2>

                      <div className="space-y-4 mb-8">
                        {content.outcome_vision.map((outcome, i) => (
                          <div key={i} className="flex items-start gap-3 sm:gap-4">
                            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-[#22c55e] shrink-0 mt-0.5" style={{ filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.4))' }} />
                            <div>
                              <p className="text-white font-semibold text-base sm:text-lg">{getOutcomeText(outcome)}</p>
                              {getOutcomeDetail(outcome) && (
                                <p className="text-white/50 text-sm mt-1">{getOutcomeDetail(outcome)}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Vision Quote */}
                      {content.outcome_quote && (
                        <div className="border-l-4 pl-5 py-2 rounded-r-lg" style={{ borderColor: '#22c55e', backgroundColor: 'rgba(74,222,128,0.08)' }}>
                          <p className="text-[#d1d5db] text-base sm:text-lg italic leading-relaxed">
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

              {/* ===== 4. CONCRETE BENEFITS - Numbers Section ===== */}
              {content.concrete_benefits && content.concrete_benefits.length > 0 && (
                <section className="fade-in-up bg-[#fafafa]">
                  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                    <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1a1a1a] text-center mb-10">
                      {tr.sections.concreteBenefitsTitle}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {content.concrete_benefits.map((benefit, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5e7eb] shadow-sm text-center">
                          <p className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: brandColor }}>
                            {benefit.value}
                          </p>
                          <p className="text-sm sm:text-base font-semibold text-[#1a1a1a] mb-1">{benefit.label}</p>
                          {benefit.detail && (
                            <p className="text-xs text-[#6b7280]">{benefit.detail}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* ===== 5. HOW IT WORKS - Process Steps ===== */}
              <section className="fade-in-up bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full mb-4" style={{ backgroundColor: brandColor + '12' }}>
                      <Timer className="h-6 w-6" style={{ color: brandColor }} />
                    </div>
                    <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1a1a1a]">
                      {tr.sections.processTitle}
                    </h2>
                  </div>

                  <div className="space-y-0 relative max-w-3xl mx-auto">
                    <div className="absolute left-5 top-6 bottom-6 w-0.5" style={{ backgroundColor: brandColor + '20' }} />
                    {content.process_steps.map((step) => (
                      <div key={step.step} className="flex gap-4 sm:gap-6 relative py-3 sm:py-4">
                        <div className="shrink-0 z-10">
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                            style={{ backgroundColor: brandColor }}
                          >
                            {step.step}
                          </div>
                        </div>
                        <div className="flex-1 bg-[#fafafa] rounded-xl p-5 sm:p-6 border border-[#e5e7eb] shadow-sm">
                          <h3 className="font-bold text-[#1a1a1a] text-[18px] sm:text-[22px] mb-3">{step.title}</h3>
                          <div className="flex flex-wrap gap-2 sm:gap-3 mb-3">
                            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold" style={{ backgroundColor: brandColor + '12', color: brandColor }}>
                              <Clock className="h-3 w-3" />
                              {step.duration}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                              <Timer className="h-3 w-3" />
                              {step.effort}
                            </span>
                          </div>
                          <p className="text-sm text-[#6b7280] leading-relaxed">{step.description}</p>
                          {step.customer_action && (
                            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 mt-3 font-medium">
                              {tr.sections.processYourAction} {step.customer_action}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <CtaBlock
                    text={tr.sections.ctaAfterProcess}
                    derisking={tr.sections.ctaDeriskingProcess}
                    ctaName="after-process"
                  />
                </div>
              </section>

              {/* ===== 6. GUARANTEE - Dark Teal Card ===== */}
              <section className="fade-in-up bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                  <div
                    className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 text-center relative overflow-hidden"
                    style={{ backgroundColor: '#0a2e3d' }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${brandColor}, transparent)` }} />
                    <div className="relative z-10">
                      <div
                        className="h-14 w-14 sm:h-16 sm:w-16 rounded-full mx-auto mb-5 sm:mb-6 flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: brandColor, boxShadow: `0 0 40px ${brandColor}40` }}
                      >
                        <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <h2 className="text-[22px] sm:text-[28px] font-bold text-white mb-4">
                        {content.guarantee_title || tr.sections.guaranteeTitle}
                      </h2>
                      <p className="text-[#94a3b8] max-w-xl mx-auto leading-relaxed text-base sm:text-lg">
                        {renderBoldText(content.guarantee_text)}
                      </p>
                    </div>
                  </div>

                  <CtaBlock
                    text={tr.sections.ctaAfterGuarantee}
                    derisking={tr.sections.ctaDeriskingGuarantee}
                    ctaName="after-guarantee"
                  />
                </div>
              </section>

              {/* ===== 7. FAQ ACCORDION ===== */}
              {content.faq && content.faq.length > 0 && (
                <section className="fade-in-up bg-[#fafafa]">
                  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                    <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1a1a1a] text-center mb-8">
                      {tr.sections.faqTitle}
                    </h2>
                    <div className="space-y-3">
                      {content.faq.map((item, i) => (
                        <div key={i} className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden shadow-sm">
                          <button
                            onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                            className="w-full flex items-center justify-between p-5 text-left min-h-[48px]"
                          >
                            <span className="font-semibold text-[#1a1a1a] text-[15px] sm:text-base pr-4">{item.question}</span>
                            <ChevronDown
                              className={`h-5 w-5 text-[#6b7280] shrink-0 transition-transform duration-200 ${openFaqIndex === i ? 'rotate-180' : ''}`}
                            />
                          </button>
                          <div
                            className="overflow-hidden transition-all duration-200"
                            style={{ maxHeight: openFaqIndex === i ? '300px' : '0px' }}
                          >
                            <p className="px-5 pb-5 text-sm text-[#6b7280] leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* ===== 8. SOCIAL PROOF INLINE ===== */}
              {references.length > 0 && (
                <section className="fade-in-up bg-white">
                  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                    <div className="text-center mb-8">
                      <Star className="h-6 w-6 mx-auto mb-3" style={{ color: brandColor }} />
                      <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1a1a1a]">{tr.references.title}</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
                      {references.slice(0, 2).map((ref) => (
                        <div key={ref.id} className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5e7eb] shadow-sm">
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
                          className="text-sm font-medium hover:underline min-h-[44px]"
                          style={{ color: brandColor }}
                        >
                          {dealroom.language === 'de' ? 'Alle Referenzen ansehen →' : 'View all references →'}
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ===== 9. KPI NUMBERS ===== */}
              <section className="fade-in-up bg-[#fafafa]">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
                    <div>
                      <p className="text-3xl sm:text-4xl font-bold text-[#1a1a1a]">4.000+</p>
                      <p className="text-sm text-[#6b7280] mt-1">{tr.about.statCustomers}</p>
                    </div>
                    <div>
                      <p className="text-3xl sm:text-4xl font-bold text-[#1a1a1a]">50+</p>
                      <p className="text-sm text-[#6b7280] mt-1">{tr.about.statAwards}</p>
                    </div>
                    <div>
                      <p className="text-3xl sm:text-4xl font-bold text-[#1a1a1a]">25</p>
                      <p className="text-sm text-[#6b7280] mt-1">{tr.about.statYears}</p>
                    </div>
                    <div>
                      <p className="text-3xl sm:text-4xl font-bold text-[#1a1a1a]">8</p>
                      <p className="text-sm text-[#6b7280] mt-1">{tr.about.statLanguages}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ===== 10. ABOUT US with Bigger Marquee ===== */}
              <section className="fade-in-up bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                  <div className="rounded-2xl overflow-hidden border border-[#e5e7eb] shadow-sm bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Left: Info */}
                      <div className="p-6 sm:p-8 lg:p-10" style={{ backgroundColor: brandColor + '06' }}>
                        <h3 className="text-[18px] sm:text-[22px] font-bold text-[#1a1a1a] mb-4">
                          {tr.about.title}
                        </h3>
                        <p className="text-sm text-[#6b7280] leading-relaxed mb-6">
                          {tr.about.description}
                        </p>
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
                        </div>
                      </div>
                      {/* Right: Bigger Marquee (V5: h-[280px], w-[380px] per image) */}
                      <div className="p-4 sm:p-6 lg:p-8 flex items-center overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-white to-transparent z-10 lg:from-[#fafafa]" />
                        <div className="flex gap-4 animate-marquee">
                          {[...teamImages, ...teamImages].map((img, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={img.src}
                              alt={img.alt}
                              className="rounded-xl object-cover flex-shrink-0 h-[220px] sm:h-[280px] w-[300px] sm:w-[380px]"
                            />
                          ))}
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-l from-white to-transparent z-10 lg:from-[#fafafa]" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ===== 11. PARTNER LOGOS – Deep Teal Background ===== */}
              <section className="fade-in-up">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                  <div className="rounded-2xl py-8 px-6 sm:px-10" style={{ backgroundColor: '#11485e' }}>
                    <p className="text-center text-xs sm:text-sm font-medium text-white/60 uppercase tracking-wider mb-6">
                      {tr.sections.partnersTitle}
                    </p>
                    <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
                      {partnerLogos.map((logo, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={logo.src}
                          alt={logo.alt}
                          className="h-16 sm:h-20 object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 brightness-0 invert"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* ===== 12. FINAL CTA BLOCK ===== */}
              <section className="fade-in-up bg-[#fafafa]">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                  <div
                    className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 text-center relative overflow-hidden"
                    style={{ backgroundColor: brandColor }}
                  >
                    <div className="relative z-10">
                      <h2 className="text-[22px] sm:text-[28px] lg:text-[32px] font-bold text-white mb-3">
                        {tr.sections.finalCtaTitle}
                      </h2>
                      <p className="text-white/80 text-base sm:text-lg mb-8 max-w-lg mx-auto">
                        {tr.sections.finalCtaSubtitle}
                      </p>
                      <button
                        onClick={() => handleCta('final')}
                        className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 rounded-2xl bg-white font-semibold text-base sm:text-lg shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] min-h-[48px]"
                        style={{ color: brandColor }}
                      >
                        {content.cta_text || tr.sections.ctaDefault}
                        <ArrowRight className="h-5 w-5" />
                      </button>
                      <p className="text-white/60 text-sm mt-4">
                        {content.cta_derisking || tr.sections.ctaDerisking}
                      </p>
                      {contact && (
                        <div className="flex flex-wrap items-center justify-center gap-5 mt-6 text-sm text-white/80">
                          {contact.phone && (
                            <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors min-h-[44px]">
                              <Phone className="h-4 w-4" /> {contact.phone}
                            </a>
                          )}
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors min-h-[44px]">
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
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
            <div className="text-center mb-6 fade-in-up">
              <h3 className="text-[18px] sm:text-[22px] font-semibold text-[#1a1a1a] mb-1">
                {tr.offer.title}
              </h3>
              <p className="text-sm text-[#6b7280]">{tr.offer.subtitle}</p>
            </div>

            {dealroom.pandadoc_embed_url ? (
              <div className="fade-in-up rounded-2xl overflow-hidden border border-[#e5e7eb] shadow-sm" style={{ minHeight: '70vh' }}>
                <iframe
                  src={dealroom.pandadoc_embed_url}
                  className="w-full"
                  style={{ height: '80vh' }}
                  onLoad={() => trackEvent(dealroom.id, 'pandadoc_open')}
                />
              </div>
            ) : (
              <div className="text-center py-16 sm:py-20 bg-[#fafafa] rounded-2xl border-2 border-dashed border-[#e5e7eb]">
                <p className="text-[#6b7280]">{tr.offer.noPandadoc}</p>
              </div>
            )}

            {/* Questions? Contact block */}
            {contact && (
              <div className="text-center mt-8 fade-in-up">
                <p className="text-sm font-medium text-[#6b7280] mb-3">{tr.offer.questionsTitle}</p>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 font-medium hover:underline min-h-[44px]" style={{ color: brandColor }}>
                      <Phone className="h-4 w-4" /> {contact.phone}
                    </a>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 font-medium hover:underline min-h-[44px]" style={{ color: brandColor }}>
                      <Mail className="h-4 w-4" /> {contact.email}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* 3-Step Process Bar – BELOW contact */}
            <div className="fade-in-up mt-10">
              <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1a1a1a] text-center mb-6">
                {tr.offer.stepsTitle}
              </h2>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
                {[
                  { num: '1', label: tr.offer.step1, active: true },
                  { num: '2', label: tr.offer.step2, active: false },
                  { num: '3', label: tr.offer.step3, active: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{
                          backgroundColor: step.active ? brandColor : '#e5e7eb',
                          color: step.active ? 'white' : '#6b7280',
                        }}
                      >
                        {step.num}
                      </div>
                      <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${step.active ? 'text-[#1a1a1a]' : 'text-[#9ca3af]'}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < 2 && <ChevronRight className="h-4 w-4 text-[#d1d5db] shrink-0 hidden md:block" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== REFERENCES TAB - Split Layout ==================== */}
        <div className={activeTab === 'references' ? '' : 'hidden'}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
            <div className="text-center mb-8 sm:mb-10 fade-in-up">
              <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1a1a1a] mb-2">
                {tr.references.title}
              </h2>
              <p className="text-[#6b7280]">{tr.references.subtitle}</p>
            </div>
            {references.length === 0 ? (
              <div className="text-center py-8 sm:py-10 text-[#6b7280]">
                <Star className="h-12 w-12 mx-auto mb-4 text-[#d1d5db]" />
                <p>{dealroom.language === 'de' ? 'Referenzen werden in Kürze hinzugefügt.' : 'References will be added shortly.'}</p>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                {references.map((ref) => (
                  <div
                    key={ref.id}
                    className="fade-in-up rounded-2xl bg-white border border-[#e5e7eb] shadow-sm overflow-hidden"
                  >
                    <div className="flex flex-col-reverse lg:grid lg:grid-cols-2">
                      {/* Video or Image – on mobile below (via flex-col-reverse) */}
                      <div className="bg-[#fafafa] flex items-center justify-center min-h-[240px] sm:min-h-[280px]">
                        {ref.video_url ? (
                          <div className="w-full h-full">
                            <iframe
                              src={getVideoEmbedUrl(ref.video_url) || ''}
                              className="w-full h-full min-h-[240px] sm:min-h-[280px]"
                              allowFullScreen
                            />
                          </div>
                        ) : ref.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ref.image_url} alt={ref.client_company} className="w-full h-full object-cover min-h-[240px] sm:min-h-[280px]" />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8 text-center">
                            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold mb-3" style={{ backgroundColor: brandColor }}>
                              {ref.client_company.charAt(0)}
                            </div>
                            <p className="text-base sm:text-lg font-semibold text-[#1a1a1a]">{ref.client_company}</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Details */}
                      <div className="p-5 sm:p-6 lg:p-8 flex flex-col justify-center">
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

                        {ref.quote && (
                          <blockquote className="text-base sm:text-lg italic leading-relaxed pl-4 border-l-4 mb-5" style={{ borderColor: brandColor + '40', color: brandColor }}>
                            &ldquo;{ref.quote}&rdquo;
                          </blockquote>
                        )}

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
      <footer className="border-t border-[#e5e7eb] py-6 sm:py-8 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-[#6b7280]">
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
              <a href="tel:02261/5016320" className="hover:underline min-h-[44px] flex items-center">02261/5016320</a>
              <a href="mailto:info@guendesliundkollegen.de" className="hover:underline min-h-[44px] flex items-center">info@guendesliundkollegen.de</a>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-4 text-xs text-[#9ca3af]">
            <span>Bezirksdirektion der SIGNAL IDUNA Gruppe</span>
            <span className="hidden sm:inline">|</span>
            <a href="https://guendesliundkollegen.de/impressum" target="_blank" rel="noopener noreferrer" className="hover:underline min-h-[44px] flex items-center">
              {tr.footer.imprint}
            </a>
            <span className="hidden sm:inline">|</span>
            <a href="https://guendesliundkollegen.de/datenschutz" target="_blank" rel="noopener noreferrer" className="hover:underline min-h-[44px] flex items-center">
              {tr.footer.privacy}
            </a>
            <span className="hidden sm:inline">|</span>
            <button onClick={() => setShowCookieBanner(true)} className="hover:underline min-h-[44px]">
              Cookies
            </button>
          </div>
        </div>
      </footer>

      {/* V5: Sticky Mobile CTA (replaces old contact bar) */}
      <div
        className="fixed bottom-0 left-0 right-0 sm:hidden z-40 bg-white border-t border-[#e5e7eb] p-3 transition-transform"
        style={{ marginBottom: showCookieBanner ? '120px' : 0 }}
      >
        <button
          onClick={() => handleCta('sticky-mobile')}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-base shadow-lg min-h-[48px]"
          style={{ backgroundColor: brandColor }}
        >
          {dealroom.language === 'de' ? 'Angebot ansehen' : 'View Proposal'}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
