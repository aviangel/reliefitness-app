'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListChecks, ShoppingBag, Settings } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/translations';

const NAV_ITEMS: { href: string; labelKey: TranslationKey; icon: typeof Home; exact?: boolean }[] = [
  { href: '/home',     labelKey: 'nav.home',     icon: Home,        exact: true },
  { href: '/habits',   labelKey: 'nav.habits',   icon: ListChecks },
  { href: '/shop',     labelKey: 'nav.shop',     icon: ShoppingBag },
  { href: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-3 mb-3 bg-surface/95 backdrop-blur-xl border border-border rounded-[24px] px-1 py-2 shadow-[0_-8px_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map(({ href, labelKey, icon: Icon, exact }) => {
            const active = isActive(href, exact);
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
