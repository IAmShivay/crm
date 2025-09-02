'use client';

import { useState } from 'react';
import { Bell, Search, User, ChevronDown, Menu, Building, Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/ui/notification-bell';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { logout } from '@/lib/slices/authSlice';
import { setCurrentWorkspace } from '@/lib/slices/workspaceSlice';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

// Workspace creation validation schema
const workspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .min(2, 'Workspace name must be at least 2 characters')
    .max(50, 'Workspace name is too long')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Workspace name can only contain letters, numbers, spaces, hyphens, and underscores')
    .trim(),
  description: z
    .string()
    .max(200, 'Description is too long')
    .optional()
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user } = useAppSelector((state) => state.auth);
  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // State for workspace creation dialog
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // Form for workspace creation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema)
  });

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  // Handle workspace creation
  const onCreateWorkspace = async (data: WorkspaceFormData) => {
    setIsCreatingWorkspace(true);

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          name: data.name.trim(),
          description: data.description?.trim() || '',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create workspace');
      }

      const result = await response.json();

      // Update current workspace in Redux
      dispatch(setCurrentWorkspace({
        id: result.workspace.id,
        name: result.workspace.name,
        plan: result.workspace.planId || 'free',
        memberCount: 1,
        createdAt: result.workspace.createdAt,
      }));

      toast.success('Workspace created successfully!');
      setIsCreateWorkspaceOpen(false);
      reset();

      // Optionally redirect to workspace settings
      // router.push('/workspace');

    } catch (error) {
      console.error('Workspace creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create workspace');
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2"
            onClick={onMobileMenuToggle}
            aria-label="Toggle mobile menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search bar - responsive */}
          <div className="relative flex-1 max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="search"
              placeholder="Search leads, contacts..."
              className="pl-10 w-full"
            />
          </div>

          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="sm"
            className="sm:hidden p-2"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Notifications */}
        <NotificationBell />

        {/* User Menu - responsive */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarImage src="/avatars/01.png" alt={user?.name} />
                <AvatarFallback className="text-xs sm:text-sm">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs sm:text-sm font-medium hidden sm:block">
                {user?.name}
              </span>
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
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

    {/* Workspace Creation Dialog */}
    <Dialog open={isCreateWorkspaceOpen} onOpenChange={setIsCreateWorkspaceOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Create New Workspace</span>
          </DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your team and projects.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onCreateWorkspace)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name *</Label>
            <Input
              id="workspace-name"
              placeholder="Enter workspace name"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-description">Description (Optional)</Label>
            <Input
              id="workspace-description"
              placeholder="Describe your workspace"
              {...register('description')}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateWorkspaceOpen(false);
                reset();
              }}
              disabled={isCreatingWorkspace}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreatingWorkspace}
              className="min-w-[100px]"
            >
              {isCreatingWorkspace ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </>
  );
}