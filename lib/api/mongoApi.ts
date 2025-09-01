import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { mongoClient } from '../mongodb/client';
import { 
  type ILead, 
  type IRole, 
  type IWorkspace, 
  type IActivity, 
  type IUser 
} from '../mongodb/models';

// Types matching your existing interfaces
export interface Lead extends Omit<ILead, '_id'> {
  id: string;
}

export interface Role extends Omit<IRole, '_id'> {
  id: string;
}

export interface Workspace extends Omit<IWorkspace, '_id'> {
  id: string;
}

export interface Activity extends Omit<IActivity, '_id'> {
  id: string;
}

export interface User extends Omit<IUser, '_id' | 'password'> {
  id: string;
}

export const mongoApi = createApi({
  reducerPath: 'mongoApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Lead', 'Role', 'Workspace', 'Activity', 'User'],
  endpoints: (builder) => ({
    // Leads
    getLeads: builder.query<Lead[], { workspaceId: string; status?: string }>({
      queryFn: async ({ workspaceId, status }) => {
        try {
          const leads = await mongoClient.getLeads(workspaceId, { status });
          return {
            data: leads.map(lead => ({ ...lead.toJSON(), id: lead._id.toString() })) as Lead[]
          };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Failed to fetch leads' };
        }
      },
      providesTags: ['Lead'],
    }),

    createLead: builder.mutation<Lead, Partial<Lead> & { workspaceId: string }>({
      queryFn: async (leadData) => {
        try {
          const lead = await mongoClient.createLead(leadData);
          return {
            data: { ...lead.toJSON(), id: lead._id.toString() } as Lead
          };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Failed to create lead' };
        }
      },
      invalidatesTags: ['Lead'],
    }),

    updateLead: builder.mutation<Lead, { id: string } & Partial<Lead>>({
      queryFn: async ({ id, ...updates }) => {
        try {
          const lead = await mongoClient.updateLead(id, updates);
          if (!lead) {
            return { error: 'Lead not found' };
          }
          return { data: { ...lead.toJSON(), id: lead._id.toString() } as Lead };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Failed to update lead' };
        }
      },
      invalidatesTags: ['Lead'],
    }),

    deleteLead: builder.mutation<void, string>({
      queryFn: async (id) => {
        try {
          const success = await mongoClient.deleteLead(id);
          if (!success) {
            return { error: 'Lead not found' };
          }
          return { data: undefined };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Failed to delete lead' };
        }
      },
      invalidatesTags: ['Lead'],
    }),

    // Roles
    getRoles: builder.query<Role[], string>({
      queryFn: async (workspaceId) => {
        try {
          const roles = await mongoClient.getRolesByWorkspace(workspaceId);
          return { data: roles.map(role => ({ ...role.toJSON(), id: role._id.toString() })) as Role[] };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Failed to fetch roles' };
        }
      },
      providesTags: ['Role'],
    }),

    createRole: builder.mutation<Role, Partial<Role> & { workspaceId: string }>({
      queryFn: async (roleData) => {
        try {
          const role = await mongoClient.createRole(roleData);
          return { data: { ...role.toJSON(), id: role._id.toString() } as Role };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Failed to create role' };
        }
      },
      invalidatesTags: ['Role'],
    }),

    // Workspaces
    getUserWorkspaces: builder.query<Workspace[], string>({
      queryFn: async (userId) => {
        try {
          const workspaces = await mongoClient.getUserWorkspaces(userId);
          return { data: workspaces.map(workspace => ({ ...workspace.toJSON(), id: workspace._id.toString() })) as Workspace[] };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Failed to fetch workspaces' };
        }
      },
      providesTags: ['Workspace'],
    }),

    // Activities
    getActivities: builder.query<Activity[], { workspaceId: string; limit?: number }>({
      queryFn: async ({ workspaceId, limit = 50 }) => {
        try {
          const activities = await mongoClient.getActivities(workspaceId, limit);
          return { data: activities.map(activity => ({ ...activity.toJSON(), id: activity._id.toString() })) as Activity[] };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Failed to fetch activities' };
        }
      },
      providesTags: ['Activity'],
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
  useGetUserWorkspacesQuery,
  useGetActivitiesQuery,
} = mongoApi;

// Mock exports for features not yet implemented
export const useGetLeadSourcesQuery = (_workspaceId?: string, _options?: any) => ({
  data: [
    { id: '1', name: 'Website', description: 'Website form submissions', color: '#3b82f6', is_active: true, created_at: '2024-01-01T00:00:00Z' },
    { id: '2', name: 'Social Media', description: 'Social media campaigns', color: '#8b5cf6', is_active: true, created_at: '2024-01-01T00:00:00Z' },
    { id: '3', name: 'Referral', description: 'Customer referrals', color: '#10b981', is_active: true, created_at: '2024-01-01T00:00:00Z' },
    { id: '4', name: 'Cold Outreach', description: 'Cold email/calling', color: '#f59e0b', is_active: false, created_at: '2024-01-01T00:00:00Z' }
  ],
  isLoading: false,
  error: null
});

export const useGetPermissionsQuery = () => ({
  data: [
    { id: 'leads:create', name: 'Create Leads', category: 'Leads' },
    { id: 'leads:read', name: 'View Leads', category: 'Leads' },
    { id: 'leads:update', name: 'Update Leads', category: 'Leads' },
    { id: 'leads:delete', name: 'Delete Leads', category: 'Leads' },
    { id: 'users:create', name: 'Create Users', category: 'Users' },
    { id: 'users:read', name: 'View Users', category: 'Users' },
    { id: 'users:update', name: 'Update Users', category: 'Users' },
    { id: 'users:delete', name: 'Delete Users', category: 'Users' },
    { id: 'roles:create', name: 'Create Roles', category: 'Roles' },
    { id: 'roles:read', name: 'View Roles', category: 'Roles' },
    { id: 'roles:update', name: 'Update Roles', category: 'Roles' },
    { id: 'roles:delete', name: 'Delete Roles', category: 'Roles' },
  ],
  isLoading: false,
  error: null
});
export const useDeleteRoleMutation = () => [
  async (_data: any) => Promise.resolve(),
  { isLoading: false }
] as const;

export const useCreateLeadSourceMutation = () => [
  async (_data: any) => Promise.resolve(),
  { isLoading: false }
] as const;

export const useUpdateLeadSourceMutation = () => [
  async (_data: any) => Promise.resolve(),
  { isLoading: false }
] as const;

export const useDeleteLeadSourceMutation = () => [
  async (_data: any) => Promise.resolve(),
  { isLoading: false }
] as const;
