import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useIsAdmin() {
  const { user, session } = useAuth();
  
  return useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      // First check user_metadata directly (faster, no DB call)
      const metadataIsAdmin = user.user_metadata?.is_admin === 'true' || user.user_metadata?.is_admin === true;
      if (metadataIsAdmin) {
        console.log('User is admin via metadata');
        return true;
      }
      
      // Fallback to RPC check
      try {
        const { data, error } = await supabase.rpc('is_admin' as any);
        
        if (error) {
          console.error('Error checking admin status via RPC:', error);
          return false;
        }
        
        console.log('RPC is_admin result:', data);
        return data === true;
      } catch (e) {
        console.error('Exception checking admin status:', e);
        return false;
      }
    },
    enabled: !!user?.id && !!session,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  email?: string;
  is_admin?: boolean;
  trial_ends_at?: string | null;
}

export function useAllUsers() {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { session } = useAuth();
  
  return useQuery({
    queryKey: ['all-users', session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('No access token available');
      }
      
      // Use edge function to fetch users with admin privileges
      const { data, error } = await supabase.functions.invoke('admin-get-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      if (data?.error) {
        console.error('Error from edge function:', data.error);
        throw new Error(data.error);
      }
      
      return data.users as UserProfile[];
    },
    enabled: isAdmin === true && !!session?.access_token && !isAdminLoading,
    retry: 1,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useToggleUserActive() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data, error } = await supabase.functions.invoke('admin-toggle-user', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        },
        body: { userId, isActive }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        },
        body: { userId }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });
}

export function useSetUserRole() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => {
      const { data, error } = await supabase.functions.invoke('admin-set-role', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        },
        body: { userId, role }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });
}

export function useUpdateTrial() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: async ({ userId, action, days }: { userId: string; action: 'extend' | 'remove' | 'reset'; days?: number }) => {
      const { data, error } = await supabase.functions.invoke('admin-update-trial', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        },
        body: { userId, action, days }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });
}
