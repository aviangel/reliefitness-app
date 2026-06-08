'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UtensilsCrossed, Dumbbell, Droplets, Scale, Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/translations';

const LEFT_ITEMS: { href: string; labelKey: TranslationKey; icon: typeof Home }[] = [
  { href: '/dashboard', labelKey: 'nav.home', icon: Home },
  { href: '/meals', labelKey: 'nav.meals', icon: UtensilsCrossed },
];

const RIGHT_ITEMS: { href: string; labelKey: TranslationKey; icon: typeof Home }[] = [
  { href: '/drinks', labelKey: 'nav.drinks', icon: Droplets },
  { href: '/weight', labelKey: 'nav.weight', icon: Scale },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-3 mb-3 bg-[#0d0d0d]/95 backdrop-blur-xl border border-white/[0.07] rounded-[24px] px-1 py-2 shadow-[0_-8px_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-around">

          {/* Left items */}
          {LEFT_ITEMS.map(({ href, labelKey, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 min-w-[52px] min-h-[44px] justify-center transition-all duration-150 active:scale-95 ${
                  active ? 'text-primary' : 'text-muted-foreground/50'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[9px] font-semibold tracking-wide transition-colors ${active ? 'text-primary' : 'text-muted-foreground/50'}`}>
                  {t(labelKey)}
                </span>
              </Link>
            );
          })}

          {/* Center FAB — TikTok style */}
          <Link
            href="/meals/log"
            className="relative flex items-center justify-center mx-1"
            aria-label="Log meal"
          >
            <span className="absolute -inset-[3px] rounded-[18px] bg-gradient-to-br from-[#22c55e] to-[#00b4d8] opacity-80 blur-[2px]" />
            <span className="relative flex items-center justify-center w-[52px] h-[38px] rounded-2xl bg-gradient-to-br from-[#22c55e] to-[#16a34a] shadow-[0_0_20px_rgba(34,197,94,0.5)]">
              <Plus size={24} strokeWidth={3} className="text-black" />
            </span>
          </Link>

          {/* Right items */}
          {RIGHT_ITEMS.map(({ href, labelKey, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 min-w-[52px] min-h-[44px] justify-center transition-all duration-150 active:scale-95 ${
                  active ? 'text-primary' : 'text-muted-foreground/50'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[9px] font-semibold tracking-wide transition-colors ${active ? 'text-primary' : 'text-muted-foreground/50'}`}>
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
