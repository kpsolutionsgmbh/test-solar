'use client';

import { NotificationBell } from './notification-bell';

interface DashboardHeaderProps {
  userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <header className="h-14 border-b border-[#e5e7eb] bg-white flex items-center justify-end px-6 shrink-0">
      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[#FEF3E2] flex items-center justify-center text-[#E97E1C] text-[13px] font-semibold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-[#1a1a1a]">{userName}</span>
        </div>
      </div>
    </header>
  );
}
