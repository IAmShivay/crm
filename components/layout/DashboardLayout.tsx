'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { toggleSidebar } from '@/lib/slices/themeSlice';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarCollapsed } = useAppSelector((state) => state.theme);
  const dispatch = useAppDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => dispatch(toggleSidebar())}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className={cn(
        "transition-all duration-300 min-h-screen",
        // Desktop sidebar spacing
        "lg:ml-64",
        sidebarCollapsed && "lg:ml-16",
        // Mobile: no left margin, sidebar is overlay
        "ml-0"
      )}>
        <Header onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="p-4 sm:p-6 lg:p-8 w-full">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}