import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default pre-formatted responses (FAQ) - no AI tokens consumed
interface FaqResponse {
  keywords: string[];
  response: string;
}

const DEFAULT_FAQ_RESPONSES: FaqResponse[] = [
  {
    keywords: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hi'],
    response: 'Olá! Sou o assistente virtual do DoorVii. Como posso ajudar? Você pode deixar um recado, informar uma entrega ou aguardar o morador.'
  },
  {
    keywords: ['entrega', 'pacote', 'encomenda', 'correios', 'sedex', 'mercado livre', 'amazon', 'shopee', 'ifood', 'delivery'],
    response: 'Entendi que você tem uma entrega! Por favor, toque a campainha e aguarde. Caso o morador não atenda, você pode gravar um áudio ou vídeo informando sobre a entrega.'
  },
  {
    keywords: ['cpf', 'documento', 'identificação', 'identidade'],
    response: 'Para informações sobre CPF ou documentos do destinatário, por favor aguarde o morador atender a chamada. Por segurança, não posso fornecer esses dados.'
  },
  {
    keywords: ['recado', 'mensagem', 'avisar', 'aviso', 'deixar'],
    response: 'Claro! Você pode deixar um recado gravando um áudio ou vídeo. O morador receberá a notificação assim que possível.'
  },
  {
    keywords: ['morador', 'proprietário', 'dono', 'atender', 'atende'],
    response: 'O morador foi notificado! Por favor, aguarde alguns instantes. Caso não haja resposta, você pode gravar um áudio ou vídeo.'
  },
  {
    keywords: ['obrigado', 'obrigada', 'valeu', 'agradeço', 'thanks'],
    response: 'Por nada! Estou aqui para ajudar. Tenha um ótimo dia!'
  },
  {
    keywords: ['ajuda', 'help', 'como funciona', 'o que fazer'],
    response: 'Você pode: 1) Tocar a campainha para chamar o morador; 2) Gravar um áudio ou vídeo com seu recado; 3) Aguardar o morador atender. Posso ajudar em algo mais?'
  },
  {
    keywords: ['tchau', 'adeus', 'até logo', 'bye', 'falou'],
    response: 'Até logo! Obrigado por usar o DoorVii. Tenha um ótimo dia!'
  },
  {
    keywords: ['problema', 'erro', 'não funciona', 'bug'],
    response: 'Desculpe pelo inconveniente! Tente tocar a campainha novamente ou gravar um áudio/vídeo para o morador. Se o problema persistir, entre em contato com o suporte.'
  },
  {
    keywords: ['horário', 'hora', 'quando', 'disponível'],
    response: 'O sistema DoorVii funciona 24 horas. O morador será notificado sempre que alguém tocar a campainha.'
  },
  {
    keywords: ['endereço', 'local', 'lugar', 'aqui'],
    response: 'Você está no endereço correto! Toque a campainha para chamar o morador ou deixe um recado em áudio/vídeo.'
  },
  {
    keywords: ['urgente', 'emergência', 'emergencia', 'importante'],
    response: 'Entendo que é urgente! Recomendo tocar a campainha várias vezes ou gravar um vídeo explicando a situação. O morador receberá uma notificação.'
  }
];

// Keywords that indicate the owner should be notified with high priority
const NOTIFY_OWNER_KEYWORDS = [
  'vou avisar o morador',
  'vou notificar o morador',
  'notificando o morador',
  'avisando o morador',
  'morador foi notificado',
  'vou avisar o proprietário',
  'aguarde enquanto notifico',
  'aguarde enquanto aviso'
];

// Check if response should trigger owner notification
function shouldNotifyOwner(response: string): boolean {
  const lowerResponse = response.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return NOTIFY_OWNER_KEYWORDS.some(keyword => {
    const normalizedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return lowerResponse.includes(normalizedKeyword);
  });
}

// Send high priority push notification to owner
async function sendOwnerNotification(
  supabase: any,
  ownerId: string,
  propertyName: string,
  visitorMessage: string,
  visitorName?: string
) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    const notificationTitle = '🔔 Visitante aguardando!';
    const notificationBody = visitorName 
      ? `${visitorName} está na porta de ${propertyName}: "${visitorMessage.substring(0, 50)}${visitorMessage.length > 50 ? '...' : ''}"`
      : `Visitante na porta de ${propertyName}: "${visitorMessage.substring(0, 50)}${visitorMessage.length > 50 ? '...' : ''}"`;

    const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        userId: ownerId,
        title: notificationTitle,
        body: notificationBody,
        data: {
          type: 'assistant_alert',
          priority: 'high',
          propertyName,
          visitorName,
          visitorMessage
        }
      }),
    });

    if (response.ok) {
      console.log('High priority notification sent to owner:', ownerId);
    } else {
      console.error('Failed to send notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending owner notification:', error);
  }
}

// Find the best matching response
function findBestResponse(
  message: string, 
  customResponses: FaqResponse[], 
  propertyName?: string, 
  visitorName?: string
): string {
  const lowerMessage = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // First check custom responses (user-defined)
  for (const faq of customResponses) {
    for (const keyword of faq.keywords) {
      const normalizedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (lowerMessage.includes(normalizedKeyword)) {
        let response = faq.response;
        if (visitorName) {
          response = response.replace('Olá!', `Olá, ${visitorName}!`);
        }
        return response;
      }
    }
  }
  
  // Then check default responses
  for (const faq of DEFAULT_FAQ_RESPONSES) {
    for (const keyword of faq.keywords) {
      const normalizedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (lowerMessage.includes(normalizedKeyword)) {
        let response = faq.response;
        if (visitorName) {
          response = response.replace('Olá!', `Olá, ${visitorName}!`);
        }
        return response;
      }
    }
  }
  
  // Default response if no match
  const defaultResponses = [
    `Entendi! ${propertyName ? `Você está em ${propertyName}. ` : ''}Posso ajudar com informações sobre entregas, deixar recados ou chamar o morador. O que você precisa?`,
    'Como posso ajudar? Você pode tocar a campainha, deixar um recado em áudio/vídeo, ou me perguntar sobre entregas.',
    'Estou aqui para ajudar! Toque a campainha para chamar o morador ou me diga se precisa de algo específico.'
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, roomName, propertyName, conversationHistory, visitorName, visitorCpf } = await req.json();
    
    console.log('Received chat message (FAQ mode):', { message, roomName, propertyName, visitorName });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch custom responses from the owner
    let customResponses: FaqResponse[] = [];
    let ownerId: string | null = null;
    
    if (roomName) {
      // Get owner_id from video_calls
      const { data: videoCall } = await supabase
        .from('video_calls')
        .select('owner_id')
        .eq('room_name', roomName)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (videoCall?.owner_id) {
        ownerId = videoCall.owner_id;
        
        // Fetch custom responses from assistant_responses table
        const { data: responses } = await supabase
          .from('assistant_responses')
          .select('keywords, response')
          .eq('user_id', videoCall.owner_id)
          .eq('is_enabled', true)
          .order('display_order', { ascending: true });

        if (responses && responses.length > 0) {
          customResponses = responses as FaqResponse[];
          console.log(`Loaded ${customResponses.length} custom responses for owner`);
        }
      }
    }

    // Generate response using FAQ matching (no AI tokens consumed)
    const chatbotResponse = findBestResponse(message, customResponses, propertyName, visitorName);
    
    console.log('FAQ response:', chatbotResponse);

    // Update video_calls with visitor message for real-time notification in owner dashboard
    if (roomName) {
      const visitorInfo = visitorName ? `${visitorName}: ` : '';
      await supabase
        .from('video_calls')
        .update({ 
          visitor_text_message: `${visitorInfo}${message}`,
          status: 'assistant_chat' 
        })
        .eq('room_name', roomName);
      
      console.log('Updated video_calls with visitor message for real-time notification');
    }

    // Check if response should trigger high-priority owner notification
    if (ownerId && shouldNotifyOwner(chatbotResponse)) {
      console.log('Response triggers owner notification, sending push...');
      await sendOwnerNotification(
        supabase,
        ownerId,
        propertyName || 'sua propriedade',
        message,
        visitorName
      );
    }

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
