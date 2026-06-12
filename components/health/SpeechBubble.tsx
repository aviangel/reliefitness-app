'use client';

import { useEffect, useState } from 'react';
import type { BuddyMood } from './BuddyAvatar';

interface Props {
  mood: BuddyMood;
  messages: string[];
  visible: boolean;
}

export function SpeechBubble({ mood, messages, visible }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!visible || messages.length === 0) return;
    setMsgIndex(Math.floor(Math.random() * messages.length));
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 8000);
    return () => clearInterval(id);
  }, [visible, messages.length, mood]);

  if (!visible || messages.length === 0) return null;

  return (
    <div className="relative max-w-[220px] mx-auto">
      <div className="bg-surface border border-border rounded-[16px] px-4 py-2.5 shadow-md text-[13px] font-semibold text-center leading-snug">
        {messages[msgIndex]}
      </div>
      {/* Tail pointing down toward buddy */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-[9px] w-0 h-0"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '9px solid hsl(var(--border))',
        }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-[7px] w-0 h-0"
        style={{
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: '8px solid hsl(var(--surface))',
        }}
      />
    </div>
  );
}
