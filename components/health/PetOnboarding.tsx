'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { adoptStarterPet } from '@/lib/health/rewards-actions';
import { PetAvatar } from './PetAvatar';

type Starter = { slug: string; name_en: string; name_he: string | null; category: string; image_path: string | null; emoji: string | null };

const PALETTES: { key: string; colors: [string, string] }[] = [
  { key: 'classic', colors: ['#22c55e', '#16a34a'] },
  { key: 'warm', colors: ['#f59e0b', '#ef4444'] },
  { key: 'cool', colors: ['#38bdf8', '#6366f1'] },
];

export function PetOnboarding({ starters }: { starters: Starter[] }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [palette, setPalette] = useState('classic');
  const [isPending, startTransition] = useTransition();

  const handleAdopt = () => {
    if (!selected) return;
    startTransition(async () => {
      await adoptStarterPet(selected, name || 'Buddy', palette);
      router.refresh();
    });
  };

  return (
    <div className="p-4 space-y-5">
      {/* Choose starter */}
      <div className="bg-surface border border-border rounded-[20px] p-4">
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('pet.choosePet')}</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {starters.map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => setSelected(s.slug)}
              className={`flex flex-col items-center gap-2 p-3 rounded-[16px] border transition-all active:scale-95 ${
                selected === s.slug ? 'border-primary/60 bg-primary/10' : 'border-border bg-surface-2'
              }`}
            >
              <PetAvatar imagePath={s.image_path} emoji={s.emoji} size={64} />
              <span className="text-[11px] font-bold">{(lang === 'he' && s.name_he) || s.name_en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="bg-surface border border-border rounded-[20px] p-4">
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('pet.chooseName')}</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          placeholder={t('pet.namePlaceholder')}
          className="w-full bg-surface-2 border border-border rounded-[12px] px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Palette */}
      <div className="bg-surface border border-border rounded-[20px] p-4">
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('pet.choosePalette')}</h2>
        <div className="flex gap-2.5">
          {PALETTES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPalette(p.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[14px] border transition-all ${
                palette === p.key ? 'border-primary/60 bg-primary/10' : 'border-border bg-surface-2'
              }`}
            >
              {p.colors.map((c) => (
                <span key={c} className="w-4 h-4 rounded-full" style={{ background: c }} />
              ))}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!selected || isPending}
        onClick={handleAdopt}
        className="w-full py-4 rounded-[18px] font-black text-[15px] transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000', boxShadow: '0 4px 24px rgba(34,197,94,0.35)' }}
      >
        {isPending ? t('common.saving') : t('pet.adopt')}
      </button>
    </div>
  );
}
