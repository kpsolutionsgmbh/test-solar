'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Dealroom, DealroomContent, Reference, TeamMember, VisualType, VisualData } from '@/types/database';
import { Translations } from '@/lib/i18n';
import { initDealroomTracking, trackEvent } from '@/lib/tracking';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import {
  AlertTriangle,
  CheckCircle2,
  Shield,
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
  Lightbulb,
  ChevronDown,
  PenLine,
  Rocket,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { Marquee } from '@/components/magicui/marquee';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { DotPattern } from '@/components/magicui/dot-pattern';
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

function SectionDivider() {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="h-px w-16 bg-[#e5e7eb]" />
    </div>
  );
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
      <p className={`text-4xl sm:text-5xl font-bold ${textColor}`} style={!textColor ? { color: brandColor || '#11485e' } : undefined}>
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
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeColor = color === 'red' ? '#ef4444' : '#22c55e';

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
        <motion.circle
          cx="44" cy="44" r={radius} fill="none" stroke={strokeColor} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={inView ? { strokeDashoffset: circumference - (value / 100) * circumference } : {}}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <p className={`text-2xl font-bold ${color === 'red' ? 'text-red-400' : 'text-emerald-400'} -mt-[62px] mb-6`}>{value}%</p>
      <p className="text-xs text-[#d1d5db] text-center">{label}</p>
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

function KpiValue({ value, suffix = '' }: { value: number; suffix?: string }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });

  return (
    <div ref={ref}>
      <p className="text-3xl sm:text-4xl font-bold text-[#1a1a1a]">
        {inView ? <CountUp end={value} duration={2} separator="." /> : '0'}{suffix}
      </p>
    </div>
  );
}

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
  references: Reference[];
  documents: DealroomDocument[];
  translations: Translations;
}

type TabKey = 'overview' | 'offer' | 'references';

export function DealroomClient({ dealroom, content, admin, assignedMember, references, documents, translations: tr }: Props) {
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

  const brandColor = admin?.brand_color || '#11485e';

  // Social proof element (reusable under CTAs)
  const SocialProof = () => (
    <div className="flex flex-col items-center gap-1 mt-3">
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
      <span className="text-sm text-[#6b7280] font-medium">4.500+ {dealroom.language === 'de' ? 'zufriedene Kunden' : 'satisfied clients'}</span>
    </div>
  );

  // Reusable CTA block with social proof
  const CtaBlock = ({ derisking, ctaName, className = '' }: { derisking: string; ctaName: string; className?: string }) => (
    <div className={`text-center py-6 ${className}`}>
      <ShimmerButton
        onClick={() => handleCta(ctaName)}
        background={brandColor}
        shimmerColor="rgba(255,255,255,0.3)"
        className="inline-flex items-center gap-3 min-h-[48px] mx-auto"
      >
        {dealroom.language === 'de' ? 'Jetzt Angebot ansehen' : 'View Proposal'}
        <ArrowRight className="h-5 w-5" />
      </ShimmerButton>
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

      {/* Header */}
      <header className="border-b border-[#e5e7eb] bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center py-3 border-b border-[#f0f0f0]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-blue.svg" alt="Gündesli & Kollegen" className="h-6 object-contain" />
          </div>
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
              <section className="bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-6">
                  <ScrollReveal>
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
                      <h1 className="text-[28px] sm:text-[36px] font-bold text-[#1a1a1a] mb-4 leading-tight max-w-3xl mx-auto">
                        {content.hero_title}
                      </h1>
                      <p className="text-[15px] sm:text-[17px] text-[#6b7280] max-w-2xl mx-auto leading-relaxed">
                        {content.hero_subtitle}
                      </p>
                    </div>
                  </ScrollReveal>

                  {/* Video */}
                  {dealroom.video_url && (
                    <ScrollReveal delay={0.1}>
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Play className="h-5 w-5" style={{ color: brandColor }} />
                          <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1a1a1a]">
                            {tr.sections.videoTitle}
                          </h2>
                        </div>
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
                    </ScrollReveal>
                  )}

                  {/* First CTA */}
                  <ScrollReveal delay={0.15}>
                    <CtaBlock
                      derisking={content.cta_derisking || tr.sections.ctaDerisking}
                      ctaName="hero"
                    />
                  </ScrollReveal>

                  {/* Awards */}
                  <ScrollReveal delay={0.2}>
                    <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap mt-2 mb-8">
                      {/* eslint-disable @next/next/no-img-element */}
                      <img src="/images/awards/focus-money.webp" alt="Focus Money" className="h-16 sm:h-20 object-contain opacity-90" />
                      <img src="/images/awards/stiftung-warentest.webp" alt="Stiftung Warentest" className="h-16 sm:h-20 object-contain opacity-90" />
                      <img src="/images/awards/disq-rating.jpg" alt="DISQ Rating" className="h-16 sm:h-20 object-contain opacity-90" />
                      {/* eslint-enable @next/next/no-img-element */}
                    </div>
                  </ScrollReveal>

                  {/* Contact Person Card */}
                  {contact && (
                    <ScrollReveal delay={0.25}>
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
                    </ScrollReveal>
                  )}
                </div>
              </section>

              {/* ===== "So einfach geht's" – 3 steps ===== */}
              <section className="bg-[#fafafa] relative">
                <DotPattern
                  width={24}
                  height={24}
                  cr={0.8}
                  className="fill-neutral-300/30 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]"
                />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 relative z-10">
                  <ScrollReveal>
                    <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1a1a1a] text-center">
                      {dealroom.language === 'de' ? "So einfach geht's" : 'How it works'}
                    </h2>
                    <p className="text-base text-[#6b7280] text-center mt-2 mb-8">
                      {dealroom.language === 'de'
                        ? 'In drei Schritten von der Übersicht zur Zusammenarbeit'
                        : 'Three steps from overview to collaboration'}
                    </p>
                  </ScrollReveal>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                    {[
                      {
                        icon: <Play className="h-6 w-6" />,
                        step: dealroom.language === 'de' ? 'Schritt 1' : 'Step 1',
                        title: dealroom.language === 'de' ? 'Video anschauen' : 'Watch the video',
                        description: dealroom.language === 'de'
                          ? 'Ihr Ansprechpartner erklärt Ihnen persönlich, worum es geht und warum dieses Angebot zu Ihrer Situation passt.'
                          : 'Your contact person explains personally what it\'s about and why this offer fits your situation.',
                      },
                      {
                        icon: <FileText className="h-6 w-6" />,
                        step: dealroom.language === 'de' ? 'Schritt 2' : 'Step 2',
                        title: dealroom.language === 'de' ? 'Angebot durchlesen' : 'Review the proposal',
                        description: dealroom.language === 'de'
                          ? 'Prüfen Sie unser Angebot in Ruhe – alles transparent und individuell auf Sie zugeschnitten.'
                          : 'Review our proposal at your leisure – everything transparent and tailored to you.',
                      },
                      {
                        icon: <PenLine className="h-6 w-6" />,
                        step: dealroom.language === 'de' ? 'Schritt 3' : 'Step 3',
                        title: dealroom.language === 'de' ? 'Unterschreiben & starten' : 'Sign & get started',
                        description: dealroom.language === 'de'
                          ? 'Passt alles? Unterschreiben Sie digital und wir legen direkt los. Kein Papierkram, kein Warten.'
                          : 'Everything fits? Sign digitally and we get started right away. No paperwork, no waiting.',
                      },
                    ].map((s, i) => (
                      <ScrollReveal key={i} delay={i * 0.1}>
                        <div>
                          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 text-center">
                            <div
                              className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4"
                              style={{ backgroundColor: brandColor + '12', color: brandColor }}
                            >
                              {s.icon}
                            </div>
                            <p className="text-[13px] font-semibold mb-1" style={{ color: brandColor }}>{s.step}</p>
                            <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-2">{s.title}</h3>
                            <p className="text-sm text-[#6b7280] leading-relaxed">{s.description}</p>
                          </div>
                          {i < 2 && (
                            <div className="flex justify-center py-2 md:hidden">
                              <ChevronDown className="h-5 w-5 text-[#d1d5db]" />
                            </div>
                          )}
                        </div>
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              </section>

              {/* ===== 2. PAIN SECTION - Dark Red-Brown Container (LOUD) ===== */}
              <section className="bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                  <ScrollReveal>
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

                      {/* Pain Cards – 3 wide cards with animated visuals */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                        {content.situation_points.slice(0, 3).map((point, i) => (
                          <ScrollReveal key={i} delay={i * 0.1}>
                            <div
                              className="rounded-xl p-5 sm:p-6 border flex flex-col"
                              style={{ backgroundColor: '#3a1a1d', borderColor: 'rgba(255,100,100,0.15)' }}
                            >
                              {/* Animated Visual */}
                              {point.visual_type && point.visual_data ? (
                                <div className="mb-4 py-3">
                                  <PainVisual visual_type={point.visual_type} visual_data={point.visual_data} />
                                  {point.visual_data.label && point.visual_type !== 'comparison_bar' && point.visual_type !== 'percentage_ring' && (
                                    <p className="text-xs text-[#d1d5db] text-center mt-2">{point.visual_data.label}</p>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[36px] sm:text-[40px] mb-3 leading-none">
                                  {point.emoji || '⚠️'}
                                </div>
                              )}
                              <h3 className="text-white font-bold text-base sm:text-lg mb-2 leading-snug">
                                {point.heading || point.text}
                              </h3>
                              {point.subtext && (
                                <p className="text-[#d1d5db] text-sm leading-relaxed">
                                  {point.subtext}
                                </p>
                              )}
                            </div>
                          </ScrollReveal>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* CTA after Pain */}
                  <ScrollReveal delay={0.1}>
                    <CtaBlock
                      derisking={tr.sections.ctaDeriskingPain}
                      ctaName="after-pain"
                    />
                  </ScrollReveal>
                </div>
              </section>

              <SectionDivider />

              {/* ===== 3. DREAM OUTCOME - Green Gradient Card (LOUD) ===== */}
              <section className="bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                  <ScrollReveal>
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

                        {/* Outcome Fact Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                          {content.outcome_vision.slice(0, 3).map((outcome, i) => {
                            const visual = getOutcomeVisual(outcome);
                            return (
                              <ScrollReveal key={i} delay={i * 0.1}>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center border border-white/10">
                                  {/* Animated visual or checkmark */}
                                  {visual.visual_type && visual.visual_data ? (
                                    <div className="mb-3">
                                      <PainVisual
                                        visual_type={visual.visual_type}
                                        visual_data={{ ...visual.visual_data, color: 'green' }}
                                      />
                                    </div>
                                  ) : (
                                    <CheckCircle2 className="h-8 w-8 text-[#22c55e] mx-auto mb-3" style={{ filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.4))' }} />
                                  )}
                                  <p className="text-white font-semibold text-sm sm:text-base">{getOutcomeText(outcome)}</p>
                                  {getOutcomeDetail(outcome) && (
                                    <p className="text-white/50 text-xs mt-1">{getOutcomeDetail(outcome)}</p>
                                  )}
                                </div>
                              </ScrollReveal>
                            );
                          })}
                        </div>

                        {/* Vision Quote */}
                        {content.outcome_quote && (
                          <ScrollReveal delay={0.3}>
                            <div className="border-l-4 pl-5 py-2 rounded-r-lg" style={{ borderColor: '#22c55e', backgroundColor: 'rgba(74,222,128,0.08)' }}>
                              <p className="text-[#d1d5db] text-base sm:text-lg italic leading-relaxed">
                                &ldquo;{content.outcome_quote}&rdquo;
                              </p>
                            </div>
                          </ScrollReveal>
                        )}
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* CTA after Outcome */}
                  <ScrollReveal delay={0.1}>
                    <CtaBlock
                      derisking={tr.sections.ctaDeriskingOutcome}
                      ctaName="after-outcome"
                    />
                  </ScrollReveal>
                </div>
              </section>

              {/* ===== 4. CONCRETE BENEFITS - Animated Numbers (quiet) ===== */}
              {content.concrete_benefits && content.concrete_benefits.length > 0 && (
                <section className="bg-[#fafafa]">
                  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                    <ScrollReveal>
                      <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1a1a1a] text-center mb-10">
                        {tr.sections.concreteBenefitsTitle}
                      </h2>
                    </ScrollReveal>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {content.concrete_benefits.map((benefit, i) => (
                        <ScrollReveal key={i} delay={i * 0.1}>
                          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5e7eb] shadow-sm text-center">
                            <BenefitValue value={benefit.value} brandColor={brandColor} />
                            <p className="text-sm sm:text-base font-semibold text-[#1a1a1a] mb-1 mt-2">{benefit.label}</p>
                            {benefit.detail && (
                              <p className="text-xs text-[#6b7280]">{benefit.detail}</p>
                            )}
                          </div>
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* ===== 5. FAQ ACCORDION (quiet) ===== */}
              {content.faq && content.faq.length > 0 && (
                <section className="bg-[#fafafa]">
                  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                    <ScrollReveal>
                      <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1a1a1a] text-center mb-8">
                        {tr.sections.faqTitle}
                      </h2>
                    </ScrollReveal>
                    <div className="space-y-3">
                      {content.faq.map((item, i) => (
                        <ScrollReveal key={i} delay={i * 0.05}>
                          <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden shadow-sm">
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
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* ===== 6. SOCIAL PROOF INLINE (quiet) ===== */}
              {references.length > 0 && (
                <section className="bg-white">
                  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                    <ScrollReveal>
                      <div className="text-center mb-8">
                        <Star className="h-6 w-6 mx-auto mb-3" style={{ color: brandColor }} />
                        <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1a1a1a]">{tr.references.title}</h2>
                      </div>
                    </ScrollReveal>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
                      {references.slice(0, 4).map((ref, i) => (
                        <ScrollReveal key={ref.id} delay={i * 0.1}>
                          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5e7eb] shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                              {ref.logo_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={ref.logo_url} alt={ref.client_company} className="h-10 object-contain" />
                              )}
                              <div>
                                <p className="font-semibold text-[#1a1a1a] text-sm">{ref.client_company}</p>
                                <p className="text-xs text-[#6b7280]">{ref.client_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex">
                                {[...Array(5)].map((_, j) => (
                                  <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                              <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5">
                                <ShieldCheck className="h-3 w-3" /> Verifiziert
                              </span>
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
                        </ScrollReveal>
                      ))}
                    </div>
                    {references.length > 4 && (
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

              {/* ===== 7. KPI NUMBERS - Animated CountUp (quiet) ===== */}
              <section className="bg-[#fafafa]">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
                    {[
                      { value: 4000, suffix: '+', label: tr.about.statCustomers },
                      { value: 50, suffix: '+', label: tr.about.statAwards },
                      { value: 25, suffix: '', label: tr.about.statYears },
                      { value: 8, suffix: '', label: tr.about.statLanguages },
                    ].map((kpi, i) => (
                      <ScrollReveal key={i} delay={i * 0.1}>
                        <div>
                          <KpiValue value={kpi.value} suffix={kpi.suffix} />
                          <p className="text-sm text-[#6b7280] mt-1">{kpi.label}</p>
                        </div>
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              </section>

              <SectionDivider />

              {/* ===== 8. ABOUT US with Marquee (quiet) ===== */}
              <section className="bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                  <ScrollReveal>
                    <div className="rounded-2xl overflow-hidden border border-[#e5e7eb] shadow-sm bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-2">
                        <div className="p-6 sm:p-8 lg:p-10" style={{ backgroundColor: brandColor + '06' }}>
                          <h3 className="text-[18px] sm:text-[22px] font-bold text-[#1a1a1a] mb-4">
                            {tr.about.title}
                          </h3>
                          <p className="text-sm text-[#6b7280] leading-relaxed mb-6">
                            {tr.about.description}
                          </p>
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
                  </ScrollReveal>
                </div>
              </section>

              <SectionDivider />

              {/* ===== 9. PARTNER LOGOS (Marquee) ===== */}
              <section>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                  <ScrollReveal>
                    <div className="rounded-2xl py-8 px-6 sm:px-10 overflow-hidden" style={{ backgroundColor: '#11485e' }}>
                      <p className="text-center text-xs sm:text-sm font-medium text-white/60 uppercase tracking-wider mb-6">
                        {tr.sections.partnersTitle}
                      </p>
                      <Marquee pauseOnHover className="[--duration:25s]">
                        {partnerLogos.map((logo, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={logo.src}
                            alt={logo.alt}
                            className="h-16 sm:h-20 object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 brightness-0 invert mx-6"
                          />
                        ))}
                      </Marquee>
                    </div>
                  </ScrollReveal>
                </div>
              </section>

              {/* ===== 10. FINAL CTA BLOCK (LOUD) ===== */}
              <section className="bg-[#fafafa]">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                  <ScrollReveal>
                    <div
                      className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 text-center relative overflow-hidden"
                      style={{ backgroundColor: brandColor }}
                    >
                      <DotPattern
                        width={20}
                        height={20}
                        cr={1.2}
                        className="fill-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]"
                      />
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
                          {dealroom.language === 'de' ? 'Jetzt Angebot ansehen' : 'View Proposal'}
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
                  </ScrollReveal>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* ==================== OFFER TAB ==================== */}
        <div className={activeTab === 'offer' ? '' : 'hidden'}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12">

            {/* 1. PandaDoc Embed */}
            <div className="text-center mb-6 fade-in-up">
              <h3 className="text-[18px] sm:text-[22px] font-semibold text-[#1a1a1a] mb-1">
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
                <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-4 text-center">Anhänge</h3>
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

            {/* 3. Awards + Social Proof */}
            <div className="fade-in-up mt-8 mb-4">
              <div className="flex items-center justify-center gap-5 sm:gap-7 flex-wrap">
                {/* eslint-disable @next/next/no-img-element */}
                <img src="/images/awards/disq-rating.jpg" alt="DISQ Preisträger" className="h-14 sm:h-16 object-contain" />
                <img src="/images/awards/focus-money.webp" alt="Focus Money" className="h-14 sm:h-16 object-contain" />
                <img src="/images/awards/stiftung-warentest.webp" alt="Stiftung Warentest" className="h-14 sm:h-16 object-contain" />
                {/* eslint-enable @next/next/no-img-element */}
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
                    title: dealroom.language === 'de' ? 'Versicherungsschutz startet' : 'Coverage begins',
                    desc: dealroom.language === 'de'
                      ? 'Ihr individueller Versicherungsschutz tritt in Kraft – Sie sind ab sofort bestens abgesichert.'
                      : 'Your individual insurance coverage takes effect – you are fully protected from now on.',
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

            {/* 5. Partner Logos (Marquee) */}
            {partnerLogos.length > 0 && (
              <div className="fade-in-up mt-12">
                <div className="rounded-2xl py-8 px-6 sm:px-10 overflow-hidden" style={{ backgroundColor: '#11485e' }}>
                  <p className="text-center text-xs sm:text-sm font-medium text-white/60 uppercase tracking-wider mb-6">
                    {tr.sections.partnersTitle}
                  </p>
                  <Marquee pauseOnHover className="[--duration:25s]">
                    {partnerLogos.map((logo, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={logo.src} alt={logo.alt} className="h-16 sm:h-20 object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 brightness-0 invert mx-6" />
                    ))}
                  </Marquee>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ==================== REFERENCES TAB ==================== */}
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
                            <p className="text-base sm:text-lg font-semibold text-[#1a1a1a]">{ref.client_company}</p>
                          </div>
                        )}
                      </div>

                      <div className="p-5 sm:p-6 lg:p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-3">
                          {ref.logo_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ref.logo_url} alt={ref.client_company} className="h-10 object-contain" />
                          )}
                          <div>
                            <p className="font-bold text-[#1a1a1a]">{ref.client_company}</p>
                            <p className="text-sm text-[#6b7280]">{ref.client_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                            <ShieldCheck className="h-3.5 w-3.5" /> Verifiziert
                          </span>
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
