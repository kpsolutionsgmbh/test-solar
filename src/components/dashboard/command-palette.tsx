'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  FileStack,
  LayoutDashboard,
  Mail,
  Plus,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface CommandItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  group: string;
}

const commands: CommandItem[] = [
  { label: 'Übersicht', icon: <LayoutDashboard className="h-4 w-4" />, href: '/dashboard', group: 'Navigation' },
  { label: 'Neues Angebot', icon: <Plus className="h-4 w-4" />, href: '/dashboard/new', group: 'Navigation' },
  { label: 'Kunden', icon: <Users className="h-4 w-4" />, href: '/dashboard/customers', group: 'Navigation' },
  { label: 'Vorlagen', icon: <FileStack className="h-4 w-4" />, href: '/dashboard/templates', group: 'Navigation' },
  { label: 'E-Mails', icon: <Mail className="h-4 w-4" />, href: '/dashboard/email-flows', group: 'Navigation' },
  { label: 'Einstellungen', icon: <Settings className="h-4 w-4" />, href: '/dashboard/settings', group: 'Navigation' },
  { label: 'Auswertung', icon: <BarChart3 className="h-4 w-4" />, href: '/dashboard/analytics', group: 'Navigation' },
  { label: 'Team verwalten', icon: <Users className="h-4 w-4" />, href: '/dashboard/settings/team', group: 'Aktionen' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {});

  const groupOrder = ['Navigation', 'Aktionen'];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[selectedIndex];
      if (item) navigate(item.href);
    }
  };

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const selected = container.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  let flatIndex = 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-xl"
        onKeyDown={handleKeyDown}
      >
        <span className="sr-only">Befehlspalette</span>

        <div className="flex items-center border-b border-[#e5e7eb] px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-[#6b7280]" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen oder Befehl eingeben..."
            className="h-11 border-0 bg-transparent text-sm text-[#1a1a1a] placeholder:text-[#6b7280] focus-visible:ring-0"
          />
        </div>

        <div ref={listRef} className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-[#6b7280]">
              Keine Ergebnisse gefunden.
            </p>
          )}

          {groupOrder.map((groupName) => {
            const items = groups[groupName];
            if (!items || items.length === 0) return null;

            return (
              <div key={groupName}>
                <p className="px-4 pb-1 pt-3 text-xs font-medium text-[#6b7280]">
                  {groupName}
                </p>
                {items.map((cmd) => {
                  const currentIndex = flatIndex++;
                  const isSelected = currentIndex === selectedIndex;

                  return (
                    <button
                      key={cmd.href}
                      data-selected={isSelected}
                      onClick={() => navigate(cmd.href)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        isSelected
                          ? 'bg-[#E97E1C]/10 text-[#E97E1C]'
                          : 'text-[#1a1a1a] hover:bg-[#E97E1C]/5'
                      }`}
                    >
                      <span className={isSelected ? 'text-[#E97E1C]' : 'text-[#6b7280]'}>
                        {cmd.icon}
                      </span>
                      {cmd.label}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end border-t border-[#e5e7eb] px-4 py-2">
          <span className="text-xs text-[#6b7280]">
            <kbd className="rounded border border-[#e5e7eb] bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium">Esc</kbd>
            {' '}zum Schließen
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
