import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    // Create client with user's token to verify authentication using getClaims
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Use getClaims to verify the JWT
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      console.error('Error verifying token:', claimsError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claimsData.claims.sub
    const userMetadata = claimsData.claims.user_metadata as Record<string, unknown> | undefined

    console.log('User ID:', userId)
    console.log('User metadata:', JSON.stringify(userMetadata))

    // Check if user is admin using their metadata from the token
    const isAdmin = userMetadata?.is_admin === 'true' || userMetadata?.is_admin === true

    console.log('Is admin:', isAdmin)

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin only.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Fetch user emails from auth.users first
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user emails' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Auth users count:', authUsers.users.length)

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Profiles count:', profiles?.length || 0)

    // Create a map of existing profiles by user_id
    const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || [])

    // Try to get admin user IDs from user_roles table (may not exist)
    let adminUserIds = new Set<string>()
    try {
      const { data: adminRoles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
      
      if (!rolesError && adminRoles) {
        adminUserIds = new Set(adminRoles.map(r => r.user_id))
      }
    } catch (e) {
      // user_roles table may not exist, that's okay
      console.log('user_roles table not found, using metadata only for admin check')
    }

    // Merge auth users with profiles - include ALL auth users even if they don't have a profile
    const usersWithEmails = authUsers.users.map(authUser => {
      const profile = profilesMap.get(authUser.id)
      // Check if user is admin via user_roles OR via user_metadata
      const isAdminFromRoles = adminUserIds.has(authUser.id)
      const isAdminFromMetadata = authUser.user_metadata?.is_admin === 'true' || authUser.user_metadata?.is_admin === true
      return {
        id: profile?.id || authUser.id,
        user_id: authUser.id,
        full_name: profile?.full_name || authUser.user_metadata?.full_name || null,
        phone: profile?.phone || authUser.phone || null,
        avatar_url: profile?.avatar_url || null,
        is_active: profile?.is_active ?? true,
        created_at: profile?.created_at || authUser.created_at,
        updated_at: profile?.updated_at || authUser.updated_at || authUser.created_at,
        email: authUser.email || 'Email não disponível',
        is_admin: isAdminFromRoles || isAdminFromMetadata,
        trial_ends_at: profile?.trial_ends_at || null
      }
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log('Final users count:', usersWithEmails.length)

    return new Response(
      JSON.stringify({ users: usersWithEmails }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})