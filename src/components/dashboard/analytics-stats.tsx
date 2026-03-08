"use client";

import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";

interface AnalyticsStatProps {
  icon: ReactNode;
  value: number;
  label: string;
  highlight?: boolean;
  beamColorFrom?: string;
  beamColorTo?: string;
}

function AnalyticsStat({
  icon,
  value,
  label,
  highlight = false,
  beamColorFrom = "#11485e",
  beamColorTo = "#3b82f6",
}: AnalyticsStatProps) {
  return (
    <Card
      className={`relative overflow-hidden border-none shadow-sm ${
        highlight ? "bg-gradient-to-br from-[#11485e]/5 to-[#11485e]/10" : ""
      }`}
    >
      <CardContent className="pt-4 pb-3 text-center">
        {icon}
        <div className={`text-2xl font-bold ${highlight ? "text-[#11485e]" : "text-[#1a1a1a]"}`}>
          <NumberTicker value={value} />
        </div>
        <p className="text-[10px] text-[#6b7280] uppercase tracking-wide">
          {label}
        </p>
      </CardContent>
      <BorderBeam
        size={40}
        duration={10}
        colorFrom={beamColorFrom}
        colorTo={beamColorTo}
        borderWidth={1}
      />
    </Card>
  );
}

interface AnalyticsStatsGridProps {
  totalViews: number;
  uniqueSessions: number;
  totalVideoPlays: number;
  totalCtaClicks: number;
  totalSigns: number;
  recentViews: number;
}

export function AnalyticsStatsGrid({
  totalViews,
  uniqueSessions,
  totalVideoPlays,
  totalCtaClicks,
  totalSigns,
  recentViews,
}: AnalyticsStatsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      <AnalyticsStat
        icon={<svg className="h-5 w-5 text-[#11485e] mx-auto mb-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>}
        value={totalViews}
        label="Seitenaufrufe"
        beamColorFrom="#11485e"
        beamColorTo="#22c55e"
      />
      <AnalyticsStat
        icon={<svg className="h-5 w-5 text-blue-600 mx-auto mb-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        value={uniqueSessions}
        label="Sessions"
        beamColorFrom="#3b82f6"
        beamColorTo="#6366f1"
      />
      <AnalyticsStat
        icon={<svg className="h-5 w-5 text-purple-600 mx-auto mb-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>}
        value={totalVideoPlays}
        label="Video-Plays"
        beamColorFrom="#9333ea"
        beamColorTo="#a855f7"
      />
      <AnalyticsStat
        icon={<svg className="h-5 w-5 text-amber-600 mx-auto mb-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"/><path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-.8"/><path d="m6 12-1.8 2"/><path d="M7.2 2.2 8 5.1"/><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"/></svg>}
        value={totalCtaClicks}
        label="CTA-Klicks"
        beamColorFrom="#f59e0b"
        beamColorTo="#fbbf24"
      />
      <AnalyticsStat
        icon={<svg className="h-5 w-5 text-emerald-600 mx-auto mb-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8.8 13.1 11 16l-2.3 2.9"/><path d="M15.2 13.1 13 16l2.3 2.9"/></svg>}
        value={totalSigns}
        label="Unterschriften"
        beamColorFrom="#22c55e"
        beamColorTo="#10b981"
      />
      <AnalyticsStat
        icon={<svg className="h-5 w-5 text-[#11485e] mx-auto mb-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
        value={recentViews}
        label="Letzte 7 Tage"
        highlight
        beamColorFrom="#11485e"
        beamColorTo="#3b82f6"
      />
    </div>
  );
}
