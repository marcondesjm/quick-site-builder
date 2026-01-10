import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Create client with user's token to verify authentication
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify the JWT
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      console.error('Error verifying token:', claimsError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userMetadata = claimsData.claims.user_metadata as Record<string, unknown> | undefined
    const isAdmin = userMetadata?.is_admin === 'true' || userMetadata?.is_admin === true

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin only.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get all profiles where trial has expired and user is still active
    const now = new Date().toISOString()
    
    const { data: expiredProfiles, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, full_name, trial_ends_at')
      .lt('trial_ends_at', now)
      .eq('is_active', true)

    if (fetchError) {
      console.error('Error fetching expired profiles:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch expired profiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!expiredProfiles || expiredProfiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired trials found',
          deactivatedCount: 0,
          deactivatedUsers: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deactivate all expired users
    const userIds = expiredProfiles.map(p => p.user_id)
    
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: false })
      .in('user_id', userIds)

    if (updateError) {
      console.error('Error deactivating users:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to deactivate users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const deactivatedUsers = expiredProfiles.map(p => ({
      user_id: p.user_id,
      full_name: p.full_name,
      trial_ends_at: p.trial_ends_at
    }))

    console.log(`Deactivated ${deactivatedUsers.length} users with expired trials`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${deactivatedUsers.length} usuário(s) desativado(s)`,
        deactivatedCount: deactivatedUsers.length,
        deactivatedUsers 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in admin-auto-deactivate:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
