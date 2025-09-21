'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Settings,
  Building,
  CreditCard,
  Menu,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Briefcase,
  BarChart3,
  Webhook,
  Tag,
  Circle,
  Contact,
  TrendingUp,
  UserPlus,
  Settings2,
  Phone,
  Mail,
  FolderKanban
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
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'main' },
  
  // Sales Section
  { name: 'Sales', href: '/sales', icon: TrendingUp, category: 'section', id: 'sales' },
  { name: 'Leads', href: '/leads', icon: Users, category: 'sales', parent: 'sales' },
  { name: 'Contacts', href: '/contacts', icon: Contact, category: 'sales', parent: 'sales' },
  { name: 'Lead Statuses', href: '/leads/statuses', icon: Circle, category: 'sales', parent: 'sales' },
  { name: 'Lead Tags', href: '/leads/tags', icon: Tag, category: 'sales', parent: 'sales' },
  { name: 'Webhooks', href: '/webhooks', icon: Webhook, category: 'sales', parent: 'sales' },
  
  // HR and Engines as regular tabs
  { name: 'HR', href: '/hr', icon: UserPlus, category: 'main' },
  { name: 'Engines', href: '/engines', icon: Settings2, category: 'main' },
  
  // Communication
  { name: 'Calls', href: '/calls', icon: Phone, category: 'main' },
  { name: 'Email', href: '/email', icon: Mail, category: 'main' },
  
  // Project Management
  { name: 'Project Management', href: '/projects', icon: FolderKanban, category: 'main' },
  
  // Other sections
  { name: 'Analytics', href: '/analytics', icon: BarChart3, category: 'main' },
  { name: 'Roles', href: '/roles', icon: UserCheck, category: 'main' },
  { name: 'Workspace', href: '/workspace', icon: Building, category: 'main' },
  // { name: 'Plans', href: '/plans', icon: CreditCard }, // Hidden for now
  { name: 'Settings', href: '/settings', icon: Settings, category: 'main' },
];

export function Sidebar({ collapsed, onToggle, mobileMenuOpen, onMobileMenuToggle }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sales: true, // Sales expanded by default
    hr: false,
    engines: false
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const renderNavItem = (item: any) => {
    const isActive = pathname === item.href;
    const isSection = item.category === 'section';
    const isSubItem = item.parent;
    const isExpanded = item.id ? expandedSections[item.id] : false;
    const hasSubItems = navigation.some(nav => nav.parent === item.id);
    
    // Don't render sub-items if their parent section is collapsed
    if (isSubItem && !expandedSections[item.parent]) {
      return null;
    }

    if (isSection) {
      return (
        <div key={item.name} className="mb-2">
          <button
            onClick={() => hasSubItems && toggleSection(item.id)}
            className={cn(
              "group flex items-center w-full px-3 py-3 text-sm font-semibold rounded-xl transition-all duration-300 mt-4 mb-2",
              hasSubItems ? "hover:bg-primary/30 dark:hover:bg-primary/40 hover:text-white dark:hover:text-white cursor-pointer hover:shadow-md hover:transform hover:scale-[1.01]" : "cursor-default",
              "text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs"
            )}
          >
            <item.icon className={cn(
              "shrink-0 h-5 w-5 transition-all duration-300",
              collapsed ? "mx-auto" : "mr-3",
              "text-gray-500 dark:text-gray-500 group-hover:text-white dark:group-hover:text-white"
            )} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.name}</span>
                {hasSubItems && (
                  <span className="ml-auto transition-all duration-300 group-hover:scale-110">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-500 group-hover:text-white dark:group-hover:text-white" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-500 group-hover:text-white dark:group-hover:text-white" />
                    )}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      );
    }
    
    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          "group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden",
          isSubItem && "ml-6 py-2.5 rounded-lg",
          isActive
            ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25 transform scale-[1.02]"
            : "text-gray-700 dark:text-gray-300 hover:bg-primary/30 dark:hover:bg-primary/40 hover:text-white dark:hover:text-white hover:shadow-md hover:transform hover:scale-[1.01]"
        )}
      >
        {isSubItem && !collapsed && (
          <div className="flex items-center mr-2">
            <div className="w-3 h-3 border-l-2 border-b-2 border-gray-400 dark:border-gray-500 group-hover:border-white rounded-bl-sm"></div>
          </div>
        )}
        <item.icon className={cn(
          "shrink-0 h-5 w-5 transition-all duration-300",
          collapsed ? "mx-auto" : isSubItem ? "mr-3" : "mr-3",
          isActive 
            ? "text-white drop-shadow-sm" 
            : "text-gray-500 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white"
        )} />
        {!collapsed && (
          <span className="font-medium tracking-wide">{item.name}</span>
        )}
        {isActive && !collapsed && (
          <div className="absolute right-2 w-1 h-6 bg-white/30 rounded-full"></div>
        )}
      </Link>
    );
  };

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-950 shadow-xl transition-all duration-300",
      // Desktop behavior
      "hidden lg:flex flex-col",
      collapsed ? "lg:w-16" : "lg:w-64",
      // Mobile behavior - overlay when open
      mobileMenuOpen && "flex flex-col w-64",
      !mobileMenuOpen && "lg:flex"
    )}>
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between px-4 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-primary rounded-lg shadow-lg">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">CRM Pro</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto p-1.5 bg-primary rounded-lg shadow-lg">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
          )}
          {/* Only show toggle on desktop */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="hidden lg:flex h-9 w-9 p-0 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-all duration-200"
          >
            {collapsed ? <Menu className="h-4 w-4 text-gray-600 dark:text-gray-300" /> : <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />}
          </Button>
        </div>

        {/* Workspace Switcher */}
        {!collapsed && (
          <div className="px-3 py-3 bg-gray-50/50 dark:bg-gray-900/30">
            <div className="hover:bg-primary/30 dark:hover:bg-primary/40 hover:text-white rounded-lg px-2 py-1 transition-all duration-200 group">
              <WorkspaceSwitcher
                className="[&_*]:group-hover:text-white [&_svg]:group-hover:text-white"
                showCreateButton={true}
                compact={false}
              />
            </div>
          </div>
        )}

        {/* Collapsed workspace indicator */}
        {collapsed && (
          <div className="px-2 py-3 bg-gray-50/50 dark:bg-gray-900/30">
            <div className="hover:bg-primary/30 dark:hover:bg-primary/40 hover:text-white rounded-lg px-2 py-1 transition-all duration-200 group">
              <WorkspaceSwitcher
                className="[&_*]:group-hover:text-white [&_svg]:group-hover:text-white"
                showCreateButton={false}
                compact={true}
              />
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => renderNavItem(item))}
          </div>
        </nav>

        {/* User Profile - Bottom of sidebar */}
        <div className="mt-auto p-3 bg-gradient-to-t from-gray-50/80 to-transparent dark:from-gray-900/50">
          <UserProfile compact={collapsed} />
        </div>
      </div>
    </div>
  );
}