import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BoxControl {
  id: string;
  user_id: string;
  property_id: string | null;
  name: string;
  is_locked: boolean;
  has_package: boolean;
  package_status: 'pending' | 'delivered' | 'collected' | null;
  security_status: 'secure' | 'warning' | 'alert';
  last_update: string;
  created_at: string;
  updated_at: string;
}

export interface BoxHistoryItem {
  id: string;
  box_id: string | null;
  user_id: string;
  action: string;
  status: 'success' | 'warning' | 'info' | 'error';
  created_at: string;
}

export function useBoxControls() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['box-controls', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('box_controls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BoxControl[];
    },
    enabled: !!user?.id,
  });
}

export function useBoxHistory(boxId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['box-history', user?.id, boxId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('box_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (boxId) {
        query = query.eq('box_id', boxId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as BoxHistoryItem[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateBox() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boxData: Partial<BoxControl>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('box_controls')
        .insert({
          user_id: user.id,
          name: boxData.name || 'Caixa DoorVii',
          property_id: boxData.property_id || null,
          is_locked: boxData.is_locked ?? true,
          has_package: boxData.has_package ?? false,
          package_status: boxData.package_status || null,
          security_status: boxData.security_status || 'secure',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['box-controls'] });
    },
  });
}

export function useUpdateBox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BoxControl> & { id: string }) => {
      const { data, error } = await supabase
        .from('box_controls')
        .update({
          ...updates,
          last_update: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['box-controls'] });
    },
  });
}

export function useAddBoxHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (historyData: { box_id?: string; action: string; status: 'success' | 'warning' | 'info' | 'error' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('box_history')
        .insert({
          user_id: user.id,
          box_id: historyData.box_id || null,
          action: historyData.action,
          status: historyData.status,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['box-history'] });
    },
  });
}

export function useDeleteBox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boxId: string) => {
      const { error } = await supabase
        .from('box_controls')
        .delete()
        .eq('id', boxId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['box-controls'] });
    },
  });
}
