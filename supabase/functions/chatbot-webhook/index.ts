import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o assistente virtual do DoorVii, um sistema de portaria inteligente. 
Seu papel é ajudar visitantes que estão na porta de uma propriedade.

Instruções:
- Seja educado, prestativo e conciso nas respostas
- Você pode ajudar com informações básicas sobre o sistema
- Se o visitante quiser deixar um recado, anote e confirme
- Se for uma entrega, pergunte qual empresa (Correios, iFood, Mercado Livre, etc.)
- Sempre pergunte se pode ajudar em mais alguma coisa
- Responda SEMPRE em português brasileiro
- Mantenha as respostas curtas (máximo 2-3 frases)`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, roomName, propertyName, conversationHistory } = await req.json();
    
    console.log('Received chat message:', { message, roomName, propertyName });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build messages array with conversation history
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.sender === 'visitor' ? 'user' : 'assistant',
          content: msg.text
        });
      }
    }

    // Add current message
    messages.push({ 
      role: "user", 
      content: `[Propriedade: ${propertyName || 'Não identificada'}]\n\nMensagem do visitante: ${message}` 
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Serviço temporariamente indisponível." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const chatbotResponse = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.";
    
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
