import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CallHistoryItem {
  id: string;
  room_name: string;
  property_id: string | null;
  property_name: string;
  owner_id: string;
  visitor_joined: boolean | null;
  owner_joined: boolean | null;
  status: string;
  created_at: string;
  ended_at: string | null;
  meet_link: string | null;
  audio_message_url: string | null;
  visitor_audio_url: string | null;
  visitor_text_message: string | null;
  owner_status_message: string | null;
  owner_text_message: string | null;
  protocol_number: string | null;
}

export function useCallHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Real-time subscription for call changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('call-history-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_calls'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['call-history'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['call-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('video_calls')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching call history:', error);
        throw error;
      }
      return data as CallHistoryItem[];
    },
    enabled: !!user
  });
}

export function useSearchCallByProtocol() {
  const { user } = useAuth();

  const searchByProtocol = async (protocolNumber: string): Promise<CallHistoryItem | null> => {
    if (!user || !protocolNumber) return null;
    
    const { data, error } = await supabase
      .from('video_calls')
      .select('*')
      .eq('owner_id', user.id)
      .ilike('protocol_number', `%${protocolNumber}%`)
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error searching call by protocol:', error);
      return null;
    }
    return data as CallHistoryItem;
  };

  return { searchByProtocol };
}

export function useDeleteCall() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (callId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('video_calls')
        .delete()
        .eq('id', callId)
        .eq('owner_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-history'] });
    }
  });
}

export function useDeleteAllCalls() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('video_calls')
        .delete()
        .eq('owner_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-history'] });
    }
  });
}
