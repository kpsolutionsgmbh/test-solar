'use client';

import { NotificationBell } from './notification-bell';
import { ThemeToggle } from './theme-toggle';

interface DashboardHeaderProps {
  userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-end px-6 shrink-0">
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell />
        <div className="flex items-center gap-2 pl-2 ml-1 border-l border-border">
          <div className="h-8 w-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 text-[13px] font-bold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-fg">{userName}</span>
        </div>
      </div>
    </header>
  );
}
