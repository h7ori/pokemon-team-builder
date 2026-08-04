'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Swords,
  Calculator,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/team-builder', label: 'Team Builder', icon: Swords },
  { href: '/calculator', label: 'Calculator', icon: Calculator },
  { href: '/teams', label: 'My Teams', icon: FolderOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 hidden h-screen flex-col lg:flex',
        'transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-[72px]' : 'w-64'
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
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Logo */}
      <div
        className={cn(
          'flex items-center border-b px-4',
          sidebarCollapsed ? 'h-[68px] justify-center' : 'h-[68px] gap-3'
        )}
        style={{ borderColor: 'var(--bg-sidebar-hover)' }}
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <h1 className="whitespace-nowrap text-lg font-bold text-white">
                PokéBuilder
              </h1>
              <p className="text-xs text-slate-400">Team Builder Pro</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5',
                    'transition-all duration-200',
                    'focus-ring',
                    isActive
                      ? 'text-white shadow-md'
                      : 'text-slate-400 hover:text-white',
                    sidebarCollapsed && 'justify-center px-0'
                  )}
                  style={{
                    background: isActive
                      ? 'var(--bg-sidebar-active)'
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.background =
                        'var(--bg-sidebar-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.background =
                        'transparent';
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div
        className="border-t p-3"
        style={{ borderColor: 'var(--bg-sidebar-hover)' }}
      >
        <ThemeToggle collapsed={sidebarCollapsed} />
      </div>
    </aside>
  );
}
