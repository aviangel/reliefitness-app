'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { claimWeeklyDeficit, setActivePet, renamePet, toggleEquipItem } from '@/lib/health/rewards-actions';
import type { WeeklyDeficitStatus } from '@/lib/health/rewards-actions';
import { PetAvatar } from './PetAvatar';
import { Coins, Flame, Gift, Pencil, ShoppingBag, Check } from 'lucide-react';

type Item = {
  slug: string; item_type: string; pet_slug: string | null;
  name_en: string; name_he: string | null;
  image_path: string | null; emoji: string | null; cost: number;
};

interface Props {
  petName: string;
  variant: string;
  equipped: string[];
  activePet: Item | null;
  ownedPets: Item[];
  ownedAccessories: Item[];
  balance: number;
  lifetime: number;
  streak: number;
  weekly: WeeklyDeficitStatus;
}

const PALETTE_GRADIENTS: Record<string, string> = {
  classic: 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(22,163,74,0.05))',
  warm: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(239,68,68,0.05))',
  cool: 'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(99,102,241,0.05))',
};

export function PetClient({
  petName, variant, equipped, activePet, ownedPets, ownedAccessories,
  balance, streak, weekly,
}: Props) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [claimResult, setClaimResult] = useState<{ points: number; streak: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(petName);

  const itemName = (i: Item) => (lang === 'he' && i.name_he) || i.name_en;

  const handleClaim = () => {
    startTransition(async () => {
      const res = await claimWeeklyDeficit();
      if (res.claimed) setClaimResult({ points: res.points, streak: res.streak });
      router.refresh();
    });
  };

  const handleRename = () => {
    startTransition(async () => {
      await renamePet(newName);
      setRenaming(false);
      router.refresh();
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Pet card */}
      <div
        className="border border-border rounded-[24px] p-6 flex flex-col items-center"
        style={{ background: PALETTE_GRADIENTS[variant] ?? PALETTE_GRADIENTS.classic }}
      >
        <PetAvatar imagePath={activePet?.image_path ?? null} emoji={activePet?.emoji ?? null} size={140} />
        {renaming ? (
          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={24}
              className="bg-surface-2 border border-border rounded-[10px] px-3 py-1.5 text-sm font-bold w-36 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button type="button" onClick={handleRename} disabled={isPending} className="text-primary"><Check size={18} /></button>
          </div>
        ) : (
          <button type="button" onClick={() => setRenaming(true)} className="flex items-center gap-1.5 mt-3">
            <span className="text-lg font-black">{petName}</span>
            <Pencil size={12} className="text-muted-foreground" />
          </button>
        )}
        {/* Equipped accessories */}
        {equipped.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {ownedAccessories.filter((a) => equipped.includes(a.slug)).map((a) => (
              <span key={a.slug} className="text-base" title={itemName(a)}>{a.emoji}</span>
            ))}
          </div>
        )}
      </div>

      {/* Points + streak */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-[18px] p-4 flex items-center gap-3">
          <Coins size={20} className="text-amber-400" />
          <div>
            <p className="text-lg font-black tabular-nums leading-none">{balance.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t('pet.points')}</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-[18px] p-4 flex items-center gap-3">
          <Flame size={20} className="text-orange-400" />
          <div>
            <p className="text-lg font-black tabular-nums leading-none">{streak}</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t('pet.streakWeeks')}</p>
          </div>
        </div>
      </div>

      {/* Weekly deficit reward */}
      <div className="bg-surface border border-border rounded-[20px] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Gift size={14} className="text-primary" />
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('pet.weeklyReward')}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('pet.lastWeekSummary', { logged: weekly.daysLogged, deficit: weekly.deficitDays })}
        </p>
        {claimResult ? (
          <div className="rounded-[14px] bg-primary/10 border border-primary/30 px-4 py-3 text-sm font-bold text-primary">
            {t('pet.claimedMsg', { points: claimResult.points, streak: claimResult.streak })}
          </div>
        ) : weekly.alreadyClaimed ? (
          <div className="rounded-[14px] bg-surface-2 border border-border px-4 py-3 text-sm font-medium text-muted-foreground">
            {t('pet.alreadyClaimed')}
          </div>
        ) : weekly.eligible ? (
          <button
            type="button"
            onClick={handleClaim}
            disabled={isPending}
            className="w-full py-3.5 rounded-[16px] font-black text-sm transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000', boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}
          >
            {t('pet.claimReward', { points: weekly.potentialAward })}
          </button>
        ) : (
          <div className="rounded-[14px] bg-surface-2 border border-border px-4 py-3 text-xs text-muted-foreground">
            {t('pet.notEligible')}
          </div>
        )}
      </div>

      {/* Accessories for active pet */}
      {ownedAccessories.length > 0 && (
        <div className="bg-surface border border-border rounded-[20px] p-4">
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('pet.accessories')}</h2>
          <div className="space-y-2">
            {ownedAccessories.map((a) => {
              const isEquipped = equipped.includes(a.slug);
              return (
                <div key={a.slug} className="flex items-center gap-3">
                  <span className="text-lg">{a.emoji}</span>
                  <span className="text-sm font-semibold flex-1">{itemName(a)}</span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => startTransition(async () => { await toggleEquipItem(a.slug); router.refresh(); })}
                    className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all ${
                      isEquipped ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-surface-2 border border-border text-muted-foreground'
                    }`}
                  >
                    {isEquipped ? t('pet.unequip') : t('pet.equip')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pet collection */}
      {ownedPets.length > 1 && (
        <div className="bg-surface border border-border rounded-[20px] p-4">
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('pet.myPets')}</h2>
          <div className="grid grid-cols-4 gap-2">
            {ownedPets.map((p) => {
              const isActive = p.slug === activePet?.slug;
              return (
                <button
                  key={p.slug}
                  type="button"
                  disabled={isPending || isActive}
                  onClick={() => startTransition(async () => { await setActivePet(p.slug); router.refresh(); })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-[14px] border transition-all active:scale-95 ${
                    isActive ? 'border-primary/60 bg-primary/10' : 'border-border bg-surface-2'
                  }`}
                >
                  <PetAvatar imagePath={p.image_path} emoji={p.emoji} size={44} />
                  <span className="text-[9px] font-bold truncate w-full text-center">{itemName(p)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Shop link */}
      <Link
        href="/shop"
        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors text-sm font-medium"
      >
        <ShoppingBag size={16} />
        {t('pet.goToShop')}
      </Link>
    </div>
  );
}
