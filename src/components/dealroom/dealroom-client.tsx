'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Dealroom, DealroomContent, TeamMember, VisualType, VisualData } from '@/types/database';
import { SolarCalculator } from '@/components/dealroom/solar-calculator';
import { OfferPackages } from '@/components/dealroom/offer-packages';
import { Translations } from '@/lib/i18n';
import { DEFAULT_GLOBAL_CONTENT, type ResolvedGlobalContent } from '@/lib/global-content-types';
import { initDealroomTracking, trackEvent } from '@/lib/tracking';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import {
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Award,
  Star,
  Play,
  Cookie,
  FileText,
  Download,
  ChevronDown,
  PenLine,
  Rocket,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { fireConfetti } from '@/components/magicui/confetti';

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;
  // Reject unrecognized URLs — only YouTube and Loom are allowed
  return null;
}

function getOutcomeText(outcome: string | { text: string; detail?: string }): string {
  return typeof outcome === 'string' ? outcome : outcome.text;
}

function getOutcomeDetail(outcome: string | { text: string; detail?: string }): string | undefined {
  return typeof outcome === 'string' ? undefined : outcome.detail;
}

function getOutcomeVisual(outcome: string | { text: string; visual_type?: VisualType; visual_data?: VisualData }): { visual_type?: VisualType; visual_data?: VisualData } {
  if (typeof outcome === 'string') return {};
  return { visual_type: outcome.visual_type, visual_data: outcome.visual_data };
}

// ==================== Animation Components ====================

function ScrollReveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedCounter({ from = 0, to, prefix = '', suffix = '', color = 'brand', brandColor }: { from?: number; to: number; prefix?: string; suffix?: string; color?: string; brandColor?: string }) {
  const textColor = color === 'red' ? 'text-red-400' : color === 'green' ? 'text-emerald-400' : '';

  return (
    <div className="text-center">
      <p className={`text-3xl sm:text-4xl font-bold tabular-nums leading-none ${textColor}`} style={!textColor ? { color: brandColor || '#E97E1C' } : undefined}>
        {prefix}
        <NumberTicker value={to} startValue={from} className={textColor} />
        {suffix}
      </p>
    </div>
  );
}

function ComparisonBar({ you, competitor, label }: { you: number; competitor: number; label: string }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });

  return (
    <div ref={ref} className="w-full space-y-2">
      <p className="text-xs text-[#d1d5db] text-center mb-2">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-red-400 w-12 text-right shrink-0">Sie</span>
          <div className="flex-1 h-5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-red-500 rounded-full"
              initial={{ width: 0 }}
              animate={inView ? { width: `${you}%` } : {}}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="text-xs text-red-400 w-8">{you}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-400 w-12 text-right shrink-0">Markt</span>
          <div className="flex-1 h-5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={inView ? { width: `${competitor}%` } : {}}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="text-xs text-emerald-400 w-8">{competitor}%</span>
        </div>
      </div>
    </div>
  );
}

function PercentageRing({ value, label, color = 'red' }: { value: number; label: string; color?: string }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });
  const size = 96;
  const radius = 40;
  const stroke = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeColor = color === 'red' ? '#ef4444' : '#22c55e';
  const textColor = color === 'red' ? 'text-red-400' : 'text-emerald-400';

  return (
    <div ref={ref} className="flex flex-col items-center gap-2.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 absolute inset-0">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={inView ? { strokeDashoffset: circumference - (value / 100) * circumference } : {}}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums leading-none ${textColor}`}
        >
          {value}%
        </span>
      </div>
      <p className="text-xs text-white/65 text-center max-w-[140px] leading-snug">{label}</p>
    </div>
  );
}

function PainVisual({ visual_type, visual_data }: { visual_type?: VisualType; visual_data?: VisualData }) {
  if (!visual_type || !visual_data) return null;

  switch (visual_type) {
    case 'counter_down':
      return (
        <AnimatedCounter
          from={visual_data.from || 0}
          to={visual_data.to || 0}
          suffix={visual_data.suffix || ''}
          prefix={visual_data.prefix || ''}
          color="red"
        />
      );
    case 'counter_up':
    case 'rising_number':
      return (
        <AnimatedCounter
          from={visual_data.from || 0}
          to={visual_data.value || visual_data.to || 0}
          prefix={visual_data.prefix || ''}
          suffix={visual_data.suffix || ''}
          color={visual_data.color || 'red'}
        />
      );
    case 'comparison_bar':
      return (
        <ComparisonBar
          you={visual_data.you || 0}
          competitor={visual_data.competitor || 0}
          label={visual_data.label || ''}
        />
      );
    case 'percentage_ring':
      return (
        <PercentageRing
          value={visual_data.value || 0}
          label={visual_data.label || ''}
          color={visual_data.color || 'red'}
        />
      );
    default:
      return null;
  }
}

// ==================== Benefit CountUp (parses value string) ====================

function BenefitValue({ value, brandColor }: { value: string; brandColor: string }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });

  // Try to parse numeric value from string like "€47.000", "32%", "~€12.000"
  const match = value.match(/^([~]?)([€$]?)([0-9.]+)([%+]?)(.*)/);
  if (!match) {
    return <p className="text-3xl sm:text-4xl font-bold" style={{ color: brandColor }}>{value}</p>;
  }

  const [, tilde, prefix, numStr, percentOrPlus, rest] = match;
  const num = parseFloat(numStr.replace('.', ''));
  if (isNaN(num)) {
    return <p className="text-3xl sm:text-4xl font-bold" style={{ color: brandColor }}>{value}</p>;
  }

  return (
    <div ref={ref}>
      <p className="text-3xl sm:text-4xl font-bold" style={{ color: brandColor }}>
        {tilde}{prefix}
        {inView ? <CountUp end={num} duration={2.5} separator="." /> : '0'}
        {percentOrPlus}{rest}
      </p>
    </div>
  );
}

// ==================== KPI CountUp ====================

// ==================== Main Component ====================

interface DealroomDocument {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
}

interface Props {
  dealroom: Dealroom;
  content: DealroomContent | null;
  admin: { name: string; avatar_url: string | null; company_name: string; company_logo_url: string | null; brand_color: string } | null;
  assignedMember: TeamMember | null;
  documents: DealroomDocument[];
  translations: Translations;
  globalContent?: ResolvedGlobalContent;
}

type TabKey = 'overview' | 'offer';

export function DealroomClient({ dealroom, content, admin, assignedMember, documents, translations: tr, globalContent }: Props) {
  const gc = globalContent || DEFAULT_GLOBAL_CONTENT;
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showCookieBanner, setShowCookieBanner] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const contact = assignedMember || (admin ? {
    name: admin.name,
    position: 'Geschäftsführer',
    email: 'info@solarheld.de',
    phone: '',
    avatar_url: admin.avatar_url,
  } : null);

  useEffect(() => {
    const cleanup = initDealroomTracking(dealroom.id);
    if (typeof window !== 'undefined' && localStorage.getItem('cookie_consent')) {
      setShowCookieBanner(false);
    }
    return cleanup;
  }, [dealroom.id]);

  // PandaDoc signing confetti celebration
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.event === 'session_view.document.completed' || event.data?.type === 'session_view.document.completed') {
        fireConfetti();
        trackEvent(dealroom.id, 'pandadoc_sign');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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

  const brandColor = admin?.brand_color || '#E97E1C';

  // Social proof element (reusable under CTAs)
  const SocialProof = ({ align = 'center' }: { align?: 'center' | 'left-md' }) => (
    <div className={`flex flex-col gap-1 mt-3 ${align === 'left-md' ? 'items-center md:items-start' : 'items-center'}`}>
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
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <span className="text-sm text-[#6b7280] font-medium">{gc.socialProof.customersLabel}</span>
    </div>
  );

  // Reusable CTA block with social proof
  const CtaBlock = ({ ctaName, className = '', align = 'center' }: { ctaName: string; className?: string; align?: 'center' | 'left-md' }) => {
    const leftMd = align === 'left-md';
    return (
      <div className={`py-6 ${leftMd ? 'text-center md:text-left' : 'text-center'} ${className}`}>
        <ShimmerButton
          onClick={() => handleCta(ctaName)}
          background={brandColor}
          shimmerColor="rgba(255,255,255,0.3)"
          className={`inline-flex items-center gap-3 min-h-[48px] ${leftMd ? 'mx-auto md:mx-0' : 'mx-auto'}`}
        >
          {dealroom.language === 'de' ? 'Jetzt Angebot ansehen' : 'View Proposal'}
          <ArrowRight className="h-5 w-5" />
        </ShimmerButton>
        <SocialProof align={align} />
      </div>
    );
  };

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
                href="https://solarheld.de/datenschutz"
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

      {/* Header */}
      <header className="border-b border-[#e5e7eb] bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center py-3 border-b border-[#f0f0f0]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-blue.svg" alt="Solarheld" className="h-6 object-contain" />
          </div>
          <nav className="flex items-center justify-center overflow-x-auto">
            {(['overview', 'offer'] as TabKey[]).map((tab) => (
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
              {/* ===== 1. HERO — Content left, video right on desktop. Mobile stacks. ===== */}
              <section className="relative bg-bg overflow-hidden">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-32 right-0 h-[600px] w-[600px] rounded-full blur-3xl opacity-40 animate-glow-pulse"
                  style={{ background: `radial-gradient(circle, ${brandColor}1f 0%, transparent 60%)` }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 right-20 h-[400px] w-[400px] rounded-full blur-3xl opacity-25"
                  style={{ background: `radial-gradient(circle, ${brandColor}1a 0%, transparent 65%)` }}
                />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 lg:pt-28 pb-12 sm:pb-16">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-8 lg:gap-y-8 lg:gap-x-12 items-start">
                    {/* Logo */}
                    {dealroom.client_logo_url && (
                      <div className="lg:col-span-7 lg:col-start-1 lg:row-start-1 text-center lg:text-left">
                        <ScrollReveal>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={dealroom.client_logo_url}
                            alt={dealroom.client_company}
                            className="h-10 sm:h-12 object-contain mx-auto lg:mx-0 lg:object-left grayscale opacity-70"
                          />
                        </ScrollReveal>
                      </div>
                    )}

                    {/* Headline + subtitle */}
                    <div className={`lg:col-span-7 lg:col-start-1 ${dealroom.client_logo_url ? 'lg:row-start-2' : 'lg:row-start-1'} text-center lg:text-left`}>
                      <ScrollReveal>
                        <h1 className="font-display text-[clamp(28px,4.5vw,48px)] leading-[1.1] tracking-[-0.025em] font-bold text-fg text-balance mb-5 sm:mb-6 max-w-[20ch] mx-auto lg:mx-0">
                          {content.hero_title}
                        </h1>
                        <p className="text-body-lg text-fg-muted text-pretty max-w-[55ch] mx-auto lg:mx-0">
                          {content.hero_subtitle}
                        </p>
                      </ScrollReveal>
                    </div>

                    {/* Video — mobile DOM order: between subtitle and CTA; desktop: right column spanning rows */}
                    {dealroom.video_url && (
                      <div className="lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-4">
                        <ScrollReveal delay={0.1}>
                          <figure>
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-sub border border-border shadow-floating">
                              <iframe
                                src={getVideoEmbedUrl(dealroom.video_url) || ''}
                                className="absolute inset-0 w-full h-full"
                                allowFullScreen
                                allow="autoplay; fullscreen"
                                onLoad={() => trackEvent(dealroom.id, 'video_play')}
                              />
                            </div>
                            <figcaption className="mt-3 text-body-sm text-fg-muted flex items-center justify-center lg:justify-start gap-2">
                              <Play className="h-3.5 w-3.5" style={{ color: brandColor }} aria-hidden="true" />
                              {dealroom.language === 'de'
                                ? `Persönliche Nachricht von ${contact?.name || 'Ihrem Berater'}`
                                : `Personal message from ${contact?.name || 'your advisor'}`}
                            </figcaption>
                          </figure>
                        </ScrollReveal>
                      </div>
                    )}

                    {/* CTA */}
                    <div className={`lg:col-span-7 lg:col-start-1 ${dealroom.client_logo_url ? 'lg:row-start-3' : 'lg:row-start-2'} text-center lg:text-left`}>
                      <ScrollReveal delay={0.15}>
                        <CtaBlock ctaName="hero" align="left-md" />
                      </ScrollReveal>
                    </div>

                      {/* Contact card */}
                      {contact && (
                        <ScrollReveal delay={0.25} className={`lg:col-span-7 lg:col-start-1 ${dealroom.client_logo_url ? 'lg:row-start-4' : 'lg:row-start-3'}`}>
                          <div className="rounded-xl p-5 sm:p-6 bg-surface border border-border shadow-raised text-left">
                            <p className="text-micro uppercase text-fg-subtle mb-4">
                              {tr.hero.by}
                            </p>
                            <div className="flex items-start gap-4">
                              <div
                                className="h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-semibold shrink-0 overflow-hidden"
                                style={{ backgroundColor: brandColor }}
                              >
                                {contact.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={contact.avatar_url}
                                    alt={contact.name}
                                    className="h-14 w-14 object-cover"
                                  />
                                ) : (
                                  contact.name.charAt(0)
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-body font-semibold text-fg leading-tight">
                                  {contact.name}
                                </p>
                                {contact.position && (
                                  <p className="text-body-sm text-fg-muted mt-0.5">
                                    {contact.position}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-body-sm">
                                  {contact.phone && (
                                    <a
                                      href={`tel:${contact.phone}`}
                                      className="inline-flex items-center gap-2 text-fg hover:text-brand-500 transition-colors duration-fast"
                                    >
                                      <Phone className="h-3.5 w-3.5 text-fg-subtle" aria-hidden="true" />
                                      {contact.phone}
                                    </a>
                                  )}
                                  {contact.email && (
                                    <a
                                      href={`mailto:${contact.email}`}
                                      className="inline-flex items-center gap-2 text-fg hover:text-brand-500 transition-colors duration-fast"
                                    >
                                      <Mail className="h-3.5 w-3.5 text-fg-subtle" aria-hidden="true" />
                                      <span className="truncate">{contact.email}</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </ScrollReveal>
                      )}
                  </div>
                </div>
              </section>

              {/* ===== Steps (global content) ===== */}
              <section className="bg-surface-sub border-y border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
                  <ScrollReveal>
                    <div className="max-w-2xl mb-12 sm:mb-16 text-center md:text-left mx-auto md:mx-0">
                      <p className="text-micro uppercase text-fg-subtle mb-3">
                        {gc.steps.kicker}
                      </p>
                      <h2 className="text-h1 font-bold text-fg text-balance">
                        {gc.steps.headline}
                      </h2>
                    </div>
                  </ScrollReveal>

                  <ol className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
                    {gc.steps.items.map((s, i) => {
                      const Icon = i === 0 ? Play : i === 1 ? FileText : PenLine;
                      return (
                        <ScrollReveal key={i} delay={i * 0.08}>
                          <li className="bg-surface p-6 sm:p-8 lg:p-10 h-full flex flex-col text-center md:text-left">
                            <div
                              className="h-12 w-12 rounded-full flex items-center justify-center mb-5 mx-auto md:mx-0"
                              style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                            >
                              <Icon className="h-6 w-6" />
                            </div>
                            <p className="text-micro uppercase font-semibold mb-2" style={{ color: brandColor }}>
                              {s.step}
                            </p>
                            <h3 className="text-h3 font-bold text-fg mb-3">{s.title}</h3>
                            <p className="text-body text-fg-muted text-pretty">{s.description}</p>
                          </li>
                        </ScrollReveal>
                      );
                    })}
                  </ol>
                </div>
              </section>

              {/* ===== 2. PAIN — dark container, centered header, 3-card grid ===== */}
              <section className="bg-bg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
                  <ScrollReveal>
                    <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-14 overflow-hidden bg-trust-deep text-white">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full blur-3xl opacity-20"
                        style={{ background: 'radial-gradient(circle, hsl(0 70% 50%) 0%, transparent 60%)' }}
                      />

                      {/* Centered header */}
                      <div className="relative text-center mb-10 sm:mb-14 max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-500/15 mb-5">
                          <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <h2 className="text-h2 sm:text-h1 font-bold text-white text-balance leading-[1.15] mb-3">
                          {content.cost_of_inaction.headline}
                        </h2>
                        <p className="text-body sm:text-body-lg text-white/65 text-pretty max-w-xl mx-auto">
                          {tr.sections.situationDescription}
                        </p>
                      </div>

                      {/* Pain cards — robust to variable count, 1 on mobile / 3 on lg */}
                      <div
                        className={`relative grid gap-4 sm:gap-5 ${
                          content.situation_points.length >= 3
                            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                            : content.situation_points.length === 2
                            ? 'grid-cols-1 md:grid-cols-2'
                            : 'grid-cols-1'
                        }`}
                      >
                        {content.situation_points.map((point, i) => (
                          <ScrollReveal key={i} delay={i * 0.08}>
                            <div className="h-full rounded-xl p-5 sm:p-6 border bg-white/[0.04] border-white/10 flex flex-col text-center sm:text-left">
                              {point.visual_type && point.visual_data ? (
                                <div className="mb-4 py-2 flex justify-center sm:justify-start">
                                  <PainVisual visual_type={point.visual_type} visual_data={point.visual_data} />
                                </div>
                              ) : (
                                <span className="text-h2 font-bold text-red-400/70 tabular-nums mb-4 leading-none">
                                  {String(i + 1).padStart(2, '0')}
                                </span>
                              )}
                              <h3 className="text-body sm:text-body-lg font-bold text-white mb-2 text-balance leading-snug">
                                {point.heading || point.text}
                              </h3>
                              {point.subtext && (
                                <p className="text-body-sm text-white/60 text-pretty">
                                  {point.subtext}
                                </p>
                              )}
                              {point.visual_data?.label &&
                                !point.subtext &&
                                point.visual_type !== 'comparison_bar' &&
                                point.visual_type !== 'percentage_ring' && (
                                  <p className="text-body-sm text-white/50 mt-1">
                                    {point.visual_data.label}
                                  </p>
                                )}
                            </div>
                          </ScrollReveal>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal delay={0.1}>
                    <div className="mt-10 sm:mt-12">
                      <CtaBlock ctaName="after-pain" />
                    </div>
                  </ScrollReveal>
                </div>
              </section>

              {/* ===== 3. DREAM OUTCOME — deep green-black, editorial cinematic ===== */}
              <section className="relative bg-[#04150c] text-white overflow-hidden">
                {/* Green atmospheric glows */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full blur-3xl opacity-25"
                  style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 60%)' }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full blur-3xl opacity-20"
                  style={{ background: 'radial-gradient(circle, #4ade80 0%, transparent 65%)' }}
                />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
                  <div className="max-w-3xl mb-12 sm:mb-16 text-center lg:text-left mx-auto lg:mx-0">
                    <ScrollReveal>
                      <p className="text-micro uppercase mb-4 inline-flex items-center gap-2 text-emerald-400/90">
                        <span className="h-px w-6 bg-current" />
                        {tr.sections.outcomeSubtitle}
                      </p>
                      <h2 className="text-h1 sm:text-display font-bold text-balance leading-[1.05]">
                        {tr.sections.outcomeTitle.replace('Sie', dealroom.client_company)}
                      </h2>
                    </ScrollReveal>
                  </div>

                  {/* Outcome cards — robust to variable count, clean glass-card style */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-12 sm:mb-16">
                    {content.outcome_vision.map((outcome, i) => {
                      const visual = getOutcomeVisual(outcome);
                      return (
                        <ScrollReveal key={i} delay={i * 0.08}>
                          <div className="h-full rounded-xl p-6 sm:p-7 bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col text-center sm:text-left">
                            <div className="mb-5 min-h-[96px] flex items-center justify-center sm:justify-start">
                              {visual.visual_type && visual.visual_data ? (
                                <PainVisual
                                  visual_type={visual.visual_type}
                                  visual_data={{ ...visual.visual_data, color: 'green' }}
                                />
                              ) : (
                                <CheckCircle2
                                  className="h-9 w-9 text-emerald-400"
                                  style={{ filter: 'drop-shadow(0 0 12px rgba(74,222,128,0.4))' }}
                                />
                              )}
                            </div>
                            <p className="text-h3 font-bold text-white text-balance mb-1">
                              {getOutcomeText(outcome)}
                            </p>
                            {getOutcomeDetail(outcome) && (
                              <p className="text-body-sm text-white/55 text-pretty mt-1">
                                {getOutcomeDetail(outcome)}
                              </p>
                            )}
                          </div>
                        </ScrollReveal>
                      );
                    })}
                  </div>

                  <ScrollReveal delay={0.1}>
                    <div className="mt-4 sm:mt-6">
                      <CtaBlock ctaName="after-outcome" />
                    </div>
                  </ScrollReveal>
                </div>
              </section>

              {/* ===== SOLAR PRODUCT OVERVIEW ===== */}
              <section className="bg-bg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
                  <ScrollReveal>
                    <div className="max-w-2xl mb-12 sm:mb-16 text-center md:text-left mx-auto md:mx-0">
                      <p className="text-micro uppercase text-fg-subtle mb-3">
                        {dealroom.language === 'de' ? 'Pakete' : 'Packages'}
                      </p>
                      <h2 className="text-h1 font-bold text-fg text-balance mb-4">
                        {dealroom.language === 'de' ? 'Drei Wege zu Ihrer Solaranlage' : 'Three paths to your solar system'}
                      </h2>
                      <p className="text-body-lg text-fg-muted text-pretty">
                        {dealroom.language === 'de'
                          ? 'Vom Einstieg bis zur Komplettlösung — wählen Sie, was zu Ihrem Zuhause passt.'
                          : 'From entry-level to complete solution — pick what fits your home.'}
                      </p>
                    </div>
                  </ScrollReveal>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                    {[
                      {
                        emoji: '\u2600\uFE0F',
                        name: 'Basis',
                        price: '6.900',
                        systemSize: '5 kWp',
                        storage: '5 kWh',
                        savings: '~1.300 €/Jahr',
                        benefits: [
                          dealroom.language === 'de' ? 'Hocheffiziente Solarmodule' : 'High-efficiency solar panels',
                          dealroom.language === 'de' ? 'Wechselrichter inkl.' : 'Inverter included',
                          dealroom.language === 'de' ? 'Montage & Installation' : 'Assembly & installation',
                          dealroom.language === 'de' ? '25 Jahre Garantie' : '25-year warranty',
                        ],
                        highlighted: false,
                      },
                      {
                        emoji: '\u26A1',
                        name: 'Comfort',
                        price: '11.500',
                        systemSize: '10 kWp',
                        storage: '10 kWh',
                        savings: '~2.000 €/Jahr',
                        badge: dealroom.language === 'de' ? 'Beliebt' : 'Popular',
                        benefits: [
                          dealroom.language === 'de' ? 'Premium Solarmodule' : 'Premium solar panels',
                          dealroom.language === 'de' ? 'Hybrid-Wechselrichter' : 'Hybrid inverter',
                          dealroom.language === 'de' ? 'Batteriespeicher 10 kWh' : '10 kWh battery storage',
                          dealroom.language === 'de' ? 'Smart-Home Integration' : 'Smart home integration',
                          dealroom.language === 'de' ? 'Montage & Installation' : 'Assembly & installation',
                        ],
                        highlighted: true,
                      },
                      {
                        emoji: '\uD83C\uDFC6',
                        name: 'Premium',
                        price: '17.500',
                        systemSize: '15 kWp',
                        storage: '15 kWh',
                        savings: '~2.500 €/Jahr',
                        benefits: [
                          dealroom.language === 'de' ? 'High-End Solarmodule' : 'High-end solar panels',
                          dealroom.language === 'de' ? 'Hybrid-Wechselrichter' : 'Hybrid inverter',
                          dealroom.language === 'de' ? 'Batteriespeicher 15 kWh' : '15 kWh battery storage',
                          dealroom.language === 'de' ? 'Wallbox f\u00FCr E-Auto' : 'EV charging wallbox',
                          dealroom.language === 'de' ? 'Energiemanagement-System' : 'Energy management system',
                        ],
                        highlighted: false,
                      },
                    ].map((pkg, i) => (
                      <ScrollReveal key={i} delay={i * 0.08}>
                        <article
                          className="relative h-full rounded-xl p-6 sm:p-7 lg:p-8 bg-surface border-2 flex flex-col text-center md:text-left shadow-raised hover:shadow-floating transition-shadow duration-base"
                          style={{
                            borderColor: pkg.highlighted ? brandColor : 'hsl(var(--border))',
                          }}
                        >
                          {pkg.badge && (
                            <span
                              className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center px-3 py-1 rounded-full text-micro uppercase font-medium text-white whitespace-nowrap"
                              style={{ backgroundColor: brandColor }}
                            >
                              {pkg.badge}
                            </span>
                          )}

                          <div className="text-4xl mb-3 leading-none" aria-hidden="true">
                            {pkg.emoji}
                          </div>

                          <header className="mb-5">
                            <p className="text-micro uppercase text-fg-subtle mb-2">
                              {pkg.name === 'Comfort'
                                ? (dealroom.language === 'de' ? 'Die Empfehlung' : 'The recommendation')
                                : pkg.name === 'Premium'
                                ? (dealroom.language === 'de' ? 'Die Komplettlösung' : 'The complete solution')
                                : (dealroom.language === 'de' ? 'Der Einstieg' : 'The entry')}
                            </p>
                            <h3 className="text-h2 font-bold text-fg mb-3">
                              {pkg.name}
                            </h3>
                            <p className="flex items-baseline gap-1.5 justify-center md:justify-start">
                              <span className="text-body-sm text-fg-subtle">Ab</span>
                              <span
                                className="font-display text-h1 font-bold tabular-nums"
                                style={{ color: brandColor }}
                              >
                                {pkg.price}
                              </span>
                              <span className="text-h3 font-medium text-fg-muted">{'€'}</span>
                            </p>
                          </header>

                          <dl className="grid grid-cols-3 gap-3 py-4 mb-5 border-y border-border">
                            <div>
                              <dt className="text-micro uppercase text-fg-subtle mb-1">
                                {dealroom.language === 'de' ? 'Anlage' : 'System'}
                              </dt>
                              <dd className="text-body-sm font-semibold tabular-nums text-fg">
                                {pkg.systemSize}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-micro uppercase text-fg-subtle mb-1">
                                {dealroom.language === 'de' ? 'Speicher' : 'Storage'}
                              </dt>
                              <dd className="text-body-sm font-semibold tabular-nums text-fg">
                                {pkg.storage}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-micro uppercase text-fg-subtle mb-1">
                                {dealroom.language === 'de' ? 'Ersparnis' : 'Savings'}
                              </dt>
                              <dd className="text-body-sm font-semibold tabular-nums text-success">
                                {pkg.savings}
                              </dd>
                            </div>
                          </dl>

                          <ul className="space-y-2.5 mb-6 flex-1 text-left">
                            {pkg.benefits.map((b, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-2.5 text-body-sm text-fg-muted"
                              >
                                <CheckCircle2
                                  className="h-4 w-4 shrink-0 mt-0.5"
                                  style={{ color: brandColor }}
                                  aria-hidden="true"
                                />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>

                          <button
                            onClick={() => handleCta(`product-${pkg.name.toLowerCase()}`)}
                            className={`group w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-md font-semibold text-body-sm transition-all duration-fast active:scale-[0.99] min-h-[48px] ${
                              pkg.highlighted
                                ? 'text-white hover:opacity-90'
                                : 'border-2 hover:bg-surface-sub'
                            }`}
                            style={
                              pkg.highlighted
                                ? { backgroundColor: brandColor }
                                : { borderColor: brandColor, color: brandColor }
                            }
                          >
                            <span>{dealroom.language === 'de' ? 'Angebot ansehen' : 'View offer'}</span>
                            <ArrowRight className="h-4 w-4 transition-transform duration-fast group-hover:translate-x-0.5" />
                          </button>
                        </article>
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              </section>

              {/* ===== SOLAR CALCULATOR — clean wrapper, tokens applied ===== */}
              <section className="bg-surface-sub border-y border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
                  <ScrollReveal>
                    <SolarCalculator
                      brandColor={brandColor}
                      customerType={dealroom.customer_type || 'private'}
                      language={dealroom.language}
                    />
                  </ScrollReveal>
                </div>
              </section>

              {/* ===== 4. CONCRETE BENEFITS — editorial numerals, no cards ===== */}
              {content.concrete_benefits && content.concrete_benefits.length > 0 && (
                <section className="bg-bg">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
                    <ScrollReveal>
                      <div className="max-w-2xl mb-12 sm:mb-16 text-center md:text-left mx-auto md:mx-0">
                        <p className="text-micro uppercase text-fg-subtle mb-3">
                          {dealroom.language === 'de' ? 'In Zahlen' : 'In numbers'}
                        </p>
                        <h2 className="text-h1 font-bold text-fg text-balance">
                          {tr.sections.concreteBenefitsTitle}
                        </h2>
                      </div>
                    </ScrollReveal>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-y border-border">
                      {content.concrete_benefits.map((benefit, i) => (
                        <ScrollReveal key={i} delay={i * 0.08}>
                          <div className="py-10 sm:py-12 sm:px-8 lg:px-10 text-center sm:text-left">
                            <BenefitValue value={benefit.value} brandColor={brandColor} />
                            <p className="text-h3 font-bold text-fg mt-4 mb-1 text-balance">{benefit.label}</p>
                            {benefit.detail && (
                              <p className="text-body-sm text-fg-muted text-pretty">{benefit.detail}</p>
                            )}
                          </div>
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* ===== ABOUT (global content) ===== */}
              <section className="bg-bg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                    <div className="lg:col-span-6 text-center lg:text-left">
                      <ScrollReveal>
                        <p className="text-micro uppercase text-fg-subtle mb-3">
                          {gc.about.kicker}
                        </p>
                        <h2 className="text-h1 font-bold text-fg text-balance mb-4 leading-[1.15]">
                          {gc.about.headline}
                        </h2>
                        <p className="text-body-lg text-fg-muted text-pretty max-w-[55ch] mx-auto lg:mx-0 mb-8">
                          {gc.about.subheadline}
                        </p>
                        <ul className="space-y-4 text-left max-w-xl mx-auto lg:mx-0">
                          {gc.about.bullets.map((bullet, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: brandColor }} aria-hidden="true" />
                              <div>
                                <p className="text-body font-semibold text-fg">{bullet.title}</p>
                                <p className="text-body-sm text-fg-muted">{bullet.detail}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </ScrollReveal>
                    </div>

                    <div className="lg:col-span-6">
                      <ScrollReveal delay={0.15}>
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-sub shadow-floating">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={gc.about.imageUrl}
                            alt={gc.about.headline}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </ScrollReveal>
                    </div>
                  </div>
                </div>
              </section>

              {/* ===== 5. FAQ — 2-col editorial on desktop, accordion robust to N items ===== */}
              {content.faq && content.faq.length > 0 && (
                <section className="bg-surface-sub border-y border-border">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
                      <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start text-center lg:text-left">
                        <ScrollReveal>
                          <p className="text-micro uppercase text-fg-subtle mb-3">
                            {dealroom.language === 'de' ? 'Häufige Fragen' : 'Common questions'}
                          </p>
                          <h2 className="text-h1 font-bold text-fg text-balance">
                            {tr.sections.faqTitle}
                          </h2>
                          <p className="text-body text-fg-muted mt-4 max-w-[40ch] mx-auto lg:mx-0">
                            {dealroom.language === 'de'
                              ? 'Noch Fragen? Wir haben die häufigsten direkt beantwortet.'
                              : 'Still have questions? We answered the most common ones here.'}
                          </p>
                        </ScrollReveal>
                      </div>
                      <div className="lg:col-span-8">
                        <ul className="divide-y divide-border border-y border-border">
                          {content.faq.map((item, i) => {
                            const open = openFaqIndex === i;
                            return (
                              <ScrollReveal key={i} delay={i * 0.03}>
                                <li>
                                  <button
                                    onClick={() => setOpenFaqIndex(open ? null : i)}
                                    className="group w-full flex items-start justify-between gap-6 py-6 sm:py-7 text-left min-h-[56px]"
                                    aria-expanded={open}
                                  >
                                    <span className="text-h3 font-bold text-fg text-balance pr-4">
                                      {item.question}
                                    </span>
                                    <ChevronDown
                                      className={`h-5 w-5 text-fg-subtle shrink-0 mt-1.5 transition-transform duration-base ease-standard ${open ? 'rotate-180' : ''}`}
                                      aria-hidden="true"
                                    />
                                  </button>
                                  <div
                                    className="grid transition-[grid-template-rows] duration-base ease-standard"
                                    style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
                                  >
                                    <div className="overflow-hidden">
                                      <p className="text-body text-fg-muted text-pretty pb-6 sm:pb-7 max-w-[65ch]">
                                        {item.answer}
                                      </p>
                                    </div>
                                  </div>
                                </li>
                              </ScrollReveal>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* ===== 10. FINAL CTA — centered, light surface, inviting ===== */}
              <section className="relative bg-surface-sub border-t border-border overflow-hidden">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 brand-glow-radial opacity-60"
                />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
                  <ScrollReveal>
                    <div className="max-w-3xl mx-auto text-center">
                      <h2 className="text-h1 sm:text-display font-bold text-fg text-balance leading-[1.05] mb-6">
                        {gc.finalCta.title}
                      </h2>
                      <p className="text-body-lg text-fg-muted text-pretty max-w-[55ch] mx-auto mb-10">
                        {gc.finalCta.subtitle}
                      </p>
                      <button
                        onClick={() => handleCta('final')}
                        className="group inline-flex items-center gap-3 px-7 sm:px-8 py-4 rounded-md text-white font-semibold text-body shadow-floating transition-all duration-fast hover:opacity-95 active:scale-[0.99] min-h-[52px]"
                        style={{ backgroundColor: brandColor }}
                      >
                        <span>{gc.finalCta.buttonLabel}</span>
                        <ArrowRight className="h-5 w-5 transition-transform duration-fast group-hover:translate-x-1" />
                      </button>
                      {contact && (
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-body-sm text-fg-muted pt-6 border-t border-border max-w-xl mx-auto">
                          {contact.phone && (
                            <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-2 hover:text-fg transition-colors duration-fast min-h-[44px]">
                              <Phone className="h-4 w-4 text-fg-subtle" aria-hidden="true" /> {contact.phone}
                            </a>
                          )}
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 hover:text-fg transition-colors duration-fast min-h-[44px]">
                              <Mail className="h-4 w-4 text-fg-subtle" aria-hidden="true" /> {contact.email}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollReveal>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* ==================== OFFER TAB ==================== */}
        <div className={activeTab === 'offer' ? '' : 'hidden'}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12">

            {/* Offer Packages */}
            {dealroom.offers_data?.offers && dealroom.offers_data.offers.length > 0 && (
              <section className="fade-in-up mb-12">
                <OfferPackages
                  offers={dealroom.offers_data.offers}
                  brandColor={brandColor}
                  language={dealroom.language}
                  onSelect={(offer) => trackEvent(dealroom.id, 'cta_click', { offer_name: offer.name, offer_price: offer.price })}
                />
              </section>
            )}

            {/* PandaDoc Embed */}
            <div className="text-center mb-6 fade-in-up">
              <h3 className="text-[18px] sm:text-[22px] font-bold text-[#1a1a1a] mb-1">
                {tr.offer.title}
              </h3>
              <p className="text-sm text-[#6b7280]">{tr.offer.subtitle}</p>
            </div>

            {dealroom.pandadoc_embed_url ? (
              <div className="fade-in-up rounded-2xl overflow-hidden border-2 shadow-sm" style={{ borderColor: brandColor + '30', minHeight: '70vh' }}>
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

            {/* 2. Documents */}
            {documents.length > 0 && (
              <div className="fade-in-up mt-8">
                <h3 className="text-[16px] font-bold text-[#1a1a1a] mb-4 text-center">Anhänge</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        trackEvent(dealroom.id, 'document_download', { document_id: doc.id, document_name: doc.name });
                        window.open(doc.file_url, '_blank');
                      }}
                      className="group flex flex-col items-center p-5 border border-[#e5e7eb] rounded-xl bg-white hover:border-[#cfdde3] hover:shadow-sm transition-all active:scale-[0.98] text-center w-full"
                    >
                      <div className="h-14 w-14 rounded-xl bg-red-50 flex items-center justify-center mb-3 group-hover:bg-red-100 transition-colors">
                        <FileText size={24} className="text-red-500" />
                      </div>
                      <p className="text-sm font-semibold text-[#1a1a1a] truncate w-full">
                        {doc.name.replace(/\.[^/.]+$/, '')}
                      </p>
                      <p className="text-xs text-[#6b7280] mt-1 flex items-center gap-1">
                        {doc.file_type?.includes('pdf') ? 'PDF' : doc.file_type?.split('/').pop()?.toUpperCase() || 'Datei'}
                        {doc.file_size ? ` · ${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
                        <Download size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Trust Badges */}
            <div className="fade-in-up mt-8 mb-4">
              <div className="flex items-center justify-center gap-6 sm:gap-8 flex-wrap">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${brandColor}15` }}>
                    <ShieldCheck className="h-6 w-6" style={{ color: brandColor }} />
                  </div>
                  <span className="text-[10px] text-[#6b7280] font-medium">TÜV-zertifiziert</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${brandColor}15` }}>
                    <Award className="h-6 w-6" style={{ color: brandColor }} />
                  </div>
                  <span className="text-[10px] text-[#6b7280] font-medium">Qualitätsgeprüft</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${brandColor}15` }}>
                    <Star className="h-6 w-6" style={{ color: brandColor }} />
                  </div>
                  <span className="text-[10px] text-[#6b7280] font-medium">Top-Bewertung</span>
                </div>
              </div>
              <SocialProof />
            </div>

            {/* 3. Contact card */}
            {contact && (
              <div className="fade-in-up mt-10">
                <p className="text-sm font-medium text-[#6b7280] text-center mb-4">{tr.offer.questionsTitle}</p>
                <div className="max-w-md mx-auto rounded-2xl border border-[#e5e7eb] bg-white shadow-sm p-5 flex items-center gap-4">
                  {contact.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={contact.avatar_url} alt={contact.name} className="h-14 w-14 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0" style={{ backgroundColor: brandColor }}>
                      {contact.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1a1a1a] text-sm sm:text-base">{contact.name}</p>
                    {contact.position && <p className="text-xs text-[#9ca3af]">{contact.position}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-sm">
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
                </div>
              </div>
            )}

            {/* 4. Post-Signature Flow */}
            <div className="fade-in-up mt-12">
              <h2 className="text-[20px] sm:text-[24px] font-bold text-[#1a1a1a] text-center mb-2">
                {dealroom.language === 'de' ? 'Was nach Ihrer Unterschrift passiert' : 'What happens after you sign'}
              </h2>
              <p className="text-sm text-[#6b7280] text-center mb-8">
                {dealroom.language === 'de' ? 'Drei einfache Schritte – wir kümmern uns um alles' : 'Three simple steps – we take care of everything'}
              </p>
              <div className="max-w-lg mx-auto space-y-6">
                {[
                  {
                    icon: Phone,
                    title: dealroom.language === 'de' ? 'Telefonisches Erstgespräch' : 'Initial phone call',
                    desc: dealroom.language === 'de'
                      ? `${contact?.name || 'Ihr Berater'} meldet sich innerhalb von 24 Stunden telefonisch bei Ihnen, um die nächsten Schritte zu besprechen.`
                      : `${contact?.name || 'Your advisor'} will call you within 24 hours to discuss next steps.`,
                  },
                  {
                    icon: Users,
                    title: dealroom.language === 'de' ? 'Feinabstimmung (15–30 Min.)' : 'Fine-tuning meeting (15–30 min)',
                    desc: dealroom.language === 'de'
                      ? `In einem kurzen Termin geht ${contact?.name || 'Ihr Berater'} alle Details mit Ihnen durch und passt alles genau an Ihre Situation an.`
                      : `In a short meeting, ${contact?.name || 'your advisor'} will go through all details and tailor everything to your situation.`,
                  },
                  {
                    icon: Rocket,
                    title: dealroom.language === 'de' ? 'Ihre Solaranlage geht ans Netz' : 'Your solar system goes live',
                    desc: dealroom.language === 'de'
                      ? 'Nach der Installation wird Ihre Anlage in Betrieb genommen – Sie produzieren ab sofort Ihren eigenen Strom.'
                      : 'After installation, your system goes live – you start producing your own electricity right away.',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: brandColor }}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      {i < 2 && <div className="w-px h-6 mt-1" style={{ backgroundColor: brandColor + '30' }} />}
                    </div>
                    <div className="pt-1">
                      <p className="font-semibold text-[#1a1a1a] text-sm sm:text-base">{item.title}</p>
                      <p className="text-sm text-[#6b7280] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>


          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#e5e7eb] py-6 sm:py-8 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-[#6b7280]">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo-blue.svg" alt="Solarheld" className="h-5 object-contain" />
              <span className="font-medium">{tr.footer.copyright}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-3 w-3" />
              <span>{tr.footer.address}</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="mailto:info@solarheld.de" className="hover:underline min-h-[44px] flex items-center">info@solarheld.de</a>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-4 text-xs text-[#9ca3af]">
            <a href="https://solarheld.de/impressum" target="_blank" rel="noopener noreferrer" className="hover:underline min-h-[44px] flex items-center">
              {tr.footer.imprint}
            </a>
            <span className="hidden sm:inline">|</span>
            <a href="https://solarheld.de/datenschutz" target="_blank" rel="noopener noreferrer" className="hover:underline min-h-[44px] flex items-center">
              {tr.footer.privacy}
            </a>
            <span className="hidden sm:inline">|</span>
            <button onClick={() => setShowCookieBanner(true)} className="hover:underline min-h-[44px]">
              Cookies
            </button>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 sm:hidden z-40 bg-white border-t border-[#e5e7eb] p-3 transition-transform"
        style={{ marginBottom: showCookieBanner ? '120px' : 0 }}
      >
        <button
          onClick={() => handleCta('sticky-mobile')}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-base shadow-lg min-h-[48px]"
          style={{ backgroundColor: brandColor }}
        >
          {dealroom.language === 'de' ? 'Jetzt Angebot ansehen' : 'View Proposal'}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
