'use client';

import type { PokemonType } from '@/types/pokemon';
import { TYPE_COLORS } from '@/lib/pokemon/sprites';
import { cn } from '@/lib/utils';

interface TypeBadgeProps {
  type: PokemonType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function TypeBadge({ type, size = 'md', className }: TypeBadgeProps) {
  const colors = TYPE_COLORS[type] ?? TYPE_COLORS.Normal;

  return (
    <span
      className={cn(
        'type-badge inline-flex items-center font-semibold uppercase tracking-wider',
        sizeStyles[size],
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {type}
    </span>
  );
}
