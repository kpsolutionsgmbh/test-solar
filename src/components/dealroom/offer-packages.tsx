'use client';

import { motion } from 'framer-motion';
import { Check, Star, Zap } from 'lucide-react';
import { SolarOffer } from '@/types/database';

interface OfferPackagesProps {
  offers: SolarOffer[];
  brandColor: string;
  language: 'de' | 'en';
  onSelect?: (offer: SolarOffer) => void;
}

export function OfferPackages({ offers, brandColor, language, onSelect }: OfferPackagesProps) {
  const t = language === 'de' ? {
    title: 'Unsere Angebote',
    subtitle: 'Wählen Sie das passende Paket für Ihre Bedürfnisse',
    recommended: 'Empfohlen',
    savingsYear: 'Ersparnis/Jahr',
    amortization: 'Amortisation',
    years: 'Jahre',
    select: 'Paket wählen',
    from: 'ab',
  } : {
    title: 'Our Offers',
    subtitle: 'Choose the right package for your needs',
    recommended: 'Recommended',
    savingsYear: 'Savings/year',
    amortization: 'Amortization',
    years: 'years',
    select: 'Select package',
    from: 'from',
  };

  if (!offers || offers.length === 0) return null;

  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-[#1a1a1a]">{t.title}</h3>
        <p className="text-sm text-[#6b7280] mt-2">{t.subtitle}</p>
      </div>

      <div className={`grid gap-5 ${offers.length === 3 ? 'grid-cols-1 md:grid-cols-3' : offers.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto' : 'max-w-md mx-auto'}`}>
        {offers.map((offer, i) => {
          const isRecommended = offer.is_recommended;

          return (
            <motion.div
              key={offer.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border-2 bg-white overflow-hidden transition-shadow hover:shadow-lg ${
                isRecommended ? 'shadow-md' : ''
              }`}
              style={{
                borderColor: isRecommended ? brandColor : '#e5e7eb',
              }}
            >
              {/* Recommended badge */}
              {isRecommended && (
                <div
                  className="absolute top-0 left-0 right-0 py-1.5 text-center text-xs font-bold text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  <Star className="inline h-3 w-3 mr-1 -mt-0.5" />
                  {t.recommended}
                </div>
              )}

              <div className={`p-6 ${isRecommended ? 'pt-10' : ''}`}>
                {/* Package name & description */}
                <h4 className="text-lg font-bold text-[#1a1a1a]">{offer.name}</h4>
                <p className="text-sm text-[#6b7280] mt-1 min-h-[40px]">{offer.description}</p>

                {/* Price */}
                <div className="mt-4 mb-5">
                  <span className="text-xs text-[#9ca3af] uppercase">{t.from}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold" style={{ color: isRecommended ? brandColor : '#1a1a1a' }}>
                      {offer.price.toLocaleString('de-DE')}
                    </span>
                    <span className="text-lg text-[#6b7280]">€</span>
                  </div>
                </div>

                {/* Savings & Amortization */}
                <div className="flex gap-3 mb-5">
                  <div className="flex-1 rounded-lg bg-[#f9fafb] p-2.5 text-center">
                    <p className="text-sm font-bold" style={{ color: brandColor }}>
                      {offer.savings_year.toLocaleString('de-DE')} €
                    </p>
                    <p className="text-[10px] text-[#6b7280]">{t.savingsYear}</p>
                  </div>
                  <div className="flex-1 rounded-lg bg-[#f9fafb] p-2.5 text-center">
                    <p className="text-sm font-bold text-[#1a1a1a]">
                      {offer.amortization_years} {t.years}
                    </p>
                    <p className="text-[10px] text-[#6b7280]">{t.amortization}</p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {offer.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-sm text-[#374151]">
                      <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: brandColor }} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => onSelect?.(offer)}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    isRecommended
                      ? 'text-white shadow-md hover:shadow-lg'
                      : 'border-2 hover:shadow-sm'
                  }`}
                  style={isRecommended
                    ? { backgroundColor: brandColor }
                    : { borderColor: brandColor, color: brandColor }
                  }
                >
                  <Zap className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                  {t.select}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
