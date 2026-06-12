'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { purchaseItem } from '@/lib/health/rewards-actions';
import { PetAvatar } from './PetAvatar';
import { Coins, Check, Lock } from 'lucide-react';

type Item = {
  slug: string; item_type: string; pet_slug: string | null;
  name_en: string; name_he: string | null; category: string | null;
  cost: number; image_path: string | null; emoji: string | null; sort: number;
};

interface Props {
  items: Item[];
  ownedSlugs: string[];
  balance: number;
  activePetSlug: string | null;
}

type Tab = 'pets' | 'accessories' | 'themes';

export function ShopClient({ items, ownedSlugs, balance: initBalance, activePetSlug }: Props) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('pets');
  const [owned, setOwned] = useState(new Set(ownedSlugs));
  const [balance, setBalance] = useState(initBalance);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  const itemName = (i: Item) => (lang === 'he' && i.name_he) || i.name_en;

  const tabs: { id: Tab; labelKey: 'shop.tabPets' | 'shop.tabAccessories' | 'shop.tabThemes' }[] = [
    { id: 'pets', labelKey: 'shop.tabPets' },
    { id: 'accessories', labelKey: 'shop.tabAccessories' },
    { id: 'themes', labelKey: 'shop.tabThemes' },
  ];

  const filtered = items.filter((i) => {
    if (tab === 'pets') return i.item_type === 'pet';
    if (tab === 'accessories') return i.item_type === 'accessory';
    return ['palette', 'icons', 'font', 'animation'].includes(i.item_type);
  });

  const handleBuy = (item: Item) => {
    setError(null);
    setPendingSlug(item.slug);
    startTransition(async () => {
      const res = await purchaseItem(item.slug);
      if (res.purchased) {
        setOwned((prev) => new Set(prev).add(item.slug));
        setBalance((b) => b - item.cost);
      } else if (res.error) {
        setError(res.error);
      }
      setPendingSlug(null);
      router.refresh();
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Balance */}
      <div className="bg-surface border border-border rounded-[18px] p-4 flex items-center gap-3">
        <Coins size={20} className="text-amber-400" />
        <p className="text-lg font-black tabular-nums">{balance.toLocaleString()}</p>
        <p className="text-[11px] text-muted-foreground font-medium">{t('pet.points')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(({ id, labelKey }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 py-2.5 rounded-[14px] text-xs font-bold transition-all ${
              tab === id ? 'bg-primary/15 border border-primary/40 text-primary' : 'bg-surface border border-border text-muted-foreground'
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-[14px] bg-red-500/10 border border-red-500/30 px-4 py-3 text-xs font-medium text-red-400">
          {error}
        </div>
      )}

      {/* Items */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((item) => {
          const isOwned = owned.has(item.slug);
          const affordable = balance >= item.cost;
          const forOtherPet = item.item_type === 'accessory' && item.pet_slug !== activePetSlug;
          return (
            <div key={item.slug} className="bg-surface border border-border rounded-[18px] p-3.5 flex flex-col items-center gap-2">
              <PetAvatar imagePath={item.item_type === 'pet' ? item.image_path : null} emoji={item.emoji} size={item.item_type === 'pet' ? 72 : 44} />
              <span className="text-[11px] font-bold text-center leading-tight">{itemName(item)}</span>
              {item.item_type === 'accessory' && (
                <span className="text-[9px] text-muted-foreground/60">
                  {items.find((p) => p.slug === item.pet_slug) ? itemName(items.find((p) => p.slug === item.pet_slug)!) : item.pet_slug}
                  {forOtherPet ? ` · ${t('shop.otherPet')}` : ''}
                </span>
              )}
              {isOwned ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-primary mt-auto">
                  <Check size={12} strokeWidth={3} /> {t('shop.owned')}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isPending || !affordable}
                  onClick={() => handleBuy(item)}
                  className={`w-full py-2 rounded-[12px] text-[11px] font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 mt-auto ${
                    affordable
                      ? 'bg-amber-400/15 border border-amber-400/40 text-amber-400'
                      : 'bg-surface-2 border border-border text-muted-foreground/50'
                  }`}
                >
                  {pendingSlug === item.slug ? '…' : (
                    <>
                      {!affordable && <Lock size={10} />}
                      <Coins size={11} />
                      {item.cost.toLocaleString()}
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">{t('shop.emptyTab')}</p>
      )}
    </div>
  );
}
