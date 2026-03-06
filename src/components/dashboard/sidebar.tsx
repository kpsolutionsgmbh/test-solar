'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Plus,
  Award,
  Settings,
  LogOut,
  BarChart3,
} from 'lucide-react';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/new', label: 'Neuer Dealroom', icon: Plus },
  { href: '/dashboard/references', label: 'Referenzen', icon: Award },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

interface SidebarProps {
  userName: string;
  companyName: string;
}

export function DashboardSidebar({ userName, companyName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href);

  return (
    <aside className="w-[240px] h-screen border-r border-[#e5e7eb] bg-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-[#e5e7eb]">
        <Link href="/dashboard" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-blue.svg" alt="Gündesli & Kollegen" className="h-7 object-contain" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {mainNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`
              group flex items-center gap-3
              px-3 py-[7px]
              rounded-md
              text-[13px]
              font-semibold
              transition-colors duration-75
              ${isActive(item.href)
                ? 'bg-[#e7eef1] text-[#11485e]'
                : 'text-[#6b7280] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
              }
            `}
          >
            <item.icon
              size={16}
              strokeWidth={1.75}
              className={isActive(item.href) ? 'text-[#11485e]' : 'text-[#6b7280] group-hover:text-[#1a1a1a]'}
            />
            {item.label}
          </Link>
        ))}

        {/* Separator */}
        <div className="h-px bg-[#e5e7eb] my-3 mx-2" />

        <Link
          href="/dashboard/settings"
          prefetch={true}
          className={`
            group flex items-center gap-3
            px-3 py-[7px]
            rounded-md
            text-[13px]
            font-semibold
            transition-colors duration-75
            ${isActive('/dashboard/settings')
              ? 'bg-[#e7eef1] text-[#11485e]'
              : 'text-[#6b7280] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
            }
          `}
        >
          <Settings
            size={16}
            strokeWidth={1.75}
            className={isActive('/dashboard/settings') ? 'text-[#11485e]' : 'text-[#6b7280] group-hover:text-[#1a1a1a]'}
          />
          Einstellungen
        </Link>
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-[#e5e7eb]">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-[#e7eef1] flex items-center justify-center text-[#11485e] text-[13px] font-semibold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#1a1a1a] truncate">{userName}</p>
            <p className="text-[11px] text-[#6b7280] truncate">{companyName}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-[7px] rounded-md text-[13px] font-semibold text-[#6b7280] hover:bg-[#fafafa] hover:text-[#1a1a1a] transition-colors duration-75 mt-1"
        >
          <LogOut size={16} strokeWidth={1.75} />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
