'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { getPokemonSprite } from '@/lib/pokemon/sprites';
import { cn } from '@/lib/utils';

interface PokemonSpriteProps {
  name: string;
  dexNum: number;
  shiny?: boolean;
  animated?: boolean;
  size?: number;
  className?: string;
  showArtwork?: boolean;
}

export function PokemonSprite({
  name,
  dexNum,
  shiny = false,
  animated = true,
  size = 96,
  className,
  showArtwork = false,
}: PokemonSpriteProps) {
  const [error, setError] = useState(0); // 0 = primary, 1 = fallback, 2 = artwork
  const sprites = getPokemonSprite(name, dexNum, { animated, shiny });

  const getSrc = useCallback(() => {
    if (showArtwork) return sprites.artwork;
    switch (error) {
      case 0:
        return sprites.primary;
      case 1:
        return sprites.fallback;
      default:
        return sprites.artwork;
    }
  }, [error, sprites, showArtwork]);

  return (
    <div
      className={cn('sprite-container', className)}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getSrc()}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        className="object-contain"
        style={{
          imageRendering: animated && error === 0 ? 'auto' : 'pixelated',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
        onError={() => setError((prev) => Math.min(prev + 1, 2))}
      />
    </div>
  );
}
