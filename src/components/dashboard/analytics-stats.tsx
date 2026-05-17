"use client";

import { type ReactNode } from "react";
import { NumberTicker } from "@/components/magicui/number-ticker";

interface AnalyticsStatProps {
  icon: ReactNode;
  value: number;
  label: string;
  suffix?: string;
  delta?: number | null;
  highlight?: boolean;
}

function AnalyticsStat({
  icon,
  value,
  label,
  suffix = "",
  delta = null,
  highlight = false,
}: AnalyticsStatProps) {
  const deltaPositive = delta != null && delta > 0;
  const deltaNegative = delta != null && delta < 0;

  return (
    <div
      className={`rounded-lg border border-border bg-surface p-4 shadow-raised ${
        highlight ? "ring-1 ring-brand-500/30" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={highlight ? "text-brand-500" : "text-fg-subtle"}>{icon}</span>
        {delta != null && (
          <span
            className={`text-micro tabular-nums px-1.5 py-0.5 rounded ${
              deltaPositive
                ? "bg-success-bg text-success"
                : deltaNegative
                  ? "bg-danger-bg text-danger"
                  : "bg-surface-sub text-fg-subtle"
            }`}
          >
            {deltaPositive ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tabular-nums text-fg leading-none">
          <NumberTicker value={value} />
          {suffix}
        </div>
        <p className="text-micro uppercase text-fg-subtle mt-1.5">{label}</p>
      </div>
    </div>
  );
}

interface AnalyticsStatsGridProps {
  totalDealrooms: number;
  totalOpened: number;
  totalSigns: number;
  conversionRate: number;
  avgEngagement: number;
  recentOpens: number;
  recentOpensDelta: number | null;
}

export function AnalyticsStatsGrid({
  totalDealrooms,
  totalOpened,
  totalSigns,
  conversionRate,
  avgEngagement,
  recentOpens,
  recentOpensDelta,
}: AnalyticsStatsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
      <AnalyticsStat
        icon={
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        }
        value={totalDealrooms}
        label="Erstellt"
      />
      <AnalyticsStat
        icon={
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        }
        value={totalOpened}
        label="Geöffnet"
      />
      <AnalyticsStat
        icon={
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="m9 15 2 2 4-4" />
          </svg>
        }
        value={totalSigns}
        label="Signiert"
      />
      <AnalyticsStat
        icon={
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        }
        value={conversionRate}
        suffix="%"
        label="Conversion"
        highlight
      />
      <AnalyticsStat
        icon={
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
        }
        value={avgEngagement}
        label="Ø Engagement"
      />
      <AnalyticsStat
        icon={
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v16a2 2 0 0 0 2 2h16" />
            <path d="M7 16c.5-2 1.5-7 4-7 2 0 2 3 4 3 2.5 0 4.5-5 5-7" />
          </svg>
        }
        value={recentOpens}
        label="7 Tage"
        delta={recentOpensDelta}
      />
    </div>
  );
}
