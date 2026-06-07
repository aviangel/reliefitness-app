import type { Metadata, Viewport } from 'next';
import { Heebo } from 'next/font/google';
import { PwaRegister } from '@/components/PwaRegister';
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
  return (
    <html lang="en" className="dark">
      <body className={`${heebo.variable} font-heebo antialiased bg-background text-foreground`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
