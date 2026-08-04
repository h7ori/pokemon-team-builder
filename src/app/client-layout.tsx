'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { SearchModal } from '@/components/shared/SearchModal';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes
          },
        },
      })
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeWidth = mounted && sidebarCollapsed ? '72px' : '256px';

  return (
    <QueryClientProvider client={queryClient}>
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile nav */}
      <MobileNav />

      {/* Global search modal */}
      <SearchModal />

      {/* Main content area */}
      <div
        suppressHydrationWarning
        className={cn(
          'min-h-screen transition-all duration-300',
          'pt-14 pb-20 lg:pt-0 lg:pb-0'
        )}
        style={{
          marginLeft: `var(--sidebar-width, 0px)`,
        }}
      >
        <style suppressHydrationWarning>{`
          @media (min-width: 1024px) {
            :root {
              --sidebar-width: ${activeWidth};
            }
          }
          @media (max-width: 1023px) {
            :root {
              --sidebar-width: 0px;
            }
          }
        `}</style>

        {/* Desktop header */}
        <Header />

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </QueryClientProvider>
  );
}
