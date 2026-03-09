'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingDown, Leaf, PiggyBank, Sun, Battery } from 'lucide-react';

interface SolarCalculatorProps {
  brandColor: string;
  customerType: 'private' | 'commercial';
  language: 'de' | 'en';
  onCalculated?: (data: CalculatorResult) => void;
}

interface CalculatorResult {
  annual_consumption_kwh: number;
  electricity_price: number;
  system_size_kwp: number;
  storage_kwh: number;
  annual_savings: number;
  amortization_years: number;
  co2_savings_tons: number;
  lifetime_savings: number;
}

// Solar calculation constants
const YIELD_PER_KWP = 950; // kWh per kWp per year (German average)
const SELF_CONSUMPTION_RATE = 0.30; // without storage
const SELF_CONSUMPTION_WITH_STORAGE = 0.70; // with storage
const FEED_IN_TARIFF = 0.08; // €/kWh feed-in (2025/2026)
const CO2_PER_KWH = 0.4; // kg CO2 per kWh from grid
const SYSTEM_LIFETIME = 25; // years
const COST_PER_KWP = 1400; // € per kWp installed
const COST_PER_KWH_STORAGE = 800; // € per kWh storage

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  icon: Icon,
  brandColor,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  icon: React.ElementType;
  brandColor: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-[#374151]">
          <Icon className="h-4 w-4" style={{ color: brandColor }} />
          {label}
        </label>
        <span className="text-sm font-bold tabular-nums" style={{ color: brandColor }}>
          {value.toLocaleString('de-DE')} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${brandColor} 0%, ${brandColor} ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-[#9ca3af]">
        <span>{min.toLocaleString('de-DE')} {unit}</span>
        <span>{max.toLocaleString('de-DE')} {unit}</span>
      </div>
    </div>
  );
}

function ResultCard({
  icon: Icon,
  label,
  value,
  unit,
  highlight,
  highlightGreen,
  brandColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
  highlightGreen?: boolean;
  brandColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 text-center"
      style={{
        backgroundColor: highlightGreen ? 'rgba(34,197,94,0.08)' : highlight ? `${brandColor}10` : '#f9fafb',
        outline: highlightGreen ? '2px solid #22c55e' : highlight ? `2px solid ${brandColor}` : undefined,
        outlineOffset: (highlight || highlightGreen) ? '-2px' : undefined,
      }}
    >
      <Icon className="h-5 w-5 mx-auto mb-2" style={{ color: highlightGreen ? '#22c55e' : brandColor }} />
      <p className={`font-bold tabular-nums ${highlightGreen ? 'text-3xl sm:text-4xl text-emerald-500' : 'text-2xl text-[#1a1a1a]'}`}>{value}</p>
      <p className="text-[10px] text-[#6b7280] uppercase tracking-wide">{unit}</p>
      <p className="text-xs text-[#6b7280] mt-1">{label}</p>
    </motion.div>
  );
}

export function SolarCalculator({ brandColor, customerType, language, onCalculated }: SolarCalculatorProps) {
  const isPrivate = customerType === 'private';
  const t = language === 'de' ? {
    title: 'Solar-Rechner',
    subtitle: 'Berechnen Sie Ihr Einsparpotenzial',
    consumption: 'Jahresverbrauch',
    price: 'Strompreis',
    systemSize: 'Anlagengröße',
    storage: 'Speichergröße',
    annualSavings: 'Jährl. Ersparnis',
    amortization: 'Amortisation',
    co2: 'CO₂-Einsparung',
    lifetime: 'Ersparnis 25 Jahre',
    perYear: '/Jahr',
    years: 'Jahre',
    tons: 't/Jahr',
    total: 'Gesamt',
  } : {
    title: 'Solar Calculator',
    subtitle: 'Calculate your savings potential',
    consumption: 'Annual consumption',
    price: 'Electricity price',
    systemSize: 'System size',
    storage: 'Storage size',
    annualSavings: 'Annual savings',
    amortization: 'Amortization',
    co2: 'CO₂ savings',
    lifetime: '25-year savings',
    perYear: '/year',
    years: 'years',
    tons: 't/year',
    total: 'total',
  };

  const [consumption, setConsumption] = useState(isPrivate ? 4500 : 20000);
  const [electricityPrice, setElectricityPrice] = useState(isPrivate ? 0.37 : 0.30);
  const [systemSize, setSystemSize] = useState(isPrivate ? 10 : 30);
  const [storage, setStorage] = useState(isPrivate ? 10 : 0);

  const result = useMemo<CalculatorResult>(() => {
    const annualProduction = systemSize * YIELD_PER_KWP;
    const selfConsumptionRate = storage > 0 ? SELF_CONSUMPTION_WITH_STORAGE : SELF_CONSUMPTION_RATE;
    const selfConsumed = Math.min(annualProduction * selfConsumptionRate, consumption);
    const feedIn = annualProduction - selfConsumed;

    const savingsFromSelfConsumption = selfConsumed * electricityPrice;
    const savingsFromFeedIn = feedIn * FEED_IN_TARIFF;
    const annualSavings = savingsFromSelfConsumption + savingsFromFeedIn;

    const systemCost = (systemSize * COST_PER_KWP) + (storage * COST_PER_KWH_STORAGE);
    const amortizationYears = annualSavings > 0 ? Math.round((systemCost / annualSavings) * 10) / 10 : 0;

    const co2Savings = (selfConsumed * CO2_PER_KWH) / 1000; // tons
    const lifetimeSavings = annualSavings * SYSTEM_LIFETIME - systemCost;

    const data: CalculatorResult = {
      annual_consumption_kwh: consumption,
      electricity_price: electricityPrice,
      system_size_kwp: systemSize,
      storage_kwh: storage,
      annual_savings: Math.round(annualSavings),
      amortization_years: amortizationYears,
      co2_savings_tons: Math.round(co2Savings * 10) / 10,
      lifetime_savings: Math.round(lifetimeSavings),
    };

    onCalculated?.(data);
    return data;
  }, [consumption, electricityPrice, systemSize, storage, onCalculated]);

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#e5e7eb]" style={{ backgroundColor: `${brandColor}08` }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${brandColor}15` }}>
            <Sun className="h-5 w-5" style={{ color: brandColor }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1a1a1a]">{t.title}</h3>
            <p className="text-sm text-[#6b7280]">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className="px-6 py-6 space-y-6">
        <SliderInput
          label={t.consumption}
          value={consumption}
          min={isPrivate ? 1500 : 5000}
          max={isPrivate ? 12000 : 100000}
          step={isPrivate ? 500 : 5000}
          unit="kWh"
          icon={Zap}
          brandColor={brandColor}
          onChange={setConsumption}
        />
        <SliderInput
          label={t.price}
          value={electricityPrice}
          min={0.20}
          max={0.50}
          step={0.01}
          unit="€/kWh"
          icon={TrendingDown}
          brandColor={brandColor}
          onChange={setElectricityPrice}
        />
        <SliderInput
          label={t.systemSize}
          value={systemSize}
          min={isPrivate ? 3 : 10}
          max={isPrivate ? 20 : 100}
          step={isPrivate ? 1 : 5}
          unit="kWp"
          icon={Sun}
          brandColor={brandColor}
          onChange={setSystemSize}
        />
        <SliderInput
          label={t.storage}
          value={storage}
          min={0}
          max={isPrivate ? 20 : 50}
          step={isPrivate ? 1 : 5}
          unit="kWh"
          icon={Battery}
          brandColor={brandColor}
          onChange={setStorage}
        />
      </div>

      {/* Results */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ResultCard
            icon={PiggyBank}
            label={t.annualSavings}
            value={`${result.annual_savings.toLocaleString('de-DE')} €`}
            unit={t.perYear}
            highlightGreen
            brandColor={brandColor}
          />
          <ResultCard
            icon={TrendingDown}
            label={t.amortization}
            value={result.amortization_years.toLocaleString('de-DE')}
            unit={t.years}
            brandColor={brandColor}
          />
          <ResultCard
            icon={Leaf}
            label={t.co2}
            value={result.co2_savings_tons.toLocaleString('de-DE')}
            unit={t.tons}
            brandColor={brandColor}
          />
          <ResultCard
            icon={PiggyBank}
            label={t.lifetime}
            value={`${(result.lifetime_savings / 1000).toFixed(0)}k €`}
            unit={t.total}
            highlightGreen
            brandColor={brandColor}
          />
        </div>
      </div>
    </div>
  );
}
