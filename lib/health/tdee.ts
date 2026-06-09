const ACTIVITY_MULTIPLIER: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export function computeTdee(params: {
  weightKg: number;
  heightCm: number;
  birthYear: number;
  sex: string;
  activityLevel: string;
}): number {
  const age = new Date().getFullYear() - params.birthYear;
  const sexOffset = params.sex === 'female' ? -161 : 5;
  const bmr = 10 * params.weightKg + 6.25 * params.heightCm - 5 * age + sexOffset;
  const multiplier = ACTIVITY_MULTIPLIER[params.activityLevel] ?? 1.375;
  return Math.round(bmr * multiplier);
}
