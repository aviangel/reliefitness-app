'use client';

import { PetAvatar } from './PetAvatar';

export type BuddyMood = 'happy' | 'neutral' | 'needs-you' | 'sleepy';

const MOOD_CLASS: Record<BuddyMood, string> = {
  happy:      'buddy-happy',
  neutral:    'buddy-idle',
  'needs-you': 'buddy-wiggle',
  sleepy:     'buddy-sleepy',
};

interface Props {
  imagePath: string | null;
  emoji: string | null;
  mood: BuddyMood;
  size?: number;
}

export function BuddyAvatar({ imagePath, emoji, mood, size = 140 }: Props) {
  return (
    <div className={`inline-block ${MOOD_CLASS[mood]}`} style={{ transformOrigin: 'center bottom' }}>
      <PetAvatar imagePath={imagePath} emoji={emoji} size={size} />
    </div>
  );
}
