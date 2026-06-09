// Shared types for the guided workout flow.

export interface GuidedExercise {
  templateExerciseId: string;
  exerciseId: string;
  slug: string;
  nameEn: string;
  nameHe: string | null;
  exerciseType: 'compound' | 'isolation';
  muscleGroups: string[];
  isTimed: boolean;
  instructions: string | null;
  demoGifUrl: string | null;
  herniaWarning: boolean;
  warningText: string | null;
  targetSets: number;
  repsMin: number;       // 0 means AMRAP / "max reps"
  repsMax: number | null;
  restSeconds: number;
  /** predetermined working weight from the coach plan, or null (bodyweight / not set) */
  targetWeight: number | null;
  /** coach guidance for progressing this lift, or null */
  progressionNote: string | null;
  /** "40kg × 10" from the most recent prior session, or null if first time */
  lastSummary: string | null;
  /** suggested working weight from progression logic, or null */
  suggestedWeight: number | null;
  /** default starting reps for the logger */
  defaultReps: number;
  /** default starting weight for the logger */
  defaultWeight: number;
}

export interface GuidedSession {
  id: string;
  dayName: string;
  phase: string | null;
}

export interface LoggedSet {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
}

export interface WorkoutPR {
  exerciseName: string;
  type: 'weight' | 'e1rm' | 'volume';
  value: string;
}

export interface SessionSummary {
  totalVolumeKg: number;
  durationSec: number;
  estimatedCalories: number;
  totalSets: number;
  prs: WorkoutPR[];
}
