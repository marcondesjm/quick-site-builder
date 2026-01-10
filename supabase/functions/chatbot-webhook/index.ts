import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, roomName, propertyName } = await req.json();
    
    console.log('Sending message to n8n webhook:', { message, roomName, propertyName });

    const webhookUrl = 'https://doorvii.app.n8n.cloud/webhook-test/receber';
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        roomName,
        propertyName,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook error:', errorText);
      throw new Error(`Webhook responded with status ${response.status}`);
    }

    // Get the chatbot response
    const chatbotResponse = await response.text();
    console.log('Chatbot response:', chatbotResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: chatbotResponse 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
