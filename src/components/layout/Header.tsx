'use client';

import { Search, Sparkles } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function Header() {
  const { sidebarCollapsed, setSearchOpen } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);

  const activeMarginLeft = mounted && sidebarCollapsed ? '72px' : '256px';

  return (
    <header
      suppressHydrationWarning
      className={cn(
        'sticky top-0 z-40 hidden lg:flex',
        'h-[68px] items-center justify-between px-6',
        'border-b transition-all duration-300'
      )}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: `blur(var(--glass-blur))`,
        WebkitBackdropFilter: `blur(var(--glass-blur))`,
        borderColor: 'var(--border-primary)',
        marginLeft: activeMarginLeft,
      }}
    >
      <div className="flex items-center gap-4">
        {/* Dynamic page title */}
      </div>

      {/* Search bar */}
      <button
        onClick={() => setSearchOpen(true)}
        className={cn(
          'flex items-center gap-3 rounded-xl border px-4 py-2.5',
          'transition-all duration-200 hover:shadow-md',
          'focus-ring w-[320px]'
        )}
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
          color: 'var(--text-tertiary)',
        }}
        aria-label="Open global search"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left text-sm">Search Pokémon, moves, items...</span>
        <kbd
          className="rounded-md border px-2 py-0.5 text-xs font-medium"
          style={{
            borderColor: 'var(--border-secondary)',
            color: 'var(--text-tertiary)',
          }}
        >
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
          }}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          Gen 9
        </div>
      </div>
    </header>
  );
}
