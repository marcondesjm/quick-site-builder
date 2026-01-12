import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Clock, Volume2, VolumeX, Send, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface AssistantMessage {
  id: string;
  visitorName?: string;
  visitorCpf?: string;
  message: string;
  propertyName: string;
  timestamp: Date;
  roomName: string;
  callId: string;
}

interface LogEntry {
  id: string;
  action: string;
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
}

export function AssistantMessageAlert() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [muted, setMuted] = useState(false);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<Record<string, boolean>>({});
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Add log entry
  const addLog = (action: string, status: LogEntry['status'] = 'pending') => {
    const log: LogEntry = {
      id: Date.now().toString(),
      action,
      status,
      timestamp: new Date(),
    };
    setActivityLogs(prev => [log, ...prev].slice(0, 5));
    return log.id;
  };

  // Update log status
  const updateLogStatus = (logId: string, status: LogEntry['status']) => {
    setActivityLogs(prev => 
      prev.map(log => log.id === logId ? { ...log, status } : log)
    );
  };

  // Send reply to visitor
  const sendReply = async (msg: AssistantMessage) => {
    const replyText = replyTexts[msg.id]?.trim();
    if (!replyText) return;

    setSendingReply(prev => ({ ...prev, [msg.id]: true }));
    const logId = addLog('Enviando resposta...');

    try {
      // Update video_calls with owner's text message
      const { error } = await supabase
        .from('video_calls')
        .update({
          owner_text_message: replyText,
          status: 'owner_replied'
        })
        .eq('id', msg.callId);

      if (error) throw error;

      updateLogStatus(logId, 'success');
      addLog('Resposta enviada!', 'success');
      toast.success('Mensagem enviada ao visitante!');
      setReplyTexts(prev => ({ ...prev, [msg.id]: '' }));
      dismissMessage(msg.id);
    } catch (error) {
      console.error('Error sending reply:', error);
      updateLogStatus(logId, 'error');
      addLog('Erro ao enviar', 'error');
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSendingReply(prev => ({ ...prev, [msg.id]: false }));
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (muted) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // Triple beep notification
      const frequencies = [880, 1047, 1319]; // A5, C6, E6
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const startTime = ctx.currentTime + (i * 0.12);
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
        osc.start(startTime);
        osc.stop(startTime + 0.1);
      });
      
      // Vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  // Listen for chat history saves (when visitor sends message to assistant)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('assistant-messages')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_calls',
          filter: `owner_id=eq.${user.id}`,
        },
        async (payload) => {
          const record = payload.new as Record<string, any>;
          const oldRecord = payload.old as Record<string, any>;
          
          // Check if this is a chat update (visitor_text_message changed and contains assistant interaction indicator)
          if (record.visitor_text_message && 
              record.visitor_text_message !== oldRecord?.visitor_text_message &&
              record.status !== 'doorbell_ringing') {
            
            // This could be a chat message - check if it's from assistant chat
            // We detect this by looking for patterns in the message or status
            const message = record.visitor_text_message;
            
            // Only show if it looks like a substantial message (not just "oi")
            if (message && message.length > 5) {
              const newMessage: AssistantMessage = {
                id: record.id + '-' + Date.now(),
                visitorName: extractVisitorName(message),
                message: message,
                propertyName: record.property_name || 'Propriedade',
                timestamp: new Date(),
                roomName: record.room_name,
                callId: record.id,
              };
              
              setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.message === message && m.roomName === record.room_name)) {
                  return prev;
                }
                return [newMessage, ...prev].slice(0, 5); // Keep only last 5
              });
              
              // Add to activity log
              addLog(`Nova mensagem: ${message.substring(0, 20)}...`, 'success');
              
              playNotificationSound();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, muted]);

  // Helper to extract visitor name from message if present
  const extractVisitorName = (message: string): string | undefined => {
    // Common patterns: "Meu nome é X", "Sou o X", "Sou X"
    const patterns = [
      /meu nome [eé] (\w+)/i,
      /sou o (\w+)/i,
      /sou a (\w+)/i,
      /sou (\w+)/i,
      /me chamo (\w+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) return match[1];
    }
    return undefined;
  };

  const dismissMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const dismissAll = () => {
    setMessages([]);
  };

  if (messages.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex gap-2">
      {/* Activity Log Panel */}
      {activityLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-48 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="bg-muted/50 px-3 py-1.5 border-b border-border/50 flex items-center gap-2">
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
            <span className="text-xs font-medium text-muted-foreground">Atualizações</span>
          </div>
          <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {activityLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 text-xs"
                >
                  {log.status === 'pending' && (
                    <RefreshCw className="w-3 h-3 text-primary animate-spin shrink-0" />
                  )}
                  {log.status === 'success' && (
                    <Check className="w-3 h-3 text-green-500 shrink-0" />
                  )}
                  {log.status === 'error' && (
                    <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                  )}
                  <span className={`truncate ${
                    log.status === 'error' ? 'text-destructive' : 
                    log.status === 'success' ? 'text-green-600' : 'text-muted-foreground'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-muted-foreground/50 shrink-0">
                    {format(log.timestamp, 'HH:mm:ss')}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
      
      {/* Messages Panel */}
      <div className="w-80 max-w-[calc(100vw-2rem)] space-y-2">
      <AnimatePresence mode="popLayout">
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-card border border-primary/20 rounded-xl shadow-lg overflow-hidden"
            style={{ boxShadow: '0 4px 20px rgba(0, 120, 180, 0.15)' }}
          >
            {/* Header */}
            <div className="bg-primary/10 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">
                    {msg.visitorName ? `Visitante: ${msg.visitorName}` : 'Visitante'}
                  </p>
                  <p className="text-xs text-muted-foreground">{msg.propertyName}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {index === 0 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => setMuted(!muted)}
                  >
                    {muted ? (
                      <VolumeX className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <Volume2 className="w-3 h-3 text-muted-foreground" />
                    )}
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => dismissMessage(msg.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-3">
              <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                "{msg.message}"
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{format(msg.timestamp, 'HH:mm', { locale: ptBR })}</span>
              </div>
              
              {/* Reply input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Responder ao visitante..."
                  value={replyTexts[msg.id] || ''}
                  onChange={(e) => setReplyTexts(prev => ({ ...prev, [msg.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !sendingReply[msg.id]) {
                      sendReply(msg);
                    }
                  }}
                  className="h-8 text-sm"
                  disabled={sendingReply[msg.id]}
                />
                <Button
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => sendReply(msg)}
                  disabled={!replyTexts[msg.id]?.trim() || sendingReply[msg.id]}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {messages.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-end"
        >
          <Button
            size="sm"
            variant="outline"
            onClick={dismissAll}
            className="text-xs"
          >
            Limpar todas ({messages.length})
          </Button>
        </motion.div>
      )}
      </div>
    </div>
  );
}