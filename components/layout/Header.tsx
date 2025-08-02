'use client';

import { Bell, Search, User, ChevronDown, Menu, Building, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { logout } from '@/lib/slices/authSlice';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user } = useAppSelector((state) => state.auth);
  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center space-x-4 flex-1">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search leads, contacts..."
            className="pl-10 w-full"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </Button>

        {/* Workspace Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center space-x-2 max-w-48">
              <Building className="h-4 w-4" />
              <span className="truncate text-sm font-medium">
                {currentWorkspace?.name || 'Select workspace'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Current Workspace */}
            {currentWorkspace && (
              <DropdownMenuItem className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>{currentWorkspace.name}</span>
                </div>
                <Check className="h-4 w-4 text-green-600" />
              </DropdownMenuItem>
            )}

            {/* Mock additional workspaces */}
            <DropdownMenuItem className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Demo Workspace 2</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Personal Workspace</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center space-x-2 text-blue-600">
              <Plus className="h-4 w-4" />
              <span>Create new workspace</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/01.png" alt={user?.name} />
                <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user?.name}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}