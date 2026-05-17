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
  Activity,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const mainNavItems = [
  { href: '/dashboard', label: 'Übersicht', icon: LayoutDashboard },
  { href: '/dashboard/new', label: 'Neues Angebot', icon: Plus },
  { href: '/dashboard/activity', label: 'Aktivität', icon: Activity },
  { href: '/dashboard/customers', label: 'Kunden', icon: Users },
  { href: '/dashboard/references', label: 'Kundenstimmen', icon: Award },
  { href: '/dashboard/templates', label: 'Vorlagen', icon: FileStack },
  { href: '/dashboard/analytics', label: 'Auswertung', icon: BarChart3 },
  { href: '/dashboard/email-flows', label: 'E-Mails', icon: Mail },
];

const mobileNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/new', label: 'Neu', icon: Plus },
  { href: '/dashboard/activity', label: 'Aktivität', icon: Activity },
  { href: '/dashboard/analytics', label: 'Auswertung', icon: BarChart3 },
];

interface SidebarProps {
  userName: string;
  companyName: string;
}

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Light Mode' : 'Dark Mode'}
      className={`flex items-center gap-3 ${
        collapsed ? 'justify-center' : ''
      } w-full px-3 py-[7px] rounded-md text-[13px] font-semibold text-fg-muted hover:bg-surface-sub hover:text-fg transition-colors duration-fast`}
    >
      {isDark ? (
        <Sun size={16} strokeWidth={1.75} />
      ) : (
        <Moon size={16} strokeWidth={1.75} />
      )}
      {!collapsed && (isDark ? 'Light Mode' : 'Dark Mode')}
    </button>
  );
}

export function DashboardSidebar({ userName, companyName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [collapseLoaded, setCollapseLoaded] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebar_collapsed');
    if (stored === '1') setCollapsed(true);
    setCollapseLoaded(true);
  }, []);

  // Persist collapsed state
  useEffect(() => {
    if (!collapseLoaded) return;
    localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed, collapseLoaded]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Esc to close mobile + lock scroll
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const desktopWidth = collapsed ? 'w-[64px]' : 'w-[240px]';

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex ${desktopWidth} h-screen border-r border-border bg-surface flex-col shrink-0 transition-[width] duration-base ease-standard`}
      >
        {/* Logo + collapse toggle */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-border">
          {!collapsed && (
            <Link href="/dashboard" className="block ml-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo-blue.svg" alt="Solarheld" className="h-7 object-contain" />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen'}
            className={`h-8 w-8 rounded-md flex items-center justify-center text-fg-subtle hover:bg-surface-sub hover:text-fg transition-colors ${
              collapsed ? 'mx-auto' : ''
            }`}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {mainNavItems.map(item => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                title={collapsed ? item.label : undefined}
                className={`relative group flex items-center gap-3 ${
                  collapsed ? 'justify-center' : ''
                } px-3 py-[7px] rounded-md text-[13px] font-semibold transition-colors duration-fast ${
                  active
                    ? 'bg-brand-50 text-brand-500'
                    : 'text-fg-muted hover:bg-surface-sub hover:text-fg'
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-brand-500" />
                )}
                <item.icon
                  size={16}
                  strokeWidth={1.75}
                  className={active ? 'text-brand-500' : 'text-fg-muted group-hover:text-fg'}
                />
                {!collapsed && item.label}
              </Link>
            );
          })}

          {/* Separator */}
          <div className="h-px bg-border my-3 mx-2" />

          <Link
            href="/dashboard/settings"
            prefetch
            title={collapsed ? 'Einstellungen' : undefined}
            className={`relative group flex items-center gap-3 ${
              collapsed ? 'justify-center' : ''
            } px-3 py-[7px] rounded-md text-[13px] font-semibold transition-colors duration-fast ${
              isActive('/dashboard/settings')
                ? 'bg-brand-50 text-brand-500'
                : 'text-fg-muted hover:bg-surface-sub hover:text-fg'
            }`}
          >
            {isActive('/dashboard/settings') && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-brand-500" />
            )}
            <Settings
              size={16}
              strokeWidth={1.75}
              className={isActive('/dashboard/settings') ? 'text-brand-500' : 'text-fg-muted group-hover:text-fg'}
            />
            {!collapsed && 'Einstellungen'}
          </Link>

          <ThemeToggle collapsed={collapsed} />
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border">
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="h-8 w-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 text-[13px] font-bold shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-fg truncate">{userName}</p>
                <p className="text-[11px] text-fg-muted truncate">{companyName}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Abmelden' : undefined}
            className={`flex items-center gap-3 ${
              collapsed ? 'justify-center' : ''
            } w-full px-3 py-[7px] rounded-md text-[13px] font-semibold text-fg-muted hover:bg-surface-sub hover:text-fg transition-colors duration-fast mt-1`}
          >
            <LogOut size={16} strokeWidth={1.75} />
            {!collapsed && 'Abmelden'}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border flex items-center justify-between px-4 z-40">
        <Link href="/dashboard" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-blue.svg" alt="Solarheld" className="h-6 object-contain" />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-fg-muted hover:bg-surface-sub transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile slide-over menu */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setMobileOpen(false)} />
          <div className="md:hidden fixed top-14 left-0 right-0 bottom-0 bg-surface z-50 overflow-y-auto">
            <nav className="py-3 px-3 space-y-0.5">
              {mainNavItems.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] font-semibold transition-colors ${
                      active ? 'bg-brand-50 text-brand-500' : 'text-fg-muted hover:bg-surface-sub'
                    }`}
                  >
                    <item.icon size={18} strokeWidth={1.75} />
                    {item.label}
                  </Link>
                );
              })}
              <div className="h-px bg-border my-3" />
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] font-semibold transition-colors ${
                  isActive('/dashboard/settings') ? 'bg-brand-50 text-brand-500' : 'text-fg-muted'
                }`}
              >
                <Settings size={18} strokeWidth={1.75} />
                Einstellungen
              </Link>
              <div className="px-3">
                <ThemeToggle collapsed={false} />
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-[14px] font-semibold text-fg-muted hover:bg-surface-sub transition-colors"
              >
                <LogOut size={18} strokeWidth={1.75} />
                Abmelden
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {mobileNavItems.map(item => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  active ? 'text-brand-500' : 'text-fg-subtle'
                }`}
              >
                <item.icon size={20} strokeWidth={active ? 2 : 1.5} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
