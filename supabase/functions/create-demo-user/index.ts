import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const demoEmail = "demo@doorvii.com";
    const demoPassword = "demo123456";

    // Check if demo user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const demoUser = existingUsers?.users?.find(u => u.email === demoEmail);

    if (demoUser) {
      return new Response(
        JSON.stringify({ success: true, message: "Demo user already exists", userId: demoUser.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create demo user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Usuário Demo",
      },
    });

    if (error) {
      console.error("Error creating demo user:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a demo property for the user
    if (data.user) {
      const { error: propertyError } = await supabaseAdmin
        .from("properties")
        .insert({
          user_id: data.user.id,
          name: "Casa Demo",
          address: "Rua Exemplo, 123 - São Paulo, SP",
        });

      if (propertyError) {
        console.error("Error creating demo property:", propertyError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Demo user created successfully", userId: data.user?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
