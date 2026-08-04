'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ThemeToggleProps {
  collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useUIStore();

  // Apply theme on mount and changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  const currentTheme = themes.find((t) => t.value === theme) ?? themes[1];

  if (collapsed) {
    return (
      <button
        onClick={() => {
          const next =
            theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
          setTheme(next);
        }}
        className={cn(
          'flex w-full items-center justify-center rounded-xl p-2.5',
          'transition-colors text-slate-400 hover:text-white'
        )}
        style={{ background: 'transparent' }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.background =
            'var(--bg-sidebar-hover)')
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.background = 'transparent')
        }
        title={`Theme: ${currentTheme.label}`}
        aria-label={`Switch theme, current: ${currentTheme.label}`}
      >
        <currentTheme.icon className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div
      className="flex rounded-xl p-1"
      style={{ background: 'rgba(255, 255, 255, 0.05)' }}
    >
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.value;

        return (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5',
              'text-xs font-medium transition-all duration-200',
              isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            )}
            aria-label={`Set ${t.label} theme`}
          >
            {isActive && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 rounded-lg"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            <Icon className="relative h-3.5 w-3.5" />
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
