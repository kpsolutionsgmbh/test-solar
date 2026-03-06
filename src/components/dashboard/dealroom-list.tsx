'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dealroom } from '@/types/database';
import {
  Eye,
  Clock,
  ArrowUpRight,
  FileX,
  PlusCircle,
  Search,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  draft: { label: 'Entwurf', color: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-400' },
  published: { label: 'Live', color: 'bg-emerald-100 text-emerald-700', dotColor: 'bg-emerald-400' },
  signed: { label: 'Signiert', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-400' },
  inactive: { label: 'Inaktiv', color: 'bg-orange-100 text-orange-700', dotColor: 'bg-orange-400' },
  archived: { label: 'Archiviert', color: 'bg-gray-100 text-gray-500', dotColor: 'bg-gray-400' },
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

interface Props {
  dealrooms: Dealroom[];
  viewCounts: Record<string, number>;
}

export function DealroomList({ dealrooms, viewCounts }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = dealrooms.filter((dr) => {
    const matchesSearch = !searchQuery ||
      dr.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dr.client_company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dr.client_position || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || dr.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (dealrooms.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-[#11485e]/8 flex items-center justify-center mb-5">
            <FileX className="h-8 w-8 text-[#11485e]/50" />
          </div>
          <p className="text-[#6b7280] mb-1 font-medium">Noch keine Dealrooms vorhanden</p>
          <p className="text-sm text-[#9ca3af] mb-6">Erstellen Sie Ihren ersten personalisierten Dealroom</p>
          <Button asChild>
            <Link href="/dashboard/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Ersten Dealroom erstellen
            </Link>
          </Button>
        </CardContent>
      </Card>
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-[#11485e] text-white'
                  : 'text-[#6b7280] hover:bg-[#f0f0f0]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#9ca3af] ml-auto shrink-0">
          {filtered.length} von {dealrooms.length}
        </span>
      </div>

      {/* Dealroom Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[#6b7280]">
          <Search className="h-8 w-8 mx-auto mb-3 text-[#d1d5db]" />
          <p className="font-medium">Keine Dealrooms gefunden</p>
          <p className="text-sm text-[#9ca3af] mt-1">Passen Sie Ihre Suche oder Filter an</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((dealroom) => {
            const config = statusConfig[dealroom.status] || statusConfig.draft;
            const views = viewCounts[dealroom.id] || 0;
            return (
              <Link
                key={dealroom.id}
                href={`/dashboard/dealrooms/${dealroom.id}`}
              >
                <Card className="hover:shadow-md transition-all cursor-pointer group border-[#e5e7eb]/80 hover:border-[#11485e]/20">
                  <CardContent className="flex items-center justify-between py-4 px-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-semibold text-[#1a1a1a] truncate">
                          {dealroom.client_company}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${config.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
                          {config.label}
                        </span>
                        {dealroom.language === 'en' && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">EN</Badge>
                        )}
                      </div>
                      <p className="text-sm text-[#6b7280] mt-0.5">
                        {dealroom.client_name}
                        {dealroom.client_position && ` – ${dealroom.client_position}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-5 text-sm text-[#6b7280] shrink-0 ml-4">
                      <div className="flex items-center gap-1.5" title="Interaktionen">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{views}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Zuletzt aktualisiert">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs">{formatRelativeTime(dealroom.updated_at)}</span>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-[#d1d5db] group-hover:text-[#11485e] transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
