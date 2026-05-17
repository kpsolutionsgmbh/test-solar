'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings as SettingsIcon, Layers, Award } from 'lucide-react';

const items = [
  { href: '/dashboard/settings', label: 'Einstellungen', icon: SettingsIcon },
  { href: '/dashboard/global-content', label: 'Standard-Inhalte', icon: Layers },
  { href: '/dashboard/references', label: 'Kundenstimmen', icon: Award },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 -mx-1 flex items-center gap-1 overflow-x-auto pb-px">
      {items.map(item => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-body-sm font-medium whitespace-nowrap transition-colors duration-fast ${
              active
                ? 'bg-brand-50 text-brand-500'
                : 'text-fg-muted hover:bg-surface-sub hover:text-fg'
            }`}
          >
            <item.icon size={15} strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
