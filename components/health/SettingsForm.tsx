'use client';

import { useState, useTransition } from 'react';
import { updateGoals } from '@/lib/health/actions';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CheckCircle2, LogOut } from 'lucide-react';

interface SettingsFormProps {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  currentWeight: number;
  targetWeight: number;
  userId: string;
}

export function SettingsForm({
  calorieGoal: initCal,
  proteinGoal: initProtein,
  carbsGoal: initCarbs,
  fatGoal: initFat,
  currentWeight,
  targetWeight,
}: SettingsFormProps) {
  const [calGoal, setCalGoal] = useState(initCal.toString());
  const [proteinGoal, setProteinGoal] = useState(initProtein.toString());
  const [carbsGoal, setCarbsGoal] = useState(initCarbs.toString());
  const [fatGoal, setFatGoal] = useState(initFat.toString());
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const handleSave = () => {
    startTransition(async () => {
      await updateGoals(
        parseInt(calGoal) || 2000,
        parseInt(proteinGoal) || 150,
        parseInt(carbsGoal) || 200,
        parseInt(fatGoal) || 65
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const fields = [
    { label: 'Daily Calories', value: calGoal, set: setCalGoal, unit: 'kcal', color: 'text-primary' },
    { label: 'Protein Goal', value: proteinGoal, set: setProteinGoal, unit: 'g', color: 'text-blue-400' },
    { label: 'Carbs Goal', value: carbsGoal, set: setCarbsGoal, unit: 'g', color: 'text-amber-400' },
    { label: 'Fat Goal', value: fatGoal, set: setFatGoal, unit: 'g', color: 'text-pink-400' },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Profile info */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Profile</h2>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Current weight</span>
          <span className="text-sm font-semibold">{currentWeight.toFixed(1)} kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Target weight</span>
          <span className="text-sm font-semibold text-primary">{targetWeight.toFixed(1)} kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">To lose</span>
          <span className="text-sm font-semibold">{Math.max(0, currentWeight - targetWeight).toFixed(1)} kg</span>
        </div>
      </div>

      {/* Goals */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Daily Goals</h2>
        {fields.map(({ label, value, set, unit, color }) => (
          <div key={label} className="flex items-center gap-3">
            <label className="text-sm flex-1">{label}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={value}
                onChange={e => set(e.target.value)}
                className="w-20 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-right font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span className={`text-xs font-medium w-8 ${color}`}>{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || saved}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
          saved
            ? 'bg-primary/20 text-primary'
            : isPending
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
        }`}
      >
        {saved ? <><CheckCircle2 size={18} /> Saved!</> : isPending ? 'Saving...' : 'Save Goals'}
      </button>

      {/* Sign out */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full py-4 rounded-2xl border border-border text-muted-foreground text-sm font-medium flex items-center justify-center gap-2 hover:border-destructive/50 hover:text-destructive transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
