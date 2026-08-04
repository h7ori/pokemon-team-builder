'use client';

import { Search, Sparkles, User, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export function Header() {
  const { sidebarCollapsed, setSearchOpen } = useUIStore();
  const { user, isLoggedIn, logout, setShowAuthModal } = useAuthStore();

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

  return (
    <header
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
        marginLeft: sidebarCollapsed ? '72px' : '256px',
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

        {/* Account Profile / Guest Badge */}
        {isLoggedIn && user ? (
          <div className="flex items-center gap-2 rounded-xl border p-1 pr-3" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <img
              src={user.avatar || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'}
              alt={user.name}
              className="h-8 w-8 rounded-lg bg-indigo-950/60 p-0.5 object-contain border border-indigo-500/30"
            />
            <div className="flex flex-col text-left text-xs">
              <span className="font-bold text-white leading-tight">{user.name}</span>
              <span className="text-[10px] text-green-400 font-mono">Account Active</span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="ml-2 text-slate-400 hover:text-red-400 p-1 rounded transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1 font-mono">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              Guest Mode
            </span>
            <button
              onClick={() => setShowAuthModal(true, 'Sign in to save teams to your account.')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition-all"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
