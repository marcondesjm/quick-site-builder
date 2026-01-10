import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

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
    const { roomName, propertyName, chatHistory, protocolNumber, visitorName, visitorCpf } = await req.json();
    
    console.log('Saving chat history:', { roomName, propertyName, messagesCount: chatHistory?.length, visitorName });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the video call to get the owner_id
    const { data: videoCall, error: callError } = await supabase
      .from('video_calls')
      .select('owner_id, property_id')
      .eq('room_name', roomName)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (callError) {
      console.error('Error finding video call:', callError);
      throw callError;
    }

    if (!videoCall) {
      console.log('No video call found for room:', roomName);
      return new Response(
        JSON.stringify({ success: false, error: 'Video call not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build visitor identification header
    let visitorInfo = '';
    if (visitorName || visitorCpf) {
      visitorInfo = '--- IDENTIFICAÇÃO DO ENTREGADOR ---\n';
      if (visitorName) visitorInfo += `Nome: ${visitorName}\n`;
      if (visitorCpf) {
        // Mask CPF for privacy (show only last 4 digits)
        const maskedCpf = visitorCpf.length >= 4 
          ? `***.***.*${visitorCpf.slice(-4, -2)}-${visitorCpf.slice(-2)}`
          : visitorCpf;
        visitorInfo += `CPF: ${maskedCpf}\n`;
      }
      visitorInfo += '-----------------------------------\n\n';
    }

    // Format chat history as readable text
    const formattedChat = visitorInfo + chatHistory.map((msg: { sender: string; text: string; timestamp: number }) => {
      const time = new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const sender = msg.sender === 'visitor' ? '👤 Visitante' : '🤖 Assistente';
      return `[${time}] ${sender}: ${msg.text}`;
    }).join('\n');

    // Create activity title with visitor name if available
    const activityTitle = visitorName 
      ? `💬 Conversa com ${visitorName} - ${propertyName}`
      : `💬 Conversa com Assistente - ${propertyName}`;

    // Create activity log entry for the chat
    const { data: activity, error: activityError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: videoCall.owner_id,
        property_id: videoCall.property_id,
        type: 'doorbell',
        title: activityTitle,
        property_name: propertyName,
        protocol_number: protocolNumber,
        media_type: null,
        media_url: null,
      })
      .select()
      .single();

    if (activityError) {
      console.error('Error creating activity:', activityError);
      throw activityError;
    }

    // Update the video call with the chat transcript in visitor_text_message
    const { error: updateError } = await supabase
      .from('video_calls')
      .update({ 
        visitor_text_message: formattedChat
      })
      .eq('room_name', roomName);

    if (updateError) {
      console.error('Error updating video call:', updateError);
    }

    console.log('Chat history saved successfully');

    return new Response(
      JSON.stringify({ success: true, activityId: activity.id }),
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
