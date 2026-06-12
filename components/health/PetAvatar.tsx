'use client';

import { useState } from 'react';

/**
 * Pet image with emoji fallback — pixel-art PNGs live in /public/pets/.
 * If the PNG isn't deployed yet, the emoji keeps the UI working.
 */
export function PetAvatar({
  imagePath,
  emoji,
  size = 96,
}: {
  imagePath: string | null;
  emoji: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (!imagePath || failed) {
    return (
      <span
        className="flex items-center justify-center select-none"
        style={{ width: size, height: size, fontSize: size * 0.6 }}
      >
        {emoji ?? '🐾'}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imagePath}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="object-contain select-none"
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      draggable={false}
    />
  );
}
