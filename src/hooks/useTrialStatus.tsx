import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TrialStatus {
  isAdmin: boolean;
  isInTrial: boolean;
  trialExpired: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number;
  isActive: boolean;
}

export function useTrialStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trial-status', user?.id],
    queryFn: async (): Promise<TrialStatus> => {
      if (!user?.id) {
        return {
          isAdmin: false,
          isInTrial: false,
          trialExpired: false,
          trialEndsAt: null,
          daysRemaining: 0,
          isActive: false,
        };
      }

      // Check if user is admin via metadata
      const isAdmin = user.user_metadata?.is_admin === 'true' || user.user_metadata?.is_admin === true;

      // Admins bypass trial check
      if (isAdmin) {
        return {
          isAdmin: true,
          isInTrial: false,
          trialExpired: false,
          trialEndsAt: null,
          daysRemaining: 0,
          isActive: true,
        };
      }

      // Get profile with trial info
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('trial_ends_at, is_active')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching trial status:', error);
        return {
          isAdmin: false,
          isInTrial: false,
          trialExpired: false,
          trialEndsAt: null,
          daysRemaining: 0,
          isActive: false,
        };
      }

      const now = new Date();
      const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
      const isInTrial = trialEndsAt ? trialEndsAt > now : false;
      const trialExpired = trialEndsAt ? trialEndsAt <= now : false;
      const daysRemaining = trialEndsAt 
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      // User is active if: no trial set (null = paid user), or still in trial, or explicitly active without trial
      const isActive = profile?.is_active !== false && (!trialExpired || !trialEndsAt);

      return {
        isAdmin: false,
        isInTrial,
        trialExpired,
        trialEndsAt,
        daysRemaining,
        isActive,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
