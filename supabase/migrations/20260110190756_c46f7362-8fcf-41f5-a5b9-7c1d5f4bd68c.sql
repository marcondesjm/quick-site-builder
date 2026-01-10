-- Update the handle_new_user function to also create default assistant responses
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create user profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  
  -- Create default assistant responses for the new user
  INSERT INTO public.assistant_responses (user_id, keywords, response, display_order, is_enabled)
  VALUES 
    (new.id, ARRAY['entrega', 'pacote', 'correios', 'encomenda', 'sedex'], 'Olá! Entendi que você tem uma entrega. Por favor, aguarde enquanto notifico o morador. Você pode deixar o pacote na portaria se preferir.', 1, true),
    (new.id, ARRAY['ifood', 'comida', 'pedido', 'lanche', 'delivery'], 'Oi! Você é do delivery? Vou avisar o morador que chegou. Por favor, aguarde um momento.', 2, true),
    (new.id, ARRAY['visita', 'visitante', 'amigo', 'parente', 'convidado'], 'Olá! Seja bem-vindo! Estou notificando o morador sobre sua chegada. Por favor, aguarde a liberação.', 3, true),
    (new.id, ARRAY['manutenção', 'técnico', 'reparo', 'conserto', 'instalação'], 'Olá! Você é da manutenção? Vou avisar o morador. Por favor, aguarde a confirmação.', 4, true),
    (new.id, ARRAY['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite'], 'Olá! Seja bem-vindo! Como posso ajudá-lo? Você pode me dizer o motivo da sua visita.', 5, true);
  
  RETURN new;
END;
$function$;