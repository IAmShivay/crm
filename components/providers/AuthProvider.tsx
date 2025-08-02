'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { loginSuccess, logout, loginStart } from '@/lib/slices/authSlice';
import { setCurrentWorkspace } from '@/lib/slices/workspaceSlice';
import { supabase } from '@/lib/supabase/client';
import { getUserWorkspaces } from '@/lib/supabase/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // Get user workspaces
        const { data: workspaces } = await getUserWorkspaces(session.user.id);
        
        dispatch(loginSuccess({
          user: {
            id: session.user.id,
            email: session.user.email!,
            name: profile?.full_name || session.user.email!,
            role: 'user',
            workspaceId: (workspaces?.[0] as any)?.workspaces?.id || '',
            permissions: [],
          },
          token: session.access_token,
        }));

        // Set current workspace
        if (workspaces?.[0]?.workspaces) {
          const workspace = (workspaces[0] as any).workspaces;
          dispatch(setCurrentWorkspace({
            id: workspace.id,
            name: workspace.name,
            plan: workspace.plan_id,
            memberCount: 1,
            createdAt: workspace.created_at,
          }));
        }
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          dispatch(loginStart());

          // Get user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          // Get user workspaces with role information
          const { data: workspaces } = await supabase
            .from('workspace_members')
            .select(`
              workspace_id,
              role_id,
              status,
              workspaces (
                id,
                name,
                plan_id,
                created_at
              ),
              roles (
                name,
                permissions
              )
            `)
            .eq('user_id', session.user.id)
            .eq('status', 'active');

          // Check for pending invitations
          const { data: pendingInvitations } = await supabase
            .from('invitations')
            .select('*')
            .eq('email', session.user.email)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString());

          // If user has pending invitations but no profile, redirect to setup
          if (pendingInvitations?.length && !profile?.full_name) {
            // Don't dispatch login success yet, let setup page handle it
            setLoading(false);
            return;
          }

          // Get user permissions from their roles
          const userPermissions = workspaces?.flatMap(ws =>
            (ws as any).roles?.permissions || []
          ) || [];

          dispatch(loginSuccess({
            user: {
              id: session.user.id,
              email: session.user.email!,
              name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email!,
              role: (workspaces?.[0] as any)?.roles?.name || 'user',
              workspaceId: (workspaces?.[0] as any)?.workspaces?.id || '',
              permissions: userPermissions,
            },
            token: session.access_token,
          }));

          // Set current workspace
          if (workspaces?.[0]?.workspaces) {
            const workspace = (workspaces[0] as any).workspaces;
            dispatch(setCurrentWorkspace({
              id: workspace.id,
              name: workspace.name,
              plan: workspace.plan_id,
              memberCount: 1,
              createdAt: workspace.created_at,
            }));
          }
        } else if (event === 'SIGNED_OUT') {
          dispatch(logout());
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}