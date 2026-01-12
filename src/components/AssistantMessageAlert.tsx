import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Clock, Volume2, VolumeX, Send, RefreshCw, Check, AlertCircle, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLog } from '@/hooks/useActivityLog';
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
  status: 'pending' | 'success' | 'error' | 'info';
  timestamp: Date;
  details?: string;
  type?: 'status' | 'message' | 'action' | 'field';
  field?: string;
  oldValue?: string;
  newValue?: string;
}

// Status labels for better display
const STATUS_LABELS: Record<string, string> = {
  'pending': '⏳ Pendente',
  'doorbell_ringing': '🔔 Campainha Tocando',
  'visitor_joined': '👤 Visitante Entrou',
  'owner_joined': '🏠 Morador Entrou',
  'answered': '✅ Atendida',
  'owner_replied': '💬 Morador Respondeu',
  'ended': '🔴 Encerrada',
  'visitor_text_message': '💬 Mensagem de Texto',
  'visitor_audio_response': '🎙️ Áudio do Visitante',
  'video_call': '📹 Videochamada',
  'audio_message': '🔊 Mensagem de Áudio',
};

export function AssistantMessageAlert() {
  const { user } = useAuth();
  const { isOpen: showLogPanel, close: closeLogPanel } = useActivityLog();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [muted, setMuted] = useState(false);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<Record<string, boolean>>({});
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Add log entry with more details
  const addLog = (
    action: string, 
    status: LogEntry['status'] = 'pending',
    options?: { details?: string; type?: LogEntry['type']; field?: string; oldValue?: string; newValue?: string }
  ) => {
    const log: LogEntry = {
      id: Date.now().toString(),
      action,
      status,
      timestamp: new Date(),
      ...options,
    };
    setActivityLogs(prev => [log, ...prev].slice(0, 10)); // Keep last 10
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

  // Listen for all video_calls updates
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
          const propertyName = record.property_name || 'Propriedade';
          
          // Track status changes
          if (record.status !== oldRecord?.status) {
            const oldStatus = STATUS_LABELS[oldRecord?.status] || oldRecord?.status || 'N/A';
            const newStatus = STATUS_LABELS[record.status] || record.status;
            addLog(
              `Status: ${newStatus}`,
              'info',
              { 
                type: 'status', 
                field: 'status',
                oldValue: oldStatus,
                newValue: newStatus,
                details: `${propertyName}`
              }
            );
          }
          
          // Track visitor_joined
          if (record.visitor_joined && !oldRecord?.visitor_joined) {
            addLog(`👤 Visitante entrou`, 'success', { 
              type: 'action', 
              details: propertyName 
            });
          }
          
          // Track owner_joined
          if (record.owner_joined && !oldRecord?.owner_joined) {
            addLog(`🏠 Morador atendeu`, 'success', { 
              type: 'action', 
              details: propertyName 
            });
          }
          
          // Track owner_text_message
          if (record.owner_text_message && record.owner_text_message !== oldRecord?.owner_text_message) {
            addLog(
              `💬 Resposta enviada`,
              'success',
              { 
                type: 'field',
                field: 'owner_text_message',
                newValue: record.owner_text_message.substring(0, 30) + '...',
                details: propertyName
              }
            );
          }
          
          // Track visitor_audio_url
          if (record.visitor_audio_url && record.visitor_audio_url !== oldRecord?.visitor_audio_url) {
            addLog(`🎙️ Áudio recebido`, 'success', { 
              type: 'field',
              field: 'visitor_audio_url',
              details: propertyName
            });
          }
          
          // Track meet_link
          if (record.meet_link && record.meet_link !== oldRecord?.meet_link) {
            addLog(`📹 Videochamada criada`, 'success', { 
              type: 'field',
              field: 'meet_link',
              details: propertyName
            });
          }
          
          // Track ended_at
          if (record.ended_at && !oldRecord?.ended_at) {
            addLog(`🔴 Chamada encerrada`, 'info', { 
              type: 'action',
              details: propertyName
            });
          }
          
          // Check if this is a chat update (visitor_text_message changed)
          if (record.visitor_text_message && 
              record.visitor_text_message !== oldRecord?.visitor_text_message &&
              record.status !== 'doorbell_ringing') {
            
            const message = record.visitor_text_message;
            
            // Add to log
            addLog(
              `💬 Visitante: "${message.substring(0, 25)}..."`,
              'success',
              { 
                type: 'message',
                field: 'visitor_text_message',
                newValue: message,
                details: propertyName
              }
            );
            
            // Only show popup if substantial message
            if (message && message.length > 5) {
              const newMessage: AssistantMessage = {
                id: record.id + '-' + Date.now(),
                visitorName: extractVisitorName(message),
                message: message,
                propertyName: propertyName,
                timestamp: new Date(),
                roomName: record.room_name,
                callId: record.id,
              };
              
              setMessages(prev => {
                if (prev.some(m => m.message === message && m.roomName === record.room_name)) {
                  return prev;
                }
                return [newMessage, ...prev].slice(0, 5);
              });
              
              playNotificationSound();
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_calls',
          filter: `owner_id=eq.${user.id}`,
        },
        (payload) => {
          const record = payload.new as Record<string, any>;
          const propertyName = record.property_name || 'Propriedade';
          
          addLog(`🔔 Nova chamada iniciada`, 'success', { 
            type: 'action',
            details: `${propertyName} - ${record.room_name?.split('-')[0] || ''}`
          });
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

  // Show log panel if button toggled OR if there are messages
  if (!showLogPanel && messages.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex gap-2">
      {/* Activity Log Panel - Show when button clicked or has messages */}
      <AnimatePresence>
        {showLogPanel && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="w-72 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg overflow-hidden self-start"
          >
            <div className="bg-muted/50 px-3 py-2 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-3 h-3 text-primary ${activityLogs.some(l => l.status === 'pending') ? 'animate-spin' : ''}`} />
                <span className="text-xs font-medium text-foreground">Atualizações em Tempo Real</span>
              </div>
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={closeLogPanel}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto">
              {activityLogs.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  <RefreshCw className="w-5 h-5 mx-auto mb-2 opacity-30" />
                  Aguardando atividade...
                </div>
              ) : (
                activityLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs rounded px-2 py-2 border-l-2 ${
                      log.type === 'status' ? 'bg-blue-500/10 border-blue-500' :
                      log.type === 'message' ? 'bg-green-500/10 border-green-500' :
                      log.type === 'field' ? 'bg-purple-500/10 border-purple-500' :
                      log.type === 'action' ? 'bg-yellow-500/10 border-yellow-500' :
                      'bg-muted/30 border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {log.status === 'pending' && (
                        <RefreshCw className="w-3 h-3 text-primary animate-spin shrink-0 mt-0.5" />
                      )}
                      {log.status === 'success' && (
                        <Check className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                      )}
                      {log.status === 'error' && (
                        <AlertCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                      )}
                      {log.status === 'info' && (
                        <Info className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="block font-medium text-foreground">
                          {log.action}
                        </span>
                        {log.details && (
                          <span className="block text-muted-foreground text-[10px] mt-0.5">
                            📍 {log.details}
                          </span>
                        )}
                        {log.oldValue && log.newValue && (
                          <div className="flex items-center gap-1 mt-1 text-[10px]">
                            <span className="text-red-500/80 line-through truncate max-w-[80px]">{log.oldValue}</span>
                            <ArrowRight className="w-2 h-2 text-muted-foreground shrink-0" />
                            <span className="text-green-500 truncate max-w-[80px]">{log.newValue}</span>
                          </div>
                        )}
                        {log.newValue && !log.oldValue && (
                          <span className="block text-muted-foreground/70 text-[10px] mt-0.5 truncate">
                            {log.newValue}
                          </span>
                        )}
                        <span className="block text-muted-foreground/50 text-[10px] mt-1">
                          {format(log.timestamp, 'HH:mm:ss')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            {activityLogs.length > 0 && (
              <div className="border-t border-border/50 px-2 py-1.5">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="w-full h-6 text-[10px]"
                  onClick={() => setActivityLogs([])}
                >
                  Limpar histórico
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
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