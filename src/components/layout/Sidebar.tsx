'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Swords,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { ThemeToggle } from './ThemeToggle';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/team-builder', label: 'Team Builder', icon: Swords },
  { href: '/calculator', label: 'Calculator', icon: Calculator },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isCollapsed = mounted ? sidebarCollapsed : false;

  return (
    <aside
      suppressHydrationWarning
      className={cn(
        'fixed left-0 top-0 z-50 hidden h-screen flex-col lg:flex',
        'transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-[72px]' : 'w-64'
      )}
      style={{
        background: 'var(--bg-sidebar)',
      }}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={cn(
          'absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2',
          'items-center justify-center rounded-full',
          'border transition-all duration-200',
          'hover:scale-110'
        )}
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-primary)',
          color: 'var(--text-secondary)',
        }}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Logo / Brand */}
      <div
        className="flex h-[68px] items-center gap-3 border-b px-5"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col"
          >
            <span
              className="text-base font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              PokéBuilder
            </span>
            <span
              className="text-[10px] font-medium"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Team Builder Pro
            </span>
          </motion.div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5',
                'text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-indigo-400 font-semibold'
                  : 'hover:bg-white/5'
              )}
              style={{
                color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
              }}
            >
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-indigo-400' : 'group-hover:text-white'
                )}
              />
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}

              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-500"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer controls */}
      <div
        className="flex items-center justify-between border-t p-4"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        {!isCollapsed && (
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Theme
          </span>
        )}
        <ThemeToggle />
      </div>
    </aside>
  );
}
