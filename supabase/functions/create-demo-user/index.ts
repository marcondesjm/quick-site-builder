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
      // Update existing demo user to have never-expiring trial
      const neverExpireDate = new Date();
      neverExpireDate.setFullYear(neverExpireDate.getFullYear() + 100);
      
      await supabaseAdmin
        .from("profiles")
        .update({ trial_ends_at: neverExpireDate.toISOString() })
        .eq("user_id", demoUser.id);

      return new Response(
        JSON.stringify({ success: true, message: "Demo user already exists (trial updated)", userId: demoUser.id }),
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

    // Create a demo property for the user and set trial to never expire
    if (data.user) {
      // Set trial_ends_at to 100 years from now (effectively never expires)
      const neverExpireDate = new Date();
      neverExpireDate.setFullYear(neverExpireDate.getFullYear() + 100);
      
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          trial_ends_at: neverExpireDate.toISOString(),
          full_name: "Usuário Demo",
        })
        .eq("user_id", data.user.id);

      if (profileError) {
        console.error("Error updating demo profile:", profileError);
      }

      // Create multiple demo properties
      const demoProperties = [
        {
          user_id: data.user.id,
          name: "Casa Demo",
          address: "Rua Exemplo, 123 - São Paulo, SP",
          visitor_always_connected: true,
        },
        {
          user_id: data.user.id,
          name: "Apartamento Centro",
          address: "Av. Paulista, 1000, Apto 501 - São Paulo, SP",
          visitor_always_connected: false,
        },
        {
          user_id: data.user.id,
          name: "Escritório Comercial",
          address: "Rua Augusta, 500, Sala 302 - São Paulo, SP",
          visitor_always_connected: true,
        },
      ];

      const { error: propertyError } = await supabaseAdmin
        .from("properties")
        .insert(demoProperties);

      if (propertyError) {
        console.error("Error creating demo properties:", propertyError);
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
