import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the requester is authenticated
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requester is admin
    const isAdminFromMeta = user.user_metadata?.is_admin === true;
    
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
    
    const isAdmin = isAdminFromMeta || !!roleData;

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, action, days } = await req.json();

    if (!userId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let trialEndsAt: string | null = null;

    if (action === 'extend') {
      const daysToAdd = days || 7;
      // Get current trial_ends_at or use now
      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_ends_at')
        .eq('user_id', userId)
        .single();

      const baseDate = profile?.trial_ends_at 
        ? new Date(profile.trial_ends_at) 
        : new Date();
      
      // If trial already expired, extend from now
      if (baseDate < new Date()) {
        baseDate.setTime(new Date().getTime());
      }
      
      baseDate.setDate(baseDate.getDate() + daysToAdd);
      trialEndsAt = baseDate.toISOString();
    } else if (action === 'remove') {
      // Set to null = active plan (no trial)
      trialEndsAt = null;
    } else if (action === 'reset') {
      // Reset to 7 days from now
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 7);
      trialEndsAt = newDate.toISOString();
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use: extend, remove, or reset' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ trial_ends_at: trialEndsAt })
      .eq('user_id', userId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, trial_ends_at: trialEndsAt }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
