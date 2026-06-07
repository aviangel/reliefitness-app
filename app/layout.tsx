import type { Metadata, Viewport } from 'next';
import { Heebo } from 'next/font/google';
import { PwaRegister } from '@/components/PwaRegister';
import { I18nProvider } from '@/lib/i18n/context';
import { getLang, getDir } from '@/lib/i18n/server';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Health Tracker',
  description: 'Personal health & fitness tracker',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Health Tracker',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090f',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  const dir = getDir(lang);
  return (
    <html lang={lang} dir={dir} className="dark">
      <body className={`${heebo.variable} font-heebo antialiased bg-background text-foreground`}>
        <I18nProvider lang={lang}>
          <PwaRegister />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
