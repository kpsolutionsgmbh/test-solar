'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DotPattern } from '@/components/magicui/dot-pattern';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Ungültige Anmeldedaten. Bitte versuchen Sie es erneut.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#11485e] flex-col items-center justify-center px-12 overflow-hidden">
        <DotPattern
          className="absolute inset-0 opacity-20 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
          cr={1.5}
          cx={1}
          cy={1}
        />
        <div className="relative z-10 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-white.svg"
            alt="Gündesli & Kollegen"
            className="h-16 object-contain mx-auto mb-8"
          />
          <h1 className="text-3xl font-bold text-white mb-3">
            Digital Sales Room
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            Erstellen Sie personalisierte Angebotsräume für Ihre Kunden – professionell, digital und überzeugend.
          </p>
          <div className="flex items-center justify-center gap-8 mt-12">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-white/50 text-xs mt-1">Digital</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">KI</p>
              <p className="text-white/50 text-xs mt-1">Unterstützt</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">E-Sign</p>
              <p className="text-white/50 text-xs mt-1">Integriert</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-[#fafafa] px-6 relative">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center justify-center mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-blue.svg" alt="Gündesli & Kollegen" className="h-12 object-contain" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1a1a1a]">Willkommen zurück</h2>
            <p className="text-sm text-[#6b7280] mt-1">
              Melden Sie sich in Ihrem Admin-Bereich an
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-medium">E-Mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ihre@email.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px] font-medium">Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Passwort eingeben"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-11"
                />
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 text-[14px] font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Anmelden...
                </span>
              ) : (
                'Anmelden'
              )}
            </Button>
          </form>

          <p className="text-center text-[11px] text-[#9ca3af] mt-8">
            Gündesli & Kollegen – Dealroom Platform
          </p>
        </div>
      </div>
    </div>
  );
}
