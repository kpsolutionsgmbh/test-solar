'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dealroom } from '@/types/database';
import {
  Eye,
  Clock,
  ArrowUpRight,
  FileX,
  PlusCircle,
  Search,
  Building2,
  ArrowDownUp,
  LayoutGrid,
  List,
} from 'lucide-react';
import { EngagementScore } from '@/components/dashboard/engagement-score';

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  draft: { label: 'Entwurf', color: 'bg-[#fafafa] text-[#6b7280] border-[#e5e7eb]', dotColor: 'bg-[#6b7280]' },
  published: { label: 'Live', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
  signed: { label: 'Signiert', color: 'bg-[#FEF3E2] text-[#E97E1C] border-[#FDE5C8]', dotColor: 'bg-[#E97E1C]' },
  inactive: { label: 'Inaktiv', color: 'bg-amber-50 text-amber-700 border-amber-200', dotColor: 'bg-amber-500' },
  archived: { label: 'Archiviert', color: 'bg-[#fafafa] text-[#6b7280] border-[#e5e7eb]', dotColor: 'bg-[#6b7280]' },
};

const statusFilterOptions = [
  { value: 'all', label: 'Alle' },
  { value: 'published', label: 'Live' },
  { value: 'draft', label: 'Entwürfe' },
  { value: 'signed', label: 'Signiert' },
  { value: 'inactive', label: 'Inaktiv' },
  { value: 'archived', label: 'Archiviert' },
];

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Gerade eben';
  if (diffMins < 60) return `vor ${diffMins} Min.`;
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  return date.toLocaleDateString('de-DE');
}

type SortOption = 'updated_at' | 'engagement_score' | 'created_at';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'updated_at', label: 'Letzte Aktivität' },
  { value: 'engagement_score', label: 'Engagement Score' },
  { value: 'created_at', label: 'Erstelldatum' },
];

interface Props {
  dealrooms: Dealroom[];
  viewCounts: Record<string, number>;
  engagementScores?: Record<string, number>;
}

export function DealroomList({ dealrooms, viewCounts, engagementScores = {} }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated_at');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('dealroom-view-mode') as 'cards' | 'list') || (dealrooms.length >= 6 ? 'list' : 'cards');
    }
    return dealrooms.length >= 6 ? 'list' : 'cards';
  });

  const filtered = dealrooms.filter((dr) => {
    const matchesSearch = !searchQuery ||
      dr.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dr.client_company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dr.client_position || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || dr.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'engagement_score') {
      return (engagementScores[b.id] || 0) - (engagementScores[a.id] || 0);
    }
    if (sortBy === 'created_at') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  if (dealrooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-[#e5e7eb] rounded-xl">
        <div className="h-12 w-12 rounded-xl bg-[#fafafa] flex items-center justify-center mb-4">
          <FileX size={20} className="text-[#6b7280]" />
        </div>
        <h3 className="text-[15px] font-semibold text-[#1a1a1a] mb-1">
          Noch keine Dealrooms
        </h3>
        <p className="text-[13px] text-[#6b7280] max-w-[300px] mb-5">
          Erstellen Sie Ihren ersten personalisierten Dealroom
        </p>
        <Button asChild size="sm">
          <Link href="/dashboard/new">
            <PlusCircle size={14} className="mr-1.5" />
            Ersten Dealroom erstellen
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Search + Filter Row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Dealroom suchen..."
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-1">
          {statusFilterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors duration-75 ${
                statusFilter === opt.value
                  ? 'bg-[#E97E1C] text-white'
                  : 'text-[#6b7280] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <div className="flex items-center gap-0.5 border border-[#e5e7eb] rounded-lg p-0.5">
            <button
              onClick={() => { setViewMode('cards'); localStorage.setItem('dealroom-view-mode', 'cards'); }}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-[#FEF3E2] text-[#E97E1C]' : 'text-[#9ca3af] hover:text-[#6b7280]'}`}
              title="Karten-Ansicht"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => { setViewMode('list'); localStorage.setItem('dealroom-view-mode', 'list'); }}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#FEF3E2] text-[#E97E1C]' : 'text-[#9ca3af] hover:text-[#6b7280]'}`}
              title="Listen-Ansicht"
            >
              <List size={14} />
            </button>
          </div>
          <div className="w-px h-4 bg-[#e5e7eb]" />
          <ArrowDownUp size={13} className="text-[#9ca3af]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-[11px] font-semibold text-[#6b7280] bg-transparent border-none outline-none cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <span className="text-[11px] text-[#9ca3af]">
            {filtered.length} von {dealrooms.length}
          </span>
        </div>
      </div>

      {/* Dealroom Cards */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-[#6b7280]">
          {dealrooms.length === 0 ? (
            <>
              <div className="h-12 w-12 rounded-xl bg-[#f0f5f7] flex items-center justify-center mx-auto mb-4">
                <PlusCircle className="h-6 w-6 text-[#E97E1C]" />
              </div>
              <p className="text-[15px] font-semibold text-[#1a1a1a]">Noch keine Angebotsräume</p>
              <p className="text-[13px] text-[#6b7280] mt-1 max-w-[320px] mx-auto">
                Erstellen Sie Ihren ersten Angebotsraum, um Ihrem Kunden ein professionelles Angebot zu präsentieren.
              </p>
              <Link href="/dashboard/new">
                <Button size="sm" className="mt-4">
                  <PlusCircle className="h-4 w-4 mr-1.5" />
                  Ersten Angebotsraum erstellen
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Search className="h-8 w-8 mx-auto mb-3 text-[#d1d5db]" />
              <p className="text-[15px] font-semibold text-[#1a1a1a]">Keine Angebotsräume gefunden</p>
              <p className="text-[13px] text-[#6b7280] mt-1">Passen Sie Ihre Suche oder Filter an</p>
            </>
          )}
        </div>
      ) : (
        viewMode === 'cards' ? (
        <div className="space-y-3">
          {sorted.map((dealroom, i) => {
            const config = statusConfig[dealroom.status] || statusConfig.draft;
            const views = viewCounts[dealroom.id] || 0;
            const score = engagementScores[dealroom.id] || 0;
            return (
              <Link
                key={dealroom.id}
                href={`/dashboard/dealrooms/${dealroom.id}`}
                className="block"
                style={{ animationDelay: i < 10 ? `${i * 50}ms` : '0ms', animationFillMode: 'both' }}
              >
                <div className="group border border-[#e5e7eb] rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-150 hover:border-[#FDE5C8] hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-lg bg-[#fafafa] flex items-center justify-center shrink-0">
                        <Building2 size={16} className="text-[#6b7280]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-[14px] font-semibold text-[#1a1a1a] truncate group-hover:text-[#E97E1C] transition-colors duration-75">
                            {dealroom.client_company}
                          </h3>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${config.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                            {config.label}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#6b7280] mt-0.5 truncate">
                          {dealroom.client_name}
                          {dealroom.client_position && ` – ${dealroom.client_position}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 text-[13px] text-[#6b7280] shrink-0 ml-4">
                      <div className="w-24" title="Engagement Score">
                        <EngagementScore score={score} compact />
                      </div>
                      <div className="flex items-center gap-1.5" title="Interaktionen">
                        <Eye size={14} strokeWidth={1.75} />
                        <span className="tabular-nums">{views}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Zuletzt aktualisiert">
                        <Clock size={14} strokeWidth={1.75} />
                        <span className="text-[11px]">{formatRelativeTime(dealroom.updated_at)}</span>
                      </div>
                      <ArrowUpRight size={16} strokeWidth={1.75} className="text-[#d1d5db] group-hover:text-[#E97E1C] transition-colors duration-75" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        ) : (
        /* List View */
        <div className="border border-[#e5e7eb] rounded-xl overflow-hidden bg-white">
          <div className="grid grid-cols-[1fr_1fr_80px_90px_40px] gap-3 px-4 py-2.5 bg-[#fafafa] border-b border-[#e5e7eb] text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">
            <span>Firma</span>
            <span>Kunde</span>
            <span>Score</span>
            <span>Status</span>
            <span />
          </div>
          {sorted.map((dealroom) => {
            const config = statusConfig[dealroom.status] || statusConfig.draft;
            const score = engagementScores[dealroom.id] || 0;
            return (
              <Link
                key={dealroom.id}
                href={`/dashboard/dealrooms/${dealroom.id}`}
                className="block"
              >
                <div className="group grid grid-cols-[1fr_1fr_80px_90px_40px] gap-3 px-4 py-3 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafafa] transition-colors items-center">
                  <span className="text-[13px] font-semibold text-[#1a1a1a] truncate group-hover:text-[#E97E1C] transition-colors">
                    {dealroom.client_company}
                  </span>
                  <span className="text-[13px] text-[#6b7280] truncate">
                    {dealroom.client_name}
                  </span>
                  <div className="w-16">
                    <EngagementScore score={score} compact />
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border w-fit ${config.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                    {config.label}
                  </span>
                  <ArrowUpRight size={14} className="text-[#d1d5db] group-hover:text-[#E97E1C] transition-colors justify-self-end" />
                </div>
              </Link>
            );
          })}
        </div>
        )
      )}
    </div>
  );
}
