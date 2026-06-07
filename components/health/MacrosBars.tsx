interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
}

function MacroBar({ label, current, goal, color }: MacroBarProps) {
  const pct = Math.min((current / goal) * 100, 100);
  return (
    <div className="flex-1">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">
          {Math.round(current)}
          <span className="text-muted-foreground font-normal">/{goal}g</span>
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
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
    <div className="flex gap-4 w-full">
      <MacroBar label={proteinLabel} current={protein} goal={proteinGoal} color="#3b82f6" />
      <MacroBar label={carbsLabel} current={carbs} goal={carbsGoal} color="#f59e0b" />
      <MacroBar label={fatLabel} current={fat} goal={fatGoal} color="#ec4899" />
    </div>
  );
}
