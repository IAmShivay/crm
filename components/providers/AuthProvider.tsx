'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { loginSuccess, logout, loginStart } from '@/lib/slices/authSlice';
import { setCurrentWorkspace } from '@/lib/slices/workspaceSlice';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session from localStorage
    const getInitialSession = async () => {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');

      if (token && userData) {
        try {
          const user = JSON.parse(userData);

          dispatch(loginSuccess({
            user: {
              id: user.id,
              email: user.email,
              name: user.fullName || user.email,
              role: 'user',
              workspaceId: user.workspaceId || '',
              permissions: [],
            },
            token: token,
          }));

          // Set current workspace if available
          const workspaceData = localStorage.getItem('current_workspace');
          if (workspaceData) {
            const workspace = JSON.parse(workspaceData);
            dispatch(setCurrentWorkspace({
              id: workspace.id,
              name: workspace.name,
              plan: workspace.planId,
              memberCount: 1,
              createdAt: workspace.createdAt,
            }));
          }
        } catch (error) {
          console.error('Error loading user session:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('current_workspace');
        }
      }

      setLoading(false);
    };

    getInitialSession();

    // Listen for storage changes (for logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' && !e.newValue) {
        dispatch(logout());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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