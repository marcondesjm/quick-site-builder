import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AssistantResponse {
  id: string;
  user_id: string;
  keywords: string[];
  response: string;
  is_enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useAssistantResponses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assistant-responses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('assistant_responses')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching assistant responses:', error);
        throw error;
      }
      return data as AssistantResponse[];
    },
    enabled: !!user
  });
}

export function useAddAssistantResponse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (response: {
      keywords: string[];
      response: string;
      display_order?: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('assistant_responses')
        .insert({
          user_id: user.id,
          keywords: response.keywords,
          response: response.response,
          display_order: response.display_order || 0,
          is_enabled: true
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistant-responses'] });
    }
  });
}

export function useUpdateAssistantResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      keywords?: string[];
      response?: string;
      is_enabled?: boolean;
      display_order?: number;
    }) => {
      const { id, ...updates } = params;
      
      const { data, error } = await supabase
        .from('assistant_responses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistant-responses'] });
    }
  });
}

export function useDeleteAssistantResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assistant_responses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistant-responses'] });
    }
  });
}
