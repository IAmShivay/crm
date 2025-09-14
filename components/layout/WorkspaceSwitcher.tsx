/**
 * Workspace Switcher Component for Sidebar
 * 
 * Features:
 * - Workspace selection and switching
 * - Create new workspace functionality
 * - Responsive design for mobile and desktop
 * - Loading states and error handling
 * - Keyboard navigation support
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WorkspaceSwitcherSkeleton } from '@/components/ui/skeleton';
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
import { 
  Building, 
  ChevronDown, 
  Plus, 
  Check, 
  Loader2,
  Users,
  Settings
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setCurrentWorkspace } from '@/lib/slices/workspaceSlice';
import { useGetUserWorkspacesQuery, useCreateWorkspaceMutation, Workspace as ApiWorkspace } from '@/lib/api/mongoApi';
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

interface Workspace {
  id: string;
  name: string;
  slug: string;
  planId: string;
  subscriptionStatus: string;
  createdAt: string;
  memberCount?: number;
}

interface WorkspaceSwitcherProps {
  className?: string;
  showCreateButton?: boolean;
  compact?: boolean;
}

export function WorkspaceSwitcher({
  className = '',
  showCreateButton = true,
  compact = false
}: WorkspaceSwitcherProps) {
  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // RTK Query hooks
  const { data: workspacesData, isLoading, refetch } = useGetUserWorkspacesQuery(user?.id || '', {
    skip: !user?.id
  });
  const [createWorkspace, { isLoading: isCreatingWorkspace }] = useCreateWorkspaceMutation();

  // State management
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const workspaces = workspacesData?.workspaces || [];

  // Form for workspace creation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema)
  });

  // No need for manual loading - RTK Query handles it automatically

  // Handle workspace switching
  const handleWorkspaceSwitch = async (workspace: ApiWorkspace) => {
    if (workspace.id === currentWorkspace?.id) return;

    try {
      setIsSwitching(true);

      // Update Redux state
      dispatch(setCurrentWorkspace({
        id: workspace.id,
        name: workspace.name,
        plan: 'free', // Default plan since API workspace doesn't have planId
        memberCount: 1, // Default member count
        createdAt: workspace.createdAt,
      }));

      // Store in localStorage for persistence
      localStorage.setItem('current_workspace', JSON.stringify(workspace));
      
      toast.success(`Switched to ${workspace.name}`);
    } catch (error) {
      console.error('Error switching workspace:', error);
      toast.error('Failed to switch workspace');
    } finally {
      setIsSwitching(false);
    }
  };

  // Handle workspace creation
  const onCreateWorkspace = async (data: WorkspaceFormData) => {
    try {
      const result = await createWorkspace({
        name: data.name.trim(),
        description: data.description?.trim() || '',
      }).unwrap();

      // Switch to new workspace
      dispatch(setCurrentWorkspace({
        id: result.workspace.id,
        name: result.workspace.name,
        plan: result.workspace.planId,
        memberCount: 1,
        createdAt: result.workspace.createdAt,
      }));

      toast.success('Workspace created successfully!');
      setIsCreateDialogOpen(false);
      reset();

    } catch (error: any) {
      console.error('Workspace creation error:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to create workspace';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return <WorkspaceSwitcherSkeleton className={className} />;
  }

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        {/* Current Workspace Display */}
        <div className={compact ? "px-1 py-2" : "px-3 py-2"}>
          {!compact && (
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Workspace
            </p>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full ${compact ? 'justify-center p-2' : 'justify-between h-auto p-2'} ${compact ? 'text-xs' : 'text-sm'}`}
                disabled={isSwitching}
                title={compact ? currentWorkspace?.name || 'Select Workspace' : undefined}
              >
                {compact ? (
                  // Compact mode - just icon
                  <div className="flex items-center justify-center">
                    {isSwitching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Building className="h-4 w-4" />
                    )}
                  </div>
                ) : (
                  // Full mode - icon, text, and chevron
                  <>
                    <div className="flex items-center space-x-2 min-w-0">
                      <Building className="h-4 w-4 flex-shrink-0" />
                      <div className="text-left min-w-0">
                        <p className="font-medium truncate">
                          {currentWorkspace?.name || 'Select Workspace'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          Free Plan
                        </p>
                      </div>
                    </div>
                    {isSwitching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    )}
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => handleWorkspaceSwitch(workspace)}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <Building className="h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{workspace.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        Free Plan • 1 member
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {workspace.id === currentWorkspace?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/workspace');
                        }}
                        title="Workspace Settings"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    )}
                    {workspace.id === currentWorkspace?.id && (
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              
              {showCreateButton && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center space-x-2 text-blue-600 cursor-pointer"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create new workspace</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick Actions */}
        {!compact && currentWorkspace && (
          <div className="px-3 space-y-1">
            {/* <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => window.location.href = '/workspace'}
            >
              <Settings className="h-3 w-3 mr-2" />
              Workspace Settings
            </Button> */}
          </div>
        )}
      </div>

      {/* Enhanced Workspace Creation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
              <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              Create New Workspace
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Set up a new workspace to organize your team, projects, and leads in one place.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onCreateWorkspace)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name" className="text-sm font-medium">
                  Workspace Name *
                </Label>
                <Input
                  id="workspace-name"
                  placeholder="e.g., Acme Sales Team"
                  {...register('name')}
                  className={`h-11 ${errors.name ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                  disabled={isCreatingWorkspace}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    <span>{errors.name.message}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspace-description" className="text-sm font-medium">
                  Description <span className="text-gray-400">(Optional)</span>
                </Label>
                <Input
                  id="workspace-description"
                  placeholder="Brief description of your workspace"
                  {...register('description')}
                  className={`h-11 ${errors.description ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                  disabled={isCreatingWorkspace}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    <span>{errors.description.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Features Preview */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Your workspace will include:
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li className="flex items-center space-x-2">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Lead management and tracking</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Team collaboration tools</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Analytics and reporting</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  reset();
                }}
                disabled={isCreatingWorkspace}
                className="h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingWorkspace}
                className="h-11 min-w-[140px] bg-blue-600 hover:bg-blue-700"
              >
                {isCreatingWorkspace ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Create Workspace</span>
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
