interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  gradFrom: string;
  gradTo: string;
}

function MacroBar({ label, current, goal, gradFrom, gradTo }: MacroBarProps) {
  const pct = Math.min((current / goal) * 100, 100);
  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-xs font-black tabular-nums" style={{ color: gradFrom }}>
          {Math.round(current)}
          <span className="text-muted-foreground/60 font-normal text-[10px]">/{goal}</span>
        </span>
      </div>
      <div className="h-[6px] bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${gradFrom}, ${gradTo})`,
            boxShadow: pct > 20 ? `0 0 8px ${gradFrom}66` : 'none',
          }}
        />
      </div>
    </div>
  );
}

interface MacrosBarsProps {
  protein: number;
  proteinGoal: number;
  carbs: number;
  carbsGoal: number;
  fat: number;
  fatGoal: number;
  proteinLabel: string;
  carbsLabel: string;
  fatLabel: string;
}

export function MacrosBars({
  protein,
  proteinGoal,
  carbs,
  carbsGoal,
  fat,
  fatGoal,
  proteinLabel,
  carbsLabel,
  fatLabel,
}: MacrosBarsProps) {
  return (
    <div className="flex gap-5 w-full">
      <MacroBar label={proteinLabel} current={protein} goal={proteinGoal} gradFrom="#3b82f6" gradTo="#06b6d4" />
      <MacroBar label={carbsLabel} current={carbs} goal={carbsGoal} gradFrom="#f59e0b" gradTo="#f97316" />
      <MacroBar label={fatLabel} current={fat} goal={fatGoal} gradFrom="#ec4899" gradTo="#a855f7" />
    </div>
  );
}
