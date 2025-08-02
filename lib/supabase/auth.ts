import { supabase } from './client';
import { AuthError, Provider } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  workspaceName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface InviteUserData {
  email: string;
  roleId: string;
  workspaceId: string;
}

export interface SocialAuthOptions {
  provider: Provider;
  redirectTo?: string;
  scopes?: string;
  queryParams?: Record<string, string>;
}

// Sign up new user
export async function signUp({ email, password, fullName, workspaceName }: SignUpData) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          workspace_name: workspaceName,
        },
      },
    });

    if (error) throw error;

    // If workspace name provided, create workspace after user is created
    if (workspaceName && data.user) {
      const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      
      const { error: workspaceError } = await supabase.rpc('initialize_workspace', {
        p_workspace_name: workspaceName,
        p_workspace_slug: slug,
        p_owner_id: data.user.id,
      });

      if (workspaceError) {
        console.error('Error creating workspace:', workspaceError);
      }
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as AuthError };
  }
}

// Sign in user
export async function signIn({ email, password }: SignInData) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as AuthError };
  }
}

// Sign in with social provider
export async function signInWithSocial({ provider, redirectTo, scopes, queryParams }: SocialAuthOptions) {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        scopes,
        queryParams,
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as AuthError };
  }
}

// Sign up with social provider (same as sign in for OAuth)
export async function signUpWithSocial(options: SocialAuthOptions) {
  return signInWithSocial(options);
}

// Sign out user
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as AuthError };
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as AuthError };
  }
}

// Update password (for authenticated users)
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as AuthError };
  }
}

// Reset password with token (from email link)
export async function resetPassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as AuthError };
  }
}

// Get current user session
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error as AuthError };
  }
}

// Check if user has completed profile setup
export async function checkProfileSetup(userId: string) {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Check if user has workspaces
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspace_members')
      .select('workspace_id, workspaces(name)')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (workspaceError) throw workspaceError;

    return {
      hasProfile: !!profile?.full_name,
      hasWorkspace: (workspaces?.length || 0) > 0,
      workspaces: workspaces || [],
      error: null,
    };
  } catch (error) {
    return {
      hasProfile: false,
      hasWorkspace: false,
      workspaces: [],
      error: error as AuthError,
    };
  }
}

// Complete profile setup for social auth users
export async function completeProfileSetup(data: {
  userId: string;
  fullName: string;
  workspaceName?: string;
}) {
  try {
    // Get user email for invitation checking
    const { data: user } = await supabase.auth.getUser();
    const userEmail = user.user?.email;

    // Update user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: data.userId,
        full_name: data.fullName,
        updated_at: new Date().toISOString(),
      });

    if (profileError) throw profileError;

    // Check for pending invitations
    if (userEmail) {
      const { data: invitations } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', userEmail)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      // Accept all pending invitations
      if (invitations?.length) {
        for (const invitation of invitations) {
          const { error: acceptError } = await supabase.rpc('accept_invitation', {
            invitation_token: invitation.token
          });

          if (acceptError) {
            console.error('Error accepting invitation:', acceptError);
          }
        }
      }
    }

    // Create workspace if provided and user doesn't have any workspaces
    if (data.workspaceName) {
      const slug = data.workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

      const { error: workspaceError } = await supabase.rpc('initialize_workspace', {
        p_workspace_name: data.workspaceName,
        p_workspace_slug: slug,
        p_owner_id: data.userId,
      });

      if (workspaceError) throw workspaceError;
    }

    return { error: null };
  } catch (error) {
    return { error: error as AuthError };
  }
}

// Accept invitation by token (for social auth users)
export async function acceptInvitationByToken(token: string) {
  try {
    const { data, error } = await supabase.rpc('accept_invitation', {
      invitation_token: token
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as AuthError };
  }
}

// Get pending invitations for user email
export async function getPendingInvitations(email: string) {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        workspaces (
          id,
          name
        ),
        roles (
          name,
          description
        )
      `)
      .eq('email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as AuthError };
  }
}



// Get user profile
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update user profile
export async function updateUserProfile(userId: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Invite user to workspace
export async function inviteUser({ email, roleId, workspaceId }: InviteUserData) {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        workspace_id: workspaceId,
        email,
        role_id: roleId,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Accept invitation
export async function acceptInvitation(token: string) {
  try {
    const { data, error } = await supabase.rpc('accept_invitation', {
      invitation_token: token,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Get user workspaces
export async function getUserWorkspaces(userId: string) {
  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        status,
        role_id,
        workspaces (
          id,
          name,
          slug,
          plan_id,
          subscription_status
        ),
        roles (
          id,
          name,
          permissions
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Check user permissions
export async function checkUserPermission(userId: string, workspaceId: string, permission: string) {
  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        roles (
          permissions
        )
      `)
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .single();

    if (error) throw error;

    const permissions = data?.roles?.permissions || [];
    const hasPermission = permissions.includes(permission) || permissions.includes('*:*');

    return { hasPermission, error: null };
  } catch (error) {
    return { hasPermission: false, error };
  }
}