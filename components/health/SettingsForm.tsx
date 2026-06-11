'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { updateGoals, generateApiKey } from '@/lib/health/actions';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/translations';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { CheckCircle2, LogOut, Moon, Ruler, Footprints, AlertTriangle, ChevronRight, Copy, RefreshCw, Plug } from 'lucide-react';

interface SettingsFormProps {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  sugarGoal: number;
  waterGoalMl: number;
  currentWeight: number;
  targetWeight: number;
  userId: string;
  initApiKey: string | null;
  mcpServerUrl: string;
}

export function SettingsForm({
  calorieGoal: initCal,
  proteinGoal: initProtein,
  carbsGoal: initCarbs,
  fatGoal: initFat,
  sugarGoal: initSugar,
  waterGoalMl: initWater,
  currentWeight,
  targetWeight,
  initApiKey,
  mcpServerUrl,
}: SettingsFormProps) {
  const { t } = useI18n();
  const [calGoal, setCalGoal] = useState(initCal.toString());
  const [proteinGoal, setProteinGoal] = useState(initProtein.toString());
  const [carbsGoal, setCarbsGoal] = useState(initCarbs.toString());
  const [fatGoal, setFatGoal] = useState(initFat.toString());
  const [sugarGoal, setSugarGoal] = useState(initSugar.toString());
  const [waterGoal, setWaterGoal] = useState(initWater.toString());
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  // MCP API key state
  const [apiKey, setApiKey] = useState<string | null>(initApiKey);
  const [showKey, setShowKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [keyPending, startKeyTransition] = useTransition();

  const handleGenerateKey = () => {
    startKeyTransition(async () => {
      const newKey = await generateApiKey();
      setApiKey(newKey);
      setShowKey(true);
    });
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(mcpServerUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateGoals(
        parseInt(calGoal) || 2000,
        parseInt(proteinGoal) || 150,
        parseInt(carbsGoal) || 200,
        parseInt(fatGoal) || 65,
        parseInt(sugarGoal) || 50,
        parseInt(waterGoal) || 2500
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const moreLinks: { href: string; labelKey: TranslationKey; icon: typeof Moon; color: string }[] = [
    { href: '/sleep', labelKey: 'sleep.title', icon: Moon, color: 'text-indigo-400' },
    { href: '/measurements', labelKey: 'meas.title', icon: Ruler, color: 'text-teal-400' },
    { href: '/steps', labelKey: 'steps.title', icon: Footprints, color: 'text-lime-400' },
    { href: '/slips', labelKey: 'slips.title', icon: AlertTriangle, color: 'text-rose-400' },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const fields: { labelKey: TranslationKey; value: string; set: (v: string) => void; unit: string; color: string }[] = [
    { labelKey: 'settings.dailyCalories', value: calGoal, set: setCalGoal, unit: t('unit.kcal'), color: 'text-primary' },
    { labelKey: 'settings.proteinGoal', value: proteinGoal, set: setProteinGoal, unit: t('unit.g'), color: 'text-blue-400' },
    { labelKey: 'settings.carbsGoal', value: carbsGoal, set: setCarbsGoal, unit: t('unit.g'), color: 'text-amber-400' },
    { labelKey: 'settings.fatGoal', value: fatGoal, set: setFatGoal, unit: t('unit.g'), color: 'text-pink-400' },
    { labelKey: 'settings.sugarGoal', value: sugarGoal, set: setSugarGoal, unit: t('unit.g'), color: 'text-rose-400' },
    { labelKey: 'settings.waterGoal', value: waterGoal, set: setWaterGoal, unit: t('unit.ml'), color: 'text-sky-400' },
  ];

  return (
    <div className="p-4 space-y-5">
      {/* Profile info */}
      <div className="bg-surface border border-border rounded-[20px] p-4 space-y-3.5">
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('settings.profile')}</h2>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('settings.currentWeight')}</span>
          <span className="text-sm font-black tabular-nums">{currentWeight.toFixed(1)} <span className="text-muted-foreground font-normal">{t('unit.kg')}</span></span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('settings.targetWeight')}</span>
          <span className="text-sm font-black tabular-nums text-primary">{targetWeight.toFixed(1)} <span className="text-muted-foreground font-normal text-sm">{t('unit.kg')}</span></span>
        </div>
        <div className="flex justify-between items-center border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">{t('settings.toLose')}</span>
          <span className="text-sm font-black tabular-nums">{Math.max(0, currentWeight - targetWeight).toFixed(1)} <span className="text-muted-foreground font-normal">{t('unit.kg')}</span></span>
        </div>
      </div>

      <ThemeToggle />

      <LanguageToggle />

      {/* Goals */}
      <div className="bg-surface border border-border rounded-[20px] p-4 space-y-4">
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('settings.dailyGoals')}</h2>
        {fields.map(({ labelKey, value, set, unit, color }) => (
          <div key={labelKey} className="flex items-center gap-3">
            <label className="text-sm flex-1 font-medium">{t(labelKey)}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={value}
                onChange={e => set(e.target.value)}
                className="w-20 bg-surface-2 border border-border rounded-[12px] px-3 py-2 text-sm text-right font-black tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all"
              />
              <span className={`text-xs font-bold w-7 ${color}`}>{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || saved}
        className="w-full py-4 rounded-[18px] font-black text-[15px] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        style={saved
          ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e' }
          : isPending
          ? { background: '#1a1a1a', color: '#555' }
          : { background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000', boxShadow: '0 4px 24px rgba(34,197,94,0.35)' }
        }
      >
        {saved ? <><CheckCircle2 size={18} /> {t('settings.saved')}</> : isPending ? t('common.saving') : t('settings.saveGoals')}
      </button>

      {/* MCP Connection */}
      <div className="bg-surface border border-border rounded-[20px] p-4 space-y-3.5">
        <div className="flex items-center gap-2">
          <Plug size={14} className="text-emerald-400" />
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('settings.mcpTitle')}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{t('settings.mcpDesc')}</p>

        {/* MCP Server URL */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">{t('settings.mcpEndpointLabel')}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface-2 border border-border rounded-[10px] px-3 py-2 text-xs font-mono text-muted-foreground truncate">
              {mcpServerUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex items-center justify-center w-8 h-8 rounded-[10px] border border-border bg-surface-2 text-muted-foreground hover:text-primary transition-colors shrink-0"
            >
              {urlCopied ? <CheckCircle2 size={14} className="text-primary" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* API Key */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">{t('settings.mcpKeyLabel')}</p>
          {apiKey ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 bg-surface-2 border border-border rounded-[10px] px-3 py-2 text-xs font-mono truncate cursor-pointer select-all"
                  onClick={() => setShowKey(v => !v)}
                >
                  {showKey ? apiKey : `mk_${'•'.repeat(16)}`}
                </div>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="flex items-center justify-center w-8 h-8 rounded-[10px] border border-border bg-surface-2 text-muted-foreground hover:text-primary transition-colors shrink-0"
                >
                  {keyCopied ? <CheckCircle2 size={14} className="text-primary" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground/60">{t('settings.mcpHint')}</p>
              <button
                type="button"
                onClick={handleGenerateKey}
                disabled={keyPending}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-400 transition-colors"
              >
                <RefreshCw size={12} className={keyPending ? 'animate-spin' : ''} />
                {t('settings.mcpRegenerate')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground/60">{t('settings.mcpHint')}</p>
              <button
                type="button"
                onClick={handleGenerateKey}
                disabled={keyPending}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000' }}
              >
                <Plug size={14} />
                {keyPending ? '...' : t('settings.mcpGenerate')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* More trackers */}
      <div className="bg-surface border border-border rounded-[20px] overflow-hidden">
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">{t('settings.moreTrackers')}</h2>
        {moreLinks.map(({ href, labelKey, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-3.5 border-t border-border active:bg-surface-2 transition-colors"
          >
            <Icon size={18} className={color} />
            <span className="text-sm font-semibold flex-1">{t(labelKey)}</span>
            <ChevronRight size={16} className="text-muted-foreground rtl:rotate-180" />
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <div className="pb-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full py-4 rounded-[18px] border border-border bg-surface text-muted-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:border-red-500/30 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          {t('settings.signOut')}
        </button>
      </div>
    </div>
  );
}
