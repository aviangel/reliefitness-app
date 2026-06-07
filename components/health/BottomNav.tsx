'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UtensilsCrossed, Dumbbell, Droplets, Scale } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/translations';

const NAV_ITEMS: { href: string; labelKey: TranslationKey; icon: typeof Home }[] = [
  { href: '/dashboard', labelKey: 'nav.home', icon: Home },
  { href: '/meals', labelKey: 'nav.meals', icon: UtensilsCrossed },
  { href: '/workout', labelKey: 'nav.workout', icon: Dumbbell },
  { href: '/drinks', labelKey: 'nav.drinks', icon: Droplets },
  { href: '/weight', labelKey: 'nav.weight', icon: Scale },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-3 mb-3 bg-[#0d0d14]/90 backdrop-blur-xl border border-white/[0.08] rounded-[22px] px-2 py-2 shadow-[0_-4px_30px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[44px] min-h-[44px] justify-center transition-all duration-200 ${
                  active ? 'text-primary' : 'text-muted-foreground/60'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-primary/15 shadow-[0_0_12px_rgba(34,197,94,0.2)]'
                    : ''
                }`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${active ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  {t(labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
