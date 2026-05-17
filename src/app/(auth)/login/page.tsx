import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  robots: 'noindex, nofollow',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; next?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-blue.svg" alt="Solarheld" className="h-10 mx-auto mb-6 object-contain" />
          <h1 className="text-2xl font-bold text-fg">Anmelden</h1>
          <p className="text-sm text-fg-muted mt-1">Zugang zum Solarheld Dealroom.</p>
        </div>
        <LoginForm initialError={searchParams?.error} next={searchParams?.next} />
      </div>
    </div>
  );
}
