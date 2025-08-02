import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '@/lib/supabase/client';

export interface Lead {
  id: string;
  workspace_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  source: string;
  value: number;
  assigned_to?: string;
  tags: string[];
  notes?: string;
  custom_fields: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  workspace_id?: string;
  is_system: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan_id: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  workspace_id: string;
  user_id?: string;
  entity_type: string;
  entity_id?: string;
  action: string;
  description: string;
  metadata: any;
  created_at: string;
}

export interface LeadSource {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export const supabaseApi = createApi({
  reducerPath: 'supabaseApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Lead', 'Role', 'Workspace', 'Activity', 'LeadSource', 'User'],
  endpoints: (builder) => ({
    // Leads
    getLeads: builder.query<Lead[], { workspaceId: string; status?: string }>({
      queryFn: async ({ workspaceId, status }) => {
        let query = supabase
          .from('leads')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { data: data || [] };
      },
      providesTags: ['Lead'],
    }),

    createLead: builder.mutation<Lead, Partial<Lead> & { workspace_id: string }>({
      queryFn: async (lead) => {
        const { data, error } = await supabase
          .from('leads')
          .insert(lead)
          .select()
          .single();

        if (error) return { error: error.message };
        return { data };
      },
      invalidatesTags: ['Lead'],
    }),

    updateLead: builder.mutation<Lead, { id: string; updates: Partial<Lead> }>({
      queryFn: async ({ id, updates }) => {
        const { data, error } = await supabase
          .from('leads')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) return { error: error.message };
        return { data };
      },
      invalidatesTags: ['Lead'],
    }),

    deleteLead: builder.mutation<void, string>({
      queryFn: async (id) => {
        const { error } = await supabase
          .from('leads')
          .delete()
          .eq('id', id);

        if (error) return { error: error.message };
        return { data: undefined };
      },
      invalidatesTags: ['Lead'],
    }),

    // Roles
    getRoles: builder.query<Role[], string>({
      queryFn: async (workspaceId) => {
        const { data, error } = await supabase
          .from('roles')
          .select('*')
          .or(`workspace_id.eq.${workspaceId},is_system.eq.true`)
          .order('name');

        if (error) return { error: error.message };
        return { data: data || [] };
      },
      providesTags: ['Role'],
    }),

    createRole: builder.mutation<Role, Partial<Role> & { workspace_id: string }>({
      queryFn: async (role) => {
        const { data, error } = await supabase
          .from('roles')
          .insert(role)
          .select()
          .single();

        if (error) return { error: error.message };
        return { data };
      },
      invalidatesTags: ['Role'],
    }),

    updateRole: builder.mutation<Role, { id: string; updates: Partial<Role> }>({
      queryFn: async ({ id, updates }) => {
        const { data, error } = await supabase
          .from('roles')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) return { error: error.message };
        return { data };
      },
      invalidatesTags: ['Role'],
    }),

    deleteRole: builder.mutation<void, string>({
      queryFn: async (id) => {
        const { error } = await supabase
          .from('roles')
          .delete()
          .eq('id', id);

        if (error) return { error: error.message };
        return { data: undefined };
      },
      invalidatesTags: ['Role'],
    }),

    // Workspaces
    getUserWorkspaces: builder.query<Workspace[], string>({
      queryFn: async (userId) => {
        const { data, error } = await supabase
          .from('workspace_members')
          .select(`
            workspaces (
              id,
              name,
              slug,
              plan_id,
              subscription_status,
              created_at,
              updated_at
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'active');

        if (error) return { error: error.message };
        return { data: data?.map(item => item.workspaces).filter(Boolean) || [] };
      },
      providesTags: ['Workspace'],
    }),

    // Activities
    getActivities: builder.query<Activity[], { workspaceId: string; limit?: number }>({
      queryFn: async ({ workspaceId, limit = 50 }) => {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) return { error: error.message };
        return { data: data || [] };
      },
      providesTags: ['Activity'],
    }),

    // Lead Sources
    getLeadSources: builder.query<LeadSource[], string>({
      queryFn: async (workspaceId) => {
        const { data, error } = await supabase
          .from('lead_sources')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('is_active', true)
          .order('name');

        if (error) return { error: error.message };
        return { data: data || [] };
      },
      providesTags: ['LeadSource'],
    }),

    createLeadSource: builder.mutation<LeadSource, Partial<LeadSource> & { workspace_id: string }>({
      queryFn: async (source) => {
        const { data, error } = await supabase
          .from('lead_sources')
          .insert(source)
          .select()
          .single();

        if (error) return { error: error.message };
        return { data };
      },
      invalidatesTags: ['LeadSource'],
    }),

    updateLeadSource: builder.mutation<LeadSource, { id: string; updates: Partial<LeadSource> }>({
      queryFn: async ({ id, updates }) => {
        const { data, error } = await supabase
          .from('lead_sources')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) return { error: error.message };
        return { data };
      },
      invalidatesTags: ['LeadSource'],
    }),

    deleteLeadSource: builder.mutation<void, string>({
      queryFn: async (id) => {
        const { error } = await supabase
          .from('lead_sources')
          .delete()
          .eq('id', id);

        if (error) return { error: error.message };
        return { data: undefined };
      },
      invalidatesTags: ['LeadSource'],
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetUserWorkspacesQuery,
  useGetActivitiesQuery,
  useGetLeadSourcesQuery,
  useCreateLeadSourceMutation,
  useUpdateLeadSourceMutation,
  useDeleteLeadSourceMutation,
} = supabaseApi;