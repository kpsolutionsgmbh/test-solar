import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600'],
  display: 'swap',
  preload: true,
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Dealroom | Gündesli & Kollegen',
  description: 'Digital Sales Room für personalisierte Versicherungsangebote',
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={poppins.variable}>
      <body className="antialiased font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
