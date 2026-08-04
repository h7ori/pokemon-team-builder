'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Swords,
  Calculator,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/team-builder', label: 'Builder', icon: Swords },
  { href: '/calculator', label: 'Calc', icon: Calculator },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile top header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-4 shadow-lg"
        style={{ background: 'var(--bg-sidebar)' }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-base font-bold text-white">PokéBuilder</h1>
        </Link>
      </header>

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-primary)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex h-16 items-stretch">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5',
                  'min-h-[44px] touch-manipulation transition-colors',
                  isActive
                    ? 'text-indigo-500'
                    : ''
                )}
                style={{
                  color: isActive ? undefined : 'var(--text-tertiary)',
                }}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
