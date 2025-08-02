'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Settings,
  Building,
  CreditCard,
  Menu,
  ChevronLeft,
  Briefcase,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Lead Sources', href: '/leads/sources', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Roles', href: '/roles', icon: UserCheck },
  { name: 'Workspace', href: '/workspace', icon: Building },
  { name: 'Plans', href: '/plans', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ collapsed, onToggle, mobileMenuOpen, onMobileMenuToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
      // Desktop behavior
      "hidden lg:flex flex-col",
      collapsed ? "lg:w-16" : "lg:w-64",
      // Mobile behavior - overlay when open
      mobileMenuOpen && "flex flex-col w-64",
      !mobileMenuOpen && "lg:flex"
    )}>
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">CRM Pro</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "shrink-0 h-5 w-5",
                  collapsed ? "mx-auto" : "mr-3",
                  isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                )} />
                {!collapsed && item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}