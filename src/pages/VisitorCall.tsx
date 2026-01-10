import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, ExternalLink, Copy, Check, Bell, CheckCircle, User, Phone, Volume2, Pause, Play, Mic, MessageCircle, Clock, ArrowLeft, PhoneOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { VisitorAudioRecorder } from '@/components/VisitorAudioRecorder';
import { VisitorVideoRecorder } from '@/components/VisitorVideoRecorder';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

type CallStatus = 'waiting' | 'ringing' | 'answered' | 'video_call' | 'audio_message' | 'ended' | 'not_answered';

interface AudioMessage {
  url: string;
  timestamp: number;
}

// Get base URL without timestamp parameter for deduplication
const getBaseAudioUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.delete('t');
    return urlObj.toString();
  } catch {
    return url.split('?')[0];
  }
};

interface ChatMessage {
  id: string;
  text: string;
  sender: 'visitor' | 'bot';
  timestamp: number;
}

const VisitorCall = () => {
  const { roomName } = useParams<{ roomName: string }>();
  const [searchParams] = useSearchParams();
  const propertyName = searchParams.get('property') || 'Propriedade';
  const initialMeetLink = searchParams.get('meet');
  
  const [copied, setCopied] = useState(false);
  const [notified, setNotified] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>('waiting');
  const [audioMessages, setAudioMessages] = useState<AudioMessage[]>([]);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
  const [meetLink, setMeetLink] = useState<string | null>(initialMeetLink);
  const [visitorAlwaysConnected, setVisitorAlwaysConnected] = useState(false);
  const [ownerPhone, setOwnerPhone] = useState<string | null>(null);
  const [callAnsweredTime, setCallAnsweredTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');
  const [showNotAnsweredDialog, setShowNotAnsweredDialog] = useState(false);
  const [showMessageSentDialog, setShowMessageSentDialog] = useState(false);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);
  const [emergencyCountdown, setEmergencyCountdown] = useState(5);
  const [emergencyMessage, setEmergencyMessage] = useState('Tentei entrar em contato com você via DoorVi - QR Code. Por favor, responda-me');
  const [hasAutoRung, setHasAutoRung] = useState(false);
  const [protocolNumber, setProtocolNumber] = useState<string | null>(null);
  const [showProtocolDialog, setShowProtocolDialog] = useState(false);
  const [protocolCopied, setProtocolCopied] = useState(false);
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorCpf, setVisitorCpf] = useState('');
  const [hasIdentified, setHasIdentified] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const ringingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPlayedAudioRef = useRef<string | null>(null);
  const autoPlayAudioRef = useRef<HTMLAudioElement | null>(null);

  // Format elapsed time
  const formatElapsedTime = useCallback((ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Timer for elapsed time - only starts when call is answered
  useEffect(() => {
    if (!callAnsweredTime) return;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - callAnsweredTime;
      setElapsedTime(formatElapsedTime(elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [callAnsweredTime, formatElapsedTime]);

  // Set answered time when call status changes to answered/audio_message/video_call
  useEffect(() => {
    if ((callStatus === 'answered' || callStatus === 'audio_message' || callStatus === 'video_call') && !callAnsweredTime) {
      setCallAnsweredTime(Date.now());
    }
  }, [callStatus, callAnsweredTime]);

  // Auto-play new audio messages when they arrive
  useEffect(() => {
    if (audioMessages.length === 0) return;
    
    const lastMessage = audioMessages[audioMessages.length - 1];
    
    // Skip if we already played this audio
    if (lastPlayedAudioRef.current === lastMessage.url) return;
    
    console.log('[AutoPlay] New audio detected, attempting to play:', lastMessage.url);
    lastPlayedAudioRef.current = lastMessage.url;
    
    // Stop any currently playing audio
    if (autoPlayAudioRef.current) {
      autoPlayAudioRef.current.pause();
      autoPlayAudioRef.current = null;
    }
    
    // Create and play new audio
    const audio = new Audio(lastMessage.url);
    audio.preload = 'auto';
    audio.volume = 1.0;
    autoPlayAudioRef.current = audio;
    
    const playAudio = async () => {
      try {
        await audio.play();
        console.log('[AutoPlay] Audio playing successfully');
        setCurrentPlayingIndex(audioMessages.length - 1);
        toast.success('Reproduzindo mensagem do morador...');
      } catch (e) {
        console.log('[AutoPlay] Autoplay blocked:', e);
        toast.info('Toque na mensagem para ouvir', { duration: 5000 });
      }
    };
    
    audio.oncanplaythrough = playAudio;
    audio.onended = () => {
      console.log('[AutoPlay] Audio ended');
      setCurrentPlayingIndex(null);
      autoPlayAudioRef.current = null;
    };
    audio.onerror = (e) => {
      console.error('[AutoPlay] Audio error:', e);
      autoPlayAudioRef.current = null;
    };
    
    audio.load();
    
    // Try immediate play as well (for mobile)
    setTimeout(() => {
      if (audio.readyState >= 2) {
        playAudio();
      }
    }, 200);
    
  }, [audioMessages]);

  // Fetch owner phone number
  useEffect(() => {
    const fetchOwnerPhone = async () => {
      if (!roomName) return;
      
      // Get the owner_id from the video_call
      const { data: callData } = await supabase
        .from('video_calls')
        .select('owner_id')
        .eq('room_name', roomName)
        .maybeSingle();
      
      if (callData?.owner_id) {
        // Get owner's phone from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('user_id', callData.owner_id)
          .maybeSingle();
        
        if (profile?.phone) {
          setOwnerPhone(profile.phone);
        }
      }
    };
    
    fetchOwnerPhone();
  }, [roomName]);

  const handleWhatsApp = () => {
    const phone = ownerPhone?.replace(/\D/g, '') || '';
    const message = encodeURIComponent(`Olá! Estou na porta - ${decodeURIComponent(propertyName)}`);
    const url = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  // Scroll to bottom when new chat messages arrive
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Send message to chatbot via Lovable AI
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isSendingChat) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      text: chatInput.trim(),
      sender: 'visitor',
      timestamp: Date.now(),
    };

    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsSendingChat(true);

    try {
      const { data, error } = await supabase.functions.invoke('chatbot-webhook', {
        body: {
          message: userMessage.text,
          roomName,
          propertyName: decodeURIComponent(propertyName),
          conversationHistory: chatMessages,
          visitorName: visitorName.trim() || undefined,
          visitorCpf: visitorCpf.replace(/\D/g, '') || undefined,
        },
      });

      if (error) throw error;

      const botResponse: ChatMessage = {
        id: crypto.randomUUID(),
        text: data?.response || 'Resposta recebida',
        sender: 'bot',
        timestamp: Date.now(),
      };

      setChatMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      toast.error('Erro ao enviar mensagem');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        text: 'Desculpe, não consegui processar sua mensagem. Tente novamente.',
        sender: 'bot',
        timestamp: Date.now(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Save chat history when dialog closes
  const handleCloseChatDialog = async (open: boolean) => {
    if (!open && chatMessages.length > 0) {
      // Save chat history to database
      try {
        await supabase.functions.invoke('save-chat-history', {
          body: {
            roomName,
            propertyName: decodeURIComponent(propertyName),
            chatHistory: chatMessages,
            protocolNumber,
            visitorName: visitorName.trim() || undefined,
            visitorCpf: visitorCpf.replace(/\D/g, '') || undefined,
          },
        });
        console.log('Chat history saved successfully');
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    }
    setShowChatDialog(open);
  };

  // Subscribe to real-time updates for owner join status and meet link
  useEffect(() => {
    if (!roomName) return;

    console.log('Setting up real-time subscription for visitor call:', roomName);

    // Fetch initial call status and check if visitor_always_connected is enabled
    const fetchCallStatus = async () => {
      // Look for active calls only (not ended)
      const { data, error } = await supabase
        .from('video_calls')
        .select('*, properties:property_id(visitor_always_connected)')
        .eq('room_name', roomName)
        .neq('status', 'ended')
        .maybeSingle();

      if (!error && data) {
        console.log('Initial call status:', data);
        const callData = data as any;
        
        // Check if visitor_always_connected is enabled
        if (callData.properties?.visitor_always_connected) {
          setVisitorAlwaysConnected(true);
        }
        
        // Update meet link if available from database
        if (callData.meet_link && !meetLink) {
          setMeetLink(callData.meet_link);
        }
        
        if (callData.owner_joined) {
          setCallStatus('video_call');
        } else if (callData.status === 'audio_message' && callData.audio_message_url) {
          setCallStatus('audio_message');
          // Add initial audio message
          setAudioMessages(prev => {
            const exists = prev.some(m => m.url === callData.audio_message_url);
            if (!exists) {
              return [...prev, { url: callData.audio_message_url, timestamp: Date.now() }];
            }
            return prev;
          });
        } else if (callData.status === 'answered') {
          setCallStatus('answered');
        }
        // For 'doorbell_ringing', 'pending' or other statuses, keep 'waiting' 
        // so visitor sees the button and can ring again
        // Don't set 'ended' status on initial load - treat as new session
      } else {
        // No active call found - start fresh at waiting
        setCallStatus('waiting');
      }
    };

    fetchCallStatus();

    // Set up real-time subscription
    const channel = supabase
      .channel(`visitor_realtime_${roomName}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_calls',
          filter: `room_name=eq.${roomName}`,
        },
        (payload) => {
          console.log('[VisitorCall] Real-time update received:', payload.new);
          const updatedCall = payload.new as any;
          
          // CRITICAL: Skip updates that don't require state changes to prevent re-render loops
          const currentStatus = updatedCall.status;
          console.log('[VisitorCall] Current DB status:', currentStatus);
          
          // Update meet link if it becomes available (only if not already set)
          if (updatedCall.meet_link && !meetLink) {
            console.log('[VisitorCall] Meet link received:', updatedCall.meet_link);
            setMeetLink(updatedCall.meet_link);
          }
          
          // Handle status changes - only update state when necessary
          if (updatedCall.owner_joined) {
            setCallStatus(prev => {
              if (prev !== 'video_call') {
                toast.success('Morador iniciou a videochamada! Entre agora.');
                if ('vibrate' in navigator) navigator.vibrate([300, 100, 300]);
                return 'video_call';
              }
              return prev;
            });
          } else if (currentStatus === 'audio_message' && updatedCall.audio_message_url) {
            const audioUrl = updatedCall.audio_message_url;
            const baseUrl = getBaseAudioUrl(audioUrl);
            
            setCallStatus(prev => {
              if (prev !== 'audio_message') {
                toast.success('Nova mensagem de áudio do morador!');
                if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
              }
              return 'audio_message';
            });
            // Add new audio message to the list (dedup by full URL with timestamp)
            setAudioMessages(prev => {
              // Check if this exact URL (with timestamp) already exists
              const exists = prev.some(m => m.url === audioUrl);
              if (!exists) {
                console.log('[Audio] New audio message received:', audioUrl);
                // Auto-play new audio message immediately
                const audio = new Audio(audioUrl);
                audio.preload = 'auto';
                audio.volume = 1.0;
                audio.oncanplaythrough = async () => {
                  try {
                    await audio.play();
                    console.log('[Audio] Auto-playing new message');
                    toast.success('Reproduzindo mensagem...');
                  } catch (e) {
                    console.log('[Audio] Autoplay blocked, user interaction needed');
                    toast.info('Toque no áudio para ouvir');
                  }
                };
                audio.onerror = (e) => {
                  console.error('[Audio] Error loading audio:', e);
                };
                audio.load();
                
                return [...prev, { url: audioUrl, timestamp: Date.now() }];
              }
              return prev;
            });
          } else if (currentStatus === 'visitor_audio_response' || currentStatus === 'visitor_text_message') {
            // Visitor response statuses - DON'T change callStatus, just log
            console.log('[VisitorCall] Visitor response status, no state change needed');
          } else if (currentStatus === 'answered') {
            setCallStatus(prev => {
              if (prev !== 'answered' && prev !== 'video_call' && prev !== 'audio_message') {
                toast.success('Morador atendeu! Aguarde...');
                if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
                return 'answered';
              }
              return prev;
            });
          } else if (currentStatus === 'ended') {
            // Get the protocol number when call ends
            if (updatedCall.protocol_number) {
              setProtocolNumber(updatedCall.protocol_number);
              setShowProtocolDialog(true);
            }
            setCallStatus(prev => {
              if (prev !== 'ended') {
                toast.info('O morador encerrou a chamada.');
                if ('vibrate' in navigator) navigator.vibrate([500, 200, 500, 200, 500]);
                return 'ended';
              }
              return prev;
            });
          }
          // For other statuses like 'pending', 'doorbell_ringing', etc. - no state change
        }
      )
      .subscribe();

    return () => {
      console.log('Removing visitor real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [roomName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify owner when visitor scans QR code (page loads)
  useEffect(() => {
    if (!roomName || notified) return;

    const notifyOwner = async () => {
      try {
        // First try to update existing video_call
        const { data: existingCall, error: fetchError } = await supabase
          .from('video_calls')
          .select('id, property_id')
          .eq('room_name', roomName)
          .maybeSingle();

        if (existingCall) {
          // Call exists, update it
          const { error } = await supabase
            .from('video_calls')
            .update({
              visitor_joined: true,
              status: 'pending',
            })
            .eq('room_name', roomName);

          if (error) {
            console.log('Could not notify owner:', error);
          } else {
            console.log('Owner notified - visitor scanned QR code');
            setNotified(true);
          }
        } else {
          // Call doesn't exist - need to find property by access_code and create a new call
          console.log('No existing call found for room:', roomName);
          
          // The roomName is the access code - find the property
          const { data: accessCode, error: accessError } = await supabase
            .from('access_codes')
            .select('property_id, user_id')
            .eq('code', roomName)
            .maybeSingle();

          if (accessCode && accessCode.property_id) {
            // Get property name
            const { data: property } = await supabase
              .from('properties')
              .select('name, visitor_always_connected')
              .eq('id', accessCode.property_id)
              .maybeSingle();

            if (property) {
              // Create a new video_call entry using the original access code as room_name
              // This ensures the real-time subscription will work correctly
              const { error: insertError } = await supabase
                .from('video_calls')
                .insert({
                  room_name: roomName, // Keep the original access code as room_name
                  property_id: accessCode.property_id,
                  property_name: property.name,
                  owner_id: accessCode.user_id,
                  visitor_joined: true,
                  status: 'pending',
                });

              if (insertError) {
                console.error('Error creating video call:', insertError);
              } else {
                console.log('Created new video call for visitor with room:', roomName);
                setNotified(true);
                
                // Check if visitor_always_connected is enabled
                if (property.visitor_always_connected) {
                  setVisitorAlwaysConnected(true);
                }
              }
            }
          } else {
            console.log('Access code not found or no property linked:', roomName);
          }
        }
      } catch (err) {
        console.error('Error notifying owner:', err);
      }
    };

    notifyOwner();
  }, [roomName, notified]);

  const handleJoinCall = () => {
    if (meetLink) {
      const decodedLink = decodeURIComponent(meetLink);
      console.log('Redirecting to Google Meet:', decodedLink);
      window.location.href = decodedLink;
    } else {
      toast.error('Link da reunião não disponível');
    }
  };

  const handleCopyLink = async () => {
    if (meetLink) {
      try {
        await navigator.clipboard.writeText(decodeURIComponent(meetLink));
        setCopied(true);
        toast.success('Link copiado!');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Erro ao copiar link');
      }
    }
  };

  const handleRingDoorbell = async () => {
    if (!roomName || callStatus === 'ringing') return;
    
    // Set status to ringing - timeout will be started by useEffect
    setCallStatus('ringing');
    
    try {
      // Get the call to find the owner_id
      const { data: callData } = await supabase
        .from('video_calls')
        .select('owner_id, property_name')
        .eq('room_name', roomName)
        .maybeSingle();
      
      const { error } = await supabase
        .from('video_calls')
        .update({
          status: 'doorbell_ringing',
        })
        .eq('room_name', roomName);

      if (error) {
        console.error('Error ringing doorbell:', error);
        toast.error('Erro ao tocar campainha');
        setCallStatus('waiting');
      } else {
        toast.success('Campainha tocando! Aguarde o morador atender...');
        
        // Send push notification to owner
        if (callData?.owner_id) {
          supabase.functions.invoke('send-push-notification', {
            body: {
              userId: callData.owner_id,
              title: '🔔 Campainha tocando!',
              body: `Visitante na porta - ${callData.property_name || propertyName}`,
              data: { roomName, propertyName: callData.property_name || propertyName },
            },
          }).catch(err => console.error('Error sending push notification:', err));
        }
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erro ao tocar campainha');
      setCallStatus('waiting');
    }
  };

  // Manage ringing timeout - start when ringing, clear when answered
  useEffect(() => {
    // Clear timeout if call was answered
    if (callStatus === 'answered' || callStatus === 'video_call' || callStatus === 'audio_message' || callStatus === 'ended') {
      if (ringingTimeoutRef.current) {
        console.log('Clearing ringing timeout - call answered or ended');
        clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
      }
    }
    
    // Start timeout if ringing and no timeout exists
    if (callStatus === 'ringing' && !ringingTimeoutRef.current) {
      console.log('Starting 60 second timeout for not_answered');
      ringingTimeoutRef.current = setTimeout(async () => {
        console.log('Timeout reached - showing not answered dialog');
        setCallStatus('not_answered');
        setShowNotAnsweredDialog(true);
        
        // Update database status to stop doorbell on owner's panel
        if (roomName) {
          await supabase
            .from('video_calls')
            .update({ status: 'not_answered' })
            .eq('room_name', roomName);
        }
      }, 60000); // 60 seconds
    }
    
    // Cleanup only on unmount, not on every re-render
  }, [callStatus]);
  
  // Separate cleanup effect for unmount only
  useEffect(() => {
    return () => {
      if (ringingTimeoutRef.current) {
        console.log('Component unmounting - clearing timeout');
        clearTimeout(ringingTimeoutRef.current);
      }
    };
  }, []);

  // Reset call when page is CLOSED (not minimized) to keep visitor panel fresh
  // IMPORTANT: Only reset on actual page close, not on visibility change (minimizing)
  useEffect(() => {
    if (!roomName) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable data sending on actual page close
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/video_calls?room_name=eq.${roomName}`;
      const body = JSON.stringify({ 
        status: 'pending',
        audio_message_url: null,
        owner_joined: false,
        visitor_joined: false
      });
      
      navigator.sendBeacon?.(url, body);
      console.log('[VisitorCall] Call reset on page close');
    };

    // Only listen for actual page close/refresh, NOT visibility changes
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [roomName]);

  // Auto-ring is disabled - visitor must manually press doorbell button
  // This ensures the visitor always sees the doorbell button first

  const handleTryAgain = () => {
    setShowNotAnsweredDialog(false);
    setShowEmergencyContact(false);
    setEmergencyCountdown(5);
    // Toca a campainha novamente para alertar o proprietário
    handleRingDoorbell();
  };

  // Auto-show emergency contact after 5 seconds when dialog opens with countdown
  useEffect(() => {
    if (showNotAnsweredDialog && !showEmergencyContact) {
      setEmergencyCountdown(5);
      const interval = setInterval(() => {
        setEmergencyCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowEmergencyContact(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showNotAnsweredDialog, showEmergencyContact]);

  const handleGoBack = () => {
    window.history.back();
  };

  // Status display component - memoized to prevent unnecessary re-renders
  const statusDisplayContent = useMemo(() => {
    console.log('StatusDisplay computing - callStatus:', callStatus, 'visitorAlwaysConnected:', visitorAlwaysConnected);
    
    // If visitor_always_connected is enabled OR ringing, show the connected status
    if (visitorAlwaysConnected || callStatus === 'ringing' || callStatus === 'waiting') {
      const isRinging = callStatus === 'ringing';
      
      return (
        <div
          key="connected"
          className="bg-green-500/20 border border-green-500/50 rounded-xl p-5 mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            {isRinging ? (
              <Bell className="w-8 h-8 text-amber-500 animate-bounce" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
          </div>
          <h3 className={`font-bold text-lg ${isRinging ? 'text-amber-500' : 'text-green-500'}`}>
            {isRinging ? "Visitante Conectado!" : "Visitante Conectado!"}
          </h3>
          <div className="flex items-center justify-center gap-2 text-foreground mt-2">
            <User className="w-4 h-4" />
            <p className="text-sm">
              {isRinging ? "Aguardando..." : "Conectando..."}
            </p>
          </div>
        </div>
      );
    }

    switch (callStatus) {
      case 'answered':
        return (
          <div
            key="answered"
            className="bg-green-500/20 border border-green-500/50 rounded-xl p-5 mb-6"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="font-bold text-lg text-green-500 mb-2">Morador atendeu!</h3>
            <div className="flex items-center justify-center gap-2 text-foreground">
              <User className="w-4 h-4" />
              <p className="text-sm">
                O morador está se dirigindo até você ou iniciará uma videochamada em breve.
              </p>
            </div>
          </div>
        );
      
      case 'video_call':
        return (
          <div
            key="video_call"
            className="bg-primary/20 border border-primary/50 rounded-xl p-5 mb-6"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Video className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="font-bold text-lg text-primary mb-2">Videochamada iniciada!</h3>
            <p className="text-sm text-foreground mb-4">
              O morador está aguardando você na chamada de vídeo.
            </p>
            <Button
              variant="call"
              size="lg"
              className="w-full text-lg py-6"
              onClick={handleJoinCall}
            >
              <Phone className="w-6 h-6" />
              Entrar na chamada agora
            </Button>
          </div>
        );
      
      case 'audio_message':
        return (
          <div
            key="audio_message"
            className="bg-primary/20 border border-primary/50 rounded-xl p-5 mb-6"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Volume2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg text-primary mb-3">
              {audioMessages.length > 1 ? `${audioMessages.length} mensagens do morador` : 'Mensagem do morador'}
            </h3>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {audioMessages.map((message, index) => (
                <div
                  key={message.url}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    currentPlayingIndex === index ? 'bg-primary/30' : 'bg-secondary/50'
                  }`}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 rounded-full flex-shrink-0"
                    onClick={async () => {
                      console.log('[Audio] Button clicked, index:', index, 'currentPlayingIndex:', currentPlayingIndex);
                      
                      if (currentPlayingIndex === index && audioRef.current) {
                        console.log('[Audio] Pausing current audio');
                        audioRef.current.pause();
                        setCurrentPlayingIndex(null);
                        return;
                      }
                      
                      try {
                        const audio = new Audio();
                        audio.preload = 'auto';
                        audio.crossOrigin = 'anonymous';
                        
                        audio.oncanplaythrough = async () => {
                          console.log('[Audio] Can play through, starting playback');
                          try {
                            await audio.play();
                            console.log('[Audio] Playback started successfully');
                            setCurrentPlayingIndex(index);
                            
                            if (audioRef.current) {
                              audioRef.current.pause();
                            }
                            (audioRef as any).current = audio;
                          } catch (playError) {
                            console.error('[Audio] Play error:', playError);
                            toast.error('Toque novamente para ouvir');
                          }
                        };
                        
                        audio.onended = () => {
                          console.log('[Audio] Playback ended');
                          setCurrentPlayingIndex(null);
                        };
                        
                        audio.onerror = (e) => {
                          console.error('[Audio] Error loading audio:', e);
                          toast.error('Erro ao carregar áudio');
                          setCurrentPlayingIndex(null);
                        };
                        
                        console.log('[Audio] Loading audio from:', message.url);
                        audio.src = message.url;
                        audio.load();
                        
                        setTimeout(async () => {
                          if (audio.readyState >= 2) {
                            try {
                              await audio.play();
                              setCurrentPlayingIndex(index);
                              (audioRef as any).current = audio;
                            } catch (e) {
                              console.log('[Audio] Waiting for canplaythrough...');
                            }
                          }
                        }, 100);
                        
                      } catch (error) {
                        console.error('[Audio] Error:', error);
                        toast.error('Erro ao reproduzir áudio');
                      }
                    }}
                  >
                    {currentPlayingIndex === index ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Mensagem {index + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {currentPlayingIndex === index && (
                    <div className="flex gap-0.5 animate-pulse">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-1 bg-primary rounded-full" style={{ height: `${8 + i * 4}px` }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <audio 
              ref={audioRef}
              onEnded={() => setCurrentPlayingIndex(null)}
              onError={(e) => {
                console.error('Audio error:', e);
                toast.error('Erro ao carregar áudio');
              }}
              preload="auto"
              playsInline
              className="hidden"
            />

            {/* Visitor Audio Response - placeholder, actual component rendered outside useMemo */}
            <div id="visitor-audio-recorder-placeholder" className="mt-4 pt-4 border-t border-primary/30" />
          </div>
        );
      
      case 'ended':
        return (
          <div
            key="ended"
            className="bg-gradient-to-b from-destructive/20 to-destructive/5 border border-destructive/30 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center">
                  <PhoneOff className="w-8 h-8 text-destructive" />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-xl text-destructive mb-2">Chamada Encerrada</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                O morador finalizou a chamada.
                <br />
                <span className="text-foreground font-medium">Obrigado pela visita!</span>
              </p>
            </div>

            {/* Protocol Number Display */}
            {protocolNumber && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Número do Protocolo</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-background px-3 py-2 rounded-lg text-sm font-mono font-bold text-foreground">
                    {protocolNumber}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(protocolNumber);
                        setProtocolCopied(true);
                        toast.success('Protocolo copiado!');
                        setTimeout(() => setProtocolCopied(false), 2000);
                      } catch {
                        toast.error('Erro ao copiar');
                      }
                    }}
                  >
                    {protocolCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Guarde este número para referência futura
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <Button
                variant="default"
                size="lg"
                className="w-full"
                onClick={() => {
                  setCallStatus('waiting');
                  setAudioMessages([]);
                  setMeetLink(null);
                  setNotified(false);
                  setHasAutoRung(false);
                  setProtocolNumber(null);
                }}
              >
                <Bell className="w-5 h-5 mr-2" />
                Tocar campainha novamente
              </Button>
              
              {ownerPhone && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full gap-2 text-green-600 border-green-600/50 hover:bg-green-600/10"
                  onClick={handleWhatsApp}
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  Enviar mensagem via WhatsApp
                </Button>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Você pode tocar a campainha novamente ou entrar em contato pelo WhatsApp
            </p>
          </div>
        );
      
      default:
        return null;
    }
  }, [callStatus, visitorAlwaysConnected, audioMessages, currentPlayingIndex, ownerPhone, roomName, handleJoinCall, handleWhatsApp]);

  // Simple wrapper for the memoized content
  const StatusDisplay = () => statusDisplayContent;

  // Show the visitor call page if we have a roomName (with or without meetLink)
  if (roomName) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="glass rounded-3xl p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
            {/* Animated rings */}
            <div className="relative w-28 h-28 mx-auto mb-6">
              <AnimatePresence mode="wait">
                {callStatus === 'video_call' ? (
                  <motion.div
                    key="video"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative w-28 h-28 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center"
                  >
                    <Video className="w-10 h-10 text-primary" />
                  </motion.div>
                ) : callStatus === 'audio_message' ? (
                  <motion.div
                    key="audio"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative w-28 h-28 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center"
                  >
                    <motion.div
                      animate={currentPlayingIndex !== null ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      <Volume2 className="w-10 h-10 text-primary" />
                    </motion.div>
                    {audioMessages.length > 1 && (
                      <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {audioMessages.length}
                      </div>
                    )}
                  </motion.div>
                ) : callStatus === 'answered' ? (
                  <motion.div
                    key="answered"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative w-28 h-28 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center"
                  >
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </motion.div>
                ) : callStatus === 'ended' ? (
                  <motion.div
                    key="ended"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative w-28 h-28 rounded-full bg-destructive/20 border-4 border-destructive flex items-center justify-center"
                  >
                    <Phone className="w-10 h-10 text-destructive" />
                  </motion.div>
                ) : callStatus === 'not_answered' ? (
                  <motion.div
                    key="not_answered"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative w-28 h-28 rounded-full bg-amber-500/20 border-4 border-amber-500 flex items-center justify-center"
                  >
                    <PhoneOff className="w-10 h-10 text-amber-500" />
                  </motion.div>
                ) : (
                  <motion.div key="default">
                    <motion.div 
                      className="absolute inset-0 rounded-full border-2 border-primary/20"
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div 
                      className="absolute inset-0 rounded-full border-2 border-primary/20"
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    />
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                    <div className="relative w-28 h-28 rounded-full bg-primary/10 border-4 border-primary/50 flex items-center justify-center">
                      <Bell className="w-10 h-10 text-primary" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <h1 className="text-2xl font-bold mb-2">{decodeURIComponent(propertyName)}</h1>
            <p className="text-muted-foreground mb-2">Portaria Virtual</p>
            
            {/* Call time counter and recording warning - only when answered */}
            {callAnsweredTime && callStatus !== 'ended' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-2 mb-4"
              >
                <div className="flex items-center gap-2 text-green-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-mono font-semibold">{elapsedTime}</span>
                  <span className="text-xs">em atendimento</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-500">
                  <span className="font-bold">!</span>
                  <span>Esta chamada está sendo gravada para consultas futuras</span>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <StatusDisplay key={callStatus} />
            </AnimatePresence>

            {/* Visitor Audio Recorder - rendered outside useMemo to prevent unmounting */}
            {callStatus === 'audio_message' && (
              <div className="mt-4 pt-4 border-t border-primary/30 bg-primary/20 rounded-b-xl -mt-6 px-5 pb-5">
                <p className="text-xs text-muted-foreground mb-2 text-center">Responder com áudio</p>
                <VisitorAudioRecorder 
                  roomName={roomName || ''} 
                  onAudioSent={() => toast.success('Resposta enviada!')}
                />
              </div>
            )}

            {callStatus !== 'video_call' && callStatus !== 'ended' && (
              <div className="space-y-3">
                {/* Botão de campainha */}
                <motion.div 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  animate={callStatus === 'waiting' ? { scale: [1, 1.03, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Button
                    size="lg"
                    className={`w-full font-semibold text-lg py-6 ${
                      callStatus === 'answered' || callStatus === 'audio_message'
                        ? 'bg-green-600 hover:bg-green-700'
                        : callStatus === 'ringing' 
                          ? 'bg-amber-600 hover:bg-amber-700' 
                          : 'bg-amber-500 hover:bg-amber-600'
                    } text-white`}
                    onClick={handleRingDoorbell}
                    disabled={callStatus === 'ringing' || callStatus === 'answered' || callStatus === 'audio_message'}
                  >
                    {callStatus === 'answered' || callStatus === 'audio_message' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Aguarde, estou indo até você</span>
                      </div>
                    ) : callStatus === 'ringing' ? (
                      <>
                        <Bell className="w-6 h-6 animate-bounce" />
                        <span>Aguardando...</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-6 h-6" />
                        <span>Tocar Campainha</span>
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Video recorder button in a box */}
                <VisitorVideoRecorder 
                  roomName={roomName || ''} 
                  onVideoSent={() => toast.success('Vídeo enviado!')}
                />

                {/* Audio recorder button in a box */}
                <div className="border border-border rounded-xl p-4 bg-card shadow-sm">
                  <p className="text-sm text-muted-foreground text-center mb-3">Envie uma mensagem em áudio</p>
                  <VisitorAudioRecorder 
                    roomName={roomName || ''} 
                    onAudioSent={() => toast.success('Áudio enviado!')}
                  />
                </div>

                {/* Chat button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full font-semibold text-base py-5 border-primary/30 hover:bg-primary/10"
                    onClick={() => setShowChatDialog(true)}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Conversar com Assistente</span>
                  </Button>
                </motion.div>

                {(callStatus === 'answered' || callStatus === 'ringing') && (
                  <div className="border-t border-border my-4 pt-4">
                    <p className="text-xs text-muted-foreground mb-3">
                      Se o morador iniciar videochamada:
                    </p>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={handleJoinCall}
                    >
                      <ExternalLink className="w-5 h-5" />
                      Entrar na chamada
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={handleCopyLink}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copiado!' : 'Copiar link'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {callStatus === 'video_call' && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar link da chamada'}
              </Button>
            )}

            <p className="text-xs text-muted-foreground mt-6">
              Powered by DoorVii Home
            </p>
          </div>
        </motion.div>

        {/* Chat Dialog */}
        <Dialog open={showChatDialog} onOpenChange={handleCloseChatDialog}>
          <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0">
            <DialogHeader className="p-4 pb-2 border-b">
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Assistente Virtual
              </DialogTitle>
            </DialogHeader>
            
            {/* Identification Form */}
            {!hasIdentified ? (
              <div className="p-4 space-y-4">
                <div className="text-center mb-4">
                  <User className="w-12 h-12 mx-auto mb-3 text-primary opacity-60" />
                  <p className="text-sm font-medium">Identificação do Entregador</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Informe seus dados conforme cadastro no painel do fornecedor
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Nome Completo</label>
                    <input
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="Digite seu nome..."
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      maxLength={100}
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">CPF</label>
                    <input
                      type="text"
                      value={visitorCpf}
                      onChange={(e) => {
                        // Format CPF as user types
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 11) {
                          const formatted = value
                            .replace(/(\d{3})(\d)/, '$1.$2')
                            .replace(/(\d{3})(\d)/, '$1.$2')
                            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                          setVisitorCpf(formatted);
                        }
                      }}
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      maxLength={14}
                    />
                  </div>
                </div>
                
                <Button
                  className="w-full mt-4"
                  onClick={() => setHasIdentified(true)}
                  disabled={!visitorName.trim()}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Iniciar Conversa
                </Button>
                
                <button
                  type="button"
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setHasIdentified(true)}
                >
                  Continuar sem identificação
                </button>
              </div>
            ) : (
              <>
                {/* Visitor Info Badge */}
                {visitorName && (
                  <div className="px-4 py-2 bg-muted/50 border-b flex items-center gap-2 text-xs">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <span className="font-medium">{visitorName}</span>
                    {visitorCpf && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">CPF: {visitorCpf}</span>
                      </>
                    )}
                  </div>
                )}
                
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px] max-h-[350px]">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Olá{visitorName ? `, ${visitorName.split(' ')[0]}` : ''}! Como posso ajudá-lo?</p>
                      <p className="text-xs mt-1">Digite sua mensagem abaixo para iniciar.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            msg.sender === 'visitor'
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                          <p className={`text-[10px] mt-1 ${msg.sender === 'visitor' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                  {isSendingChat && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 pt-2 border-t">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 px-4 py-2 rounded-full border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      disabled={isSendingChat}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="rounded-full h-10 w-10"
                      disabled={!chatInput.trim() || isSendingChat}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Not Answered Dialog */}
        <AlertDialog open={showNotAnsweredDialog} onOpenChange={setShowNotAnsweredDialog}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogTitle className="text-center text-lg font-semibold">
              Chamada Não Atendida
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              O morador não atendeu. Por favor, tente novamente ou entre em contato por outro meio.
            </AlertDialogDescription>
            
            {/* Countdown timer with contact button */}
            {!showEmergencyContact && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-3 py-2"
              >
                {emergencyCountdown > 0 ? (
                  <>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Opções de contato em <span className="font-bold text-foreground">{emergencyCountdown}s</span>
                    </span>
                  </>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-primary hover:text-primary/80"
                  onClick={() => setShowEmergencyContact(true)}
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Contato
                </Button>
              </motion.div>
            )}
            <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
              <AlertDialogAction 
                onClick={handleTryAgain}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Tentar Novamente
              </AlertDialogAction>
              
              <AnimatePresence>
                {showEmergencyContact && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full border-t border-border pt-4 mt-2 overflow-hidden"
                  >
                    <p className="text-sm text-muted-foreground mb-3 text-center">Contato de Emergência</p>
                    <div className="flex items-center justify-center gap-2">
                      {ownerPhone && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="rounded-full h-10 w-10"
                          onClick={() => window.open(`tel:${ownerPhone}`, '_self')}
                        >
                          <Phone className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-full h-10 w-10 bg-green-500 hover:bg-green-600 border-green-500"
                        onClick={handleWhatsApp}
                      >
                        <WhatsAppIcon className="w-4 h-4 text-white" />
                      </Button>
                      {ownerPhone && (
                        <Button
                          variant="outline"
                          className="rounded-full h-10 px-4"
                          onClick={() => {
                            setShowNotAnsweredDialog(false);
                            setShowEmergencyContact(false);
                            setShowMessageSentDialog(true);
                          }}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Mensagem
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Message Sent Dialog */}
        <Dialog open={showMessageSentDialog} onOpenChange={setShowMessageSentDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-semibold">
                Enviou uma mensagem para o proprietário
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea 
                value={emergencyMessage}
                onChange={(e) => setEmergencyMessage(e.target.value)}
                className="min-h-[100px] resize-none border-primary/50"
                placeholder="Digite sua mensagem..."
              />
            </div>
            <Button 
              className="w-full bg-foreground text-background hover:bg-foreground/90"
              onClick={async () => {
                // Send message to database so owner can see it
                if (roomName && emergencyMessage.trim()) {
                  try {
                    const { error } = await supabase
                      .from('video_calls')
                      .update({ 
                        visitor_text_message: emergencyMessage.trim(),
                        status: 'visitor_text_message'
                      })
                      .eq('room_name', roomName);
                    
                    if (error) {
                      console.error('Error sending message:', error);
                      toast.error('Erro ao enviar mensagem');
                    } else {
                      toast.success('Mensagem enviada!');
                    }
                  } catch (e) {
                    console.error('Error:', e);
                    toast.error('Erro ao enviar mensagem');
                  }
                }
                setShowMessageSentDialog(false);
              }}
            >
              Mensagem Enviada
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Not answered state - show buttons even outside dialog
  if (callStatus === 'not_answered' && !showNotAnsweredDialog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="glass rounded-3xl p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="relative w-28 h-28 mx-auto mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative w-28 h-28 rounded-full bg-amber-500/20 border-4 border-amber-500 flex items-center justify-center"
              >
                <PhoneOff className="w-10 h-10 text-amber-500" />
              </motion.div>
            </div>

            <h2 className="text-xl font-bold mb-2">Chamada Não Atendida</h2>
            <p className="text-muted-foreground mb-6">
              O morador não está disponível no momento.
            </p>

            <div className="flex gap-3 mb-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleGoBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleTryAgain}
              >
                <Phone className="w-4 h-4 mr-2" />
                Ligar Novamente
              </Button>
            </div>

            {ownerPhone && (
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground mb-3">Contato de Emergência</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{ownerPhone}</span>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full h-10 w-10"
                      onClick={() => window.open(`tel:${ownerPhone}`, '_self')}
                    >
                      <Phone className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full h-10 w-10"
                      onClick={() => window.open(`sms:${ownerPhone}`, '_self')}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full h-10 w-10 bg-green-500 hover:bg-green-600 border-green-500"
                      onClick={handleWhatsApp}
                    >
                      <WhatsAppIcon className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-6">
              Powered by DoorVii Home
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Fallback for links without roomName
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <div className="glass rounded-3xl p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-muted/20 blur-2xl rounded-full" />
            <div className="relative w-32 h-32 rounded-full bg-muted/10 border-4 border-muted/50 flex items-center justify-center">
              <Video className="w-12 h-12 text-muted-foreground" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">Link inválido</h1>
          <p className="text-muted-foreground mb-4">
            Este link de chamada não é válido ou expirou.
          </p>
          <p className="text-sm text-muted-foreground">
            Peça um novo QR code ao morador.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VisitorCall;
