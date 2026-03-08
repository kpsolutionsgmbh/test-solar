"use client";

import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { NumberTicker } from "@/components/magicui/number-ticker";

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  gradient: string;
  textColor: string;
}

function StatCard({
  label,
  value,
  icon,
  gradient,
  textColor,
}: StatCardProps) {
  return (
    <Card className={`border-none shadow-sm ${gradient}`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">
              {label}
            </p>
            <div className={`text-3xl font-bold mt-1 ${textColor}`}>
              <NumberTicker value={value} />
            </div>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsGridProps {
  total: number;
  published: number;
  drafts: number;
  interactions: number;
}

export function StatsGrid({ total, published, drafts, interactions }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        label="Gesamt"
        value={total}
        icon={
          <div className="h-10 w-10 rounded-xl bg-[#11485e]/10 flex items-center justify-center">
            <svg className="h-5 w-5 text-[#11485e]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
          </div>
        }
        gradient="bg-gradient-to-br from-[#11485e]/5 to-[#11485e]/10"
        textColor="text-[#11485e]"
      />
      <StatCard
        label="Live"
        value={published}
        icon={
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <svg className="h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>
          </div>
        }
        gradient="bg-gradient-to-br from-emerald-50 to-emerald-100/50"
        textColor="text-emerald-700"
      />
      <StatCard
        label="Entwürfe"
        value={drafts}
        icon={
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <svg className="h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m14.5 12.5-5 5"/><path d="m9.5 12.5 5 5"/></svg>
          </div>
        }
        gradient="bg-gradient-to-br from-amber-50 to-amber-100/50"
        textColor="text-amber-700"
      />
      <StatCard
        label="Interaktionen"
        value={interactions}
        icon={
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
        }
        gradient="bg-gradient-to-br from-blue-50 to-blue-100/50"
        textColor="text-blue-700"
      />
    </div>
  );
}
