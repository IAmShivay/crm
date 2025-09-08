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
  BarChart3,
  Webhook,
  Tag,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { UserProfile } from './UserProfile';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Lead Statuses', href: '/leads/statuses', icon: Circle },
  { name: 'Lead Tags', href: '/leads/tags', icon: Tag },
  { name: 'Webhooks', href: '/webhooks', icon: Webhook },
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
      "fixed inset-y-0 left-0 z-50 bg-background dark:bg-gray-900 border-r border-border dark:border-gray-800 transition-all duration-300",
      // Desktop behavior
      "hidden lg:flex flex-col",
      collapsed ? "lg:w-16" : "lg:w-64",
      // Mobile behavior - overlay when open
      mobileMenuOpen && "flex flex-col w-64",
      !mobileMenuOpen && "lg:flex"
    )}>
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-border dark:border-gray-800">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Briefcase className="h-8 w-8 text-primary dark:text-blue-400" />
              <span className="text-xl font-bold text-foreground dark:text-white">CRM Pro</span>
            </div>
          )}
          {/* Only show toggle on desktop */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="hidden lg:flex h-8 w-8 p-0"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Workspace Switcher */}
        {!collapsed && (
          <div className="border-b border-border dark:border-gray-800 pb-4">
            <WorkspaceSwitcher
              className="px-2"
              showCreateButton={true}
              compact={false}
            />
          </div>
        )}

        {/* Collapsed workspace indicator */}
        {collapsed && (
          <div className="px-2 py-4 border-b border-border dark:border-gray-800">
            <WorkspaceSwitcher
              className=""
              showCreateButton={false}
              compact={true}
            />
          </div>
        )}

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
                    ? "bg-primary/10 dark:bg-blue-900/20 text-primary dark:text-blue-400"
                    : "text-muted-foreground dark:text-gray-400 hover:bg-accent dark:hover:bg-gray-800 hover:text-accent-foreground dark:hover:text-gray-200"
                )}
              >
                <item.icon className={cn(
                  "shrink-0 h-5 w-5",
                  collapsed ? "mx-auto" : "mr-3",
                  isActive ? "text-primary dark:text-blue-400" : "text-muted-foreground dark:text-gray-400 group-hover:text-foreground dark:group-hover:text-gray-200"
                )} />
                {!collapsed && item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile - Bottom of sidebar */}
        <div className="mt-auto">
          <UserProfile compact={collapsed} />
        </div>
      </div>
    </div>
  );
}