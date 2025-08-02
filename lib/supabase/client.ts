import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client
export const supabase = createClientComponentClient();

// Server-side Supabase client with service role (for admin operations)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database types (will be generated from Supabase)
export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan_id: string;
          subscription_status: string;
          dodo_customer_id: string | null;
          dodo_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan_id?: string;
          subscription_status?: string;
          dodo_customer_id?: string | null;
          dodo_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan_id?: string;
          subscription_status?: string;
          dodo_customer_id?: string | null;
          dodo_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role_id: string | null;
          status: string;
          invited_by: string | null;
          invited_at: string;
          joined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role_id?: string | null;
          status?: string;
          invited_by?: string | null;
          invited_at?: string;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role_id?: string | null;
          status?: string;
          invited_by?: string | null;
          invited_at?: string;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          status: string;
          source: string;
          value: number;
          assigned_to: string | null;
          tags: string[];
          notes: string | null;
          custom_fields: any;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          status?: string;
          source?: string;
          value?: number;
          assigned_to?: string | null;
          tags?: string[];
          notes?: string | null;
          custom_fields?: any;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          status?: string;
          source?: string;
          value?: number;
          assigned_to?: string | null;
          tags?: string[];
          notes?: string | null;
          custom_fields?: any;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          workspace_id: string | null;
          is_system: boolean;
          permissions: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          workspace_id?: string | null;
          is_system?: boolean;
          permissions?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          workspace_id?: string | null;
          is_system?: boolean;
          permissions?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          timezone: string;
          preferences: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          preferences?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          preferences?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string | null;
          entity_type: string;
          entity_id: string | null;
          action: string;
          description: string;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id?: string | null;
          entity_type: string;
          entity_id?: string | null;
          action: string;
          description: string;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string | null;
          entity_type?: string;
          entity_id?: string | null;
          action?: string;
          description?: string;
          metadata?: any;
          created_at?: string;
        };
      };
    };
  };
};