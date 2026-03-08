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
  Users,
  FileStack,
  Mail,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const mainNavItems = [
  { href: '/dashboard', label: 'Übersicht', icon: LayoutDashboard },
  { href: '/dashboard/new', label: 'Neues Angebot', icon: Plus },
  { href: '/dashboard/customers', label: 'Kunden', icon: Users },
  { href: '/dashboard/references', label: 'Kundenstimmen', icon: Award },
  { href: '/dashboard/templates', label: 'Vorlagen', icon: FileStack },
  { href: '/dashboard/analytics', label: 'Auswertung', icon: BarChart3 },
  { href: '/dashboard/email-flows', label: 'E-Mails', icon: Mail },
];

// Bottom nav items for mobile (subset)
const mobileNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/new', label: 'Neu', icon: Plus },
  { href: '/dashboard/customers', label: 'Kunden', icon: Users },
  { href: '/dashboard/analytics', label: 'Auswertung', icon: BarChart3 },
];

interface SidebarProps {
  userName: string;
  companyName: string;
}

export function DashboardSidebar({ userName, companyName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[240px] h-screen border-r border-[#e5e7eb] bg-white flex-col shrink-0">
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
                relative group flex items-center gap-3
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
              {isActive(item.href) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-[#11485e]" />
              )}
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
              relative group flex items-center gap-3
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
            {isActive('/dashboard/settings') && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-[#11485e]" />
            )}
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

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#e5e7eb] flex items-center justify-between px-4 z-40">
        <Link href="/dashboard" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-blue.svg" alt="Gündesli & Kollegen" className="h-6 object-contain" />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-[#6b7280] hover:bg-[#f0f5f7] transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile slide-over menu */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setMobileOpen(false)} />
          <div className="md:hidden fixed top-14 left-0 right-0 bottom-0 bg-white z-50 overflow-y-auto">
            <nav className="py-3 px-3 space-y-0.5">
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] font-semibold transition-colors
                    ${isActive(item.href)
                      ? 'bg-[#e7eef1] text-[#11485e]'
                      : 'text-[#6b7280] hover:bg-[#fafafa]'
                    }
                  `}
                >
                  <item.icon size={18} strokeWidth={1.75} />
                  {item.label}
                </Link>
              ))}
              <div className="h-px bg-[#e5e7eb] my-3" />
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] font-semibold transition-colors ${
                  isActive('/dashboard/settings') ? 'bg-[#e7eef1] text-[#11485e]' : 'text-[#6b7280]'
                }`}
              >
                <Settings size={18} strokeWidth={1.75} />
                Einstellungen
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-[14px] font-semibold text-[#6b7280] hover:bg-[#fafafa] transition-colors"
              >
                <LogOut size={18} strokeWidth={1.75} />
                Abmelden
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e7eb] z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive(item.href) ? 'text-[#11485e]' : 'text-[#9ca3af]'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive(item.href) ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
