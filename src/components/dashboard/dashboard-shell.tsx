'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { OnboardingModal } from '@/components/dashboard/onboarding-modal';
import { CommandPalette } from '@/components/dashboard/command-palette';

interface DashboardShellProps {
  showOnboarding: boolean;
  children: React.ReactNode;
}

export function DashboardShell({ showOnboarding, children }: DashboardShellProps) {
  const [onboardingOpen, setOnboardingOpen] = useState(showOnboarding);
  const supabase = createClient();

  const handleOnboardingClose = async () => {
    setOnboardingOpen(false);
    // Mark onboarding as completed
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('admin_users')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);
    }
  };

  return (
    <>
      {children}
      <OnboardingModal open={onboardingOpen} onClose={handleOnboardingClose} />
      <CommandPalette />
    </>
  );
}
