import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';

// API Types
export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
  statusId?: string;
  source: string;
  value?: number;
  assignedTo?: string;
  tags?: string[];
  tagIds?: string[];
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  nextFollowUpAt?: string;
  customFields?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  workspaceId: string;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadStatus {
  id: string;
  name: string;
  color: string;
  description?: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadStatus {
  id: string;
  name: string;
  color: string;
  description?: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  entityType: string;
  entityId: string;
  workspaceId: string;
  userId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export const mongoApi = createApi({
  reducerPath: 'mongoApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Lead', 'Role', 'Workspace', 'Activity', 'User', 'LeadStatus', 'Tag'],
  endpoints: (builder) => ({
    // Leads
    getLeads: builder.query<{ leads: Lead[]; pagination: any }, { workspaceId: string; page?: number; limit?: number; status?: string; search?: string }>({
      query: ({ workspaceId, page = 1, limit = 20, status, search }) => {
        const params = new URLSearchParams({
          workspaceId,
          page: page.toString(),
          limit: limit.toString(),
        });
        if (status) params.append('status', status);
        if (search) params.append('search', search);
        return `leads?${params}`;
      },
      providesTags: ['Lead'],
    }),

    createLead: builder.mutation<{ lead: Lead }, Partial<Lead> & { workspaceId: string }>({
      query: (leadData) => ({
        url: `leads?workspaceId=${leadData.workspaceId}`,
        method: 'POST',
        body: leadData,
      }),
      invalidatesTags: ['Lead'],
    }),

    updateLead: builder.mutation<{ lead: Lead }, { id: string; workspaceId: string } & Partial<Lead>>({
      query: ({ id, workspaceId, ...updates }) => ({
        url: `leads/${id}?workspaceId=${workspaceId}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['Lead'],
    }),

    deleteLead: builder.mutation<void, { id: string; workspaceId: string }>({
      query: ({ id, workspaceId }) => ({
        url: `leads/${id}?workspaceId=${workspaceId}`,
        method: 'DELETE',
      }),
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
    deleteRole: builder.mutation<{ success: boolean }, { id: string; workspaceId: string }>({
      query: ({ id, workspaceId }) => ({
        url: `roles/${id}?workspaceId=${workspaceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Role'],
    }),

    // Workspaces
    getUserWorkspaces: builder.query<{ success: boolean; workspaces: Workspace[] }, string>({
      query: (userId) => `workspaces?userId=${userId}`,
      providesTags: ['Workspace'],
    }),

    // Lead Statuses
    getLeadStatuses: builder.query<{ success: boolean; statuses: LeadStatus[] }, string>({
      query: (workspaceId) => `lead-statuses?workspaceId=${workspaceId}`,
      providesTags: ['LeadStatus'],
    }),
    createLeadStatus: builder.mutation<{ success: boolean; status: LeadStatus }, Partial<LeadStatus>>({
      query: (status) => ({
        url: `lead-statuses?workspaceId=${status.workspaceId}`,
        method: 'POST',
        body: status,
      }),
      invalidatesTags: ['LeadStatus'],
    }),
    deleteLeadStatus: builder.mutation<{ success: boolean }, { id: string; workspaceId: string }>({
      query: ({ id, workspaceId }) => ({
        url: `lead-statuses/${id}?workspaceId=${workspaceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LeadStatus'],
    }),

    // Tags
    getTags: builder.query<{ success: boolean; tags: Tag[] }, string>({
      query: (workspaceId) => `tags?workspaceId=${workspaceId}`,
      providesTags: ['Tag'],
    }),
    createTag: builder.mutation<{ success: boolean; tag: Tag }, Partial<Tag>>({
      query: (tag) => ({
        url: `tags?workspaceId=${tag.workspaceId}`,
        method: 'POST',
        body: tag,
      }),
      invalidatesTags: ['Tag'],
    }),
    deleteTag: builder.mutation<{ success: boolean }, { id: string; workspaceId: string }>({
      query: ({ id, workspaceId }) => ({
        url: `tags/${id}?workspaceId=${workspaceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tag'],
    }),

    // Activities
    getActivities: builder.query<{ success: boolean; activities: Activity[] }, { workspaceId: string; limit?: number }>({
      query: ({ workspaceId, limit = 50 }) => `activities?workspaceId=${workspaceId}&limit=${limit}`,
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
  useDeleteRoleMutation,
  useGetUserWorkspacesQuery,
  useGetLeadStatusesQuery,
  useCreateLeadStatusMutation,
  useDeleteLeadStatusMutation,
  useGetTagsQuery,
  useCreateTagMutation,
  useDeleteTagMutation,
  useGetActivitiesQuery,
} = mongoApi;

// Mock exports for features not yet implemented


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



