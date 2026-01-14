import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  Video, 
  MessageCircle, 
  Mic, 
  Bell, 
  X, 
  Play, 
  TestTube,
  User,
  CheckCircle,
  Loader2,
  VolumeX,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CallSimulationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
  propertyName?: string;
}

type SimulationType = 'doorbell' | 'audio' | 'video' | 'message';
type SimulationStatus = 'idle' | 'running' | 'success' | 'error';

interface SimulationStep {
  type: SimulationType;
  status: SimulationStatus;
  message?: string;
}

export const CallSimulationPanel = ({ 
  isOpen, 
  onClose, 
  propertyId,
  propertyName = 'Teste de Simulação'
}: CallSimulationPanelProps) => {
  const { user } = useAuth();
  const [simulationType, setSimulationType] = useState<SimulationType | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [visitorMessage, setVisitorMessage] = useState('Olá, sou o entregador da Amazon!');
  const [visitorName, setVisitorName] = useState('João Entregador');
  const [currentRoomName, setCurrentRoomName] = useState<string | null>(null);
  const [audioMuted, setAudioMuted] = useState(false);

  const generateRoomName = () => `sim-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const playSimulationSound = (type: 'doorbell' | 'notification' | 'success' | 'error') => {
    if (audioMuted) return;
    
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      switch (type) {
        case 'doorbell':
          osc.frequency.value = 659;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.4, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.5);
          
          setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.frequency.value = 523;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.4, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.6);
          }, 300);
          break;
          
        case 'notification':
          osc.frequency.value = 880;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.15);
          break;
          
        case 'success':
          osc.frequency.value = 523;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.2);
          
          setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.frequency.value = 659;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.3, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.2);
          }, 150);
          break;
          
        case 'error':
          osc.frequency.value = 200;
          osc.type = 'sawtooth';
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
          break;
      }
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const addStep = (step: SimulationStep) => {
    setSimulationSteps(prev => [...prev, step]);
  };

  const updateLastStep = (status: SimulationStatus, message?: string) => {
    setSimulationSteps(prev => {
      const newSteps = [...prev];
      if (newSteps.length > 0) {
        newSteps[newSteps.length - 1] = { 
          ...newSteps[newSteps.length - 1], 
          status, 
          message: message || newSteps[newSteps.length - 1].message 
        };
      }
      return newSteps;
    });
  };

  const simulateDoorbell = async () => {
    if (!user) return;
    
    setIsSimulating(true);
    setSimulationSteps([]);
    const roomName = generateRoomName();
    setCurrentRoomName(roomName);
    
    try {
      // Step 1: Create video call record
      addStep({ type: 'doorbell', status: 'running', message: 'Criando chamada...' });
      playSimulationSound('notification');
      
      const { data: callData, error: callError } = await supabase
        .from('video_calls')
        .insert({
          room_name: roomName,
          property_id: propertyId || null,
          property_name: propertyName,
          owner_id: user.id,
          status: 'pending',
          protocol_number: `SIM-${Date.now()}`
        })
        .select()
        .single();

      if (callError) throw callError;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      updateLastStep('success', 'Chamada criada');
      
      // Step 2: Ring doorbell
      addStep({ type: 'doorbell', status: 'running', message: 'Tocando campainha...' });
      playSimulationSound('doorbell');
      
      // Vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([500, 200, 500]);
      }
      
      const { error: ringError } = await supabase
        .from('video_calls')
        .update({ 
          status: 'doorbell_ringing',
          visitor_joined: true 
        })
        .eq('id', callData.id);

      if (ringError) throw ringError;
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateLastStep('success', 'Campainha tocou!');
      playSimulationSound('success');
      
      toast.success('🔔 Simulação de campainha realizada!', {
        description: 'Verifique a notificação de chamada'
      });
      
    } catch (error) {
      console.error('Doorbell simulation error:', error);
      updateLastStep('error', 'Erro na simulação');
      playSimulationSound('error');
      toast.error('Erro ao simular campainha');
    } finally {
      setIsSimulating(false);
    }
  };

  const simulateAudioMessage = async () => {
    if (!user) return;
    
    setIsSimulating(true);
    setSimulationSteps([]);
    const roomName = generateRoomName();
    setCurrentRoomName(roomName);
    
    try {
      // Step 1: Create call
      addStep({ type: 'audio', status: 'running', message: 'Criando chamada...' });
      playSimulationSound('notification');
      
      const { data: callData, error: callError } = await supabase
        .from('video_calls')
        .insert({
          room_name: roomName,
          property_id: propertyId || null,
          property_name: propertyName,
          owner_id: user.id,
          status: 'pending',
          protocol_number: `SIM-AUDIO-${Date.now()}`
        })
        .select()
        .single();

      if (callError) throw callError;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      updateLastStep('success', 'Chamada criada');
      
      // Step 2: Simulate doorbell
      addStep({ type: 'audio', status: 'running', message: 'Tocando campainha...' });
      playSimulationSound('doorbell');
      
      await supabase
        .from('video_calls')
        .update({ status: 'doorbell_ringing', visitor_joined: true })
        .eq('id', callData.id);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateLastStep('success', 'Campainha tocou');
      
      // Step 3: Simulate visitor leaving audio message
      addStep({ type: 'audio', status: 'running', message: 'Visitante deixando áudio...' });
      
      // Use a sample audio URL for simulation
      const sampleAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      
      const { error: audioError } = await supabase
        .from('video_calls')
        .update({ 
          status: 'visitor_audio_response',
          visitor_audio_url: sampleAudioUrl,
          visitor_text_message: `[${visitorName}]: Mensagem de áudio simulada`
        })
        .eq('id', callData.id);

      if (audioError) throw audioError;
      
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 100, 300]);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateLastStep('success', 'Áudio enviado!');
      playSimulationSound('success');
      
      toast.success('🎤 Simulação de áudio realizada!', {
        description: 'Verifique a mensagem de áudio recebida'
      });
      
    } catch (error) {
      console.error('Audio simulation error:', error);
      updateLastStep('error', 'Erro na simulação');
      playSimulationSound('error');
      toast.error('Erro ao simular mensagem de áudio');
    } finally {
      setIsSimulating(false);
    }
  };

  const simulateVideoCall = async () => {
    if (!user) return;
    
    setIsSimulating(true);
    setSimulationSteps([]);
    const roomName = generateRoomName();
    setCurrentRoomName(roomName);
    
    try {
      // Step 1: Create call
      addStep({ type: 'video', status: 'running', message: 'Criando chamada...' });
      playSimulationSound('notification');
      
      const { data: callData, error: callError } = await supabase
        .from('video_calls')
        .insert({
          room_name: roomName,
          property_id: propertyId || null,
          property_name: propertyName,
          owner_id: user.id,
          status: 'pending',
          protocol_number: `SIM-VIDEO-${Date.now()}`
        })
        .select()
        .single();

      if (callError) throw callError;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      updateLastStep('success', 'Chamada criada');
      
      // Step 2: Doorbell
      addStep({ type: 'video', status: 'running', message: 'Tocando campainha...' });
      playSimulationSound('doorbell');
      
      await supabase
        .from('video_calls')
        .update({ status: 'doorbell_ringing', visitor_joined: true })
        .eq('id', callData.id);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateLastStep('success', 'Campainha tocou');
      
      // Step 3: Simulate video call request
      addStep({ type: 'video', status: 'running', message: 'Iniciando videochamada...' });
      
      const { error: videoError } = await supabase
        .from('video_calls')
        .update({ 
          status: 'video_call',
          meet_link: `https://meet.jit.si/${roomName}`,
          owner_joined: false
        })
        .eq('id', callData.id);

      if (videoError) throw videoError;
      
      if ('vibrate' in navigator) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateLastStep('success', 'Videochamada iniciada!');
      playSimulationSound('success');
      
      toast.success('📹 Simulação de vídeo realizada!', {
        description: 'Verifique o link de videochamada'
      });
      
    } catch (error) {
      console.error('Video simulation error:', error);
      updateLastStep('error', 'Erro na simulação');
      playSimulationSound('error');
      toast.error('Erro ao simular videochamada');
    } finally {
      setIsSimulating(false);
    }
  };

  const simulateTextMessage = async () => {
    if (!user) return;
    
    setIsSimulating(true);
    setSimulationSteps([]);
    const roomName = generateRoomName();
    setCurrentRoomName(roomName);
    
    try {
      // Step 1: Create call
      addStep({ type: 'message', status: 'running', message: 'Criando chamada...' });
      playSimulationSound('notification');
      
      const { data: callData, error: callError } = await supabase
        .from('video_calls')
        .insert({
          room_name: roomName,
          property_id: propertyId || null,
          property_name: propertyName,
          owner_id: user.id,
          status: 'pending',
          protocol_number: `SIM-MSG-${Date.now()}`
        })
        .select()
        .single();

      if (callError) throw callError;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      updateLastStep('success', 'Chamada criada');
      
      // Step 2: Doorbell
      addStep({ type: 'message', status: 'running', message: 'Tocando campainha...' });
      playSimulationSound('doorbell');
      
      await supabase
        .from('video_calls')
        .update({ status: 'doorbell_ringing', visitor_joined: true })
        .eq('id', callData.id);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateLastStep('success', 'Campainha tocou');
      
      // Step 3: Send text message
      addStep({ type: 'message', status: 'running', message: 'Enviando mensagem...' });
      
      const fullMessage = visitorName ? `[${visitorName}]: ${visitorMessage}` : visitorMessage;
      
      const { error: msgError } = await supabase
        .from('video_calls')
        .update({ 
          status: 'visitor_text_message',
          visitor_text_message: fullMessage
        })
        .eq('id', callData.id);

      if (msgError) throw msgError;
      
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateLastStep('success', 'Mensagem enviada!');
      playSimulationSound('success');
      
      toast.success('💬 Simulação de mensagem realizada!', {
        description: `Mensagem: "${visitorMessage}"`
      });
      
    } catch (error) {
      console.error('Message simulation error:', error);
      updateLastStep('error', 'Erro na simulação');
      playSimulationSound('error');
      toast.error('Erro ao simular mensagem');
    } finally {
      setIsSimulating(false);
    }
  };

  const runFullSimulation = async () => {
    setSimulationType(null);
    await simulateDoorbell();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await simulateTextMessage();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await simulateAudioMessage();
  };

  const getStepIcon = (step: SimulationStep) => {
    switch (step.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: SimulationType) => {
    switch (type) {
      case 'doorbell':
        return <Bell className="h-4 w-4" />;
      case 'audio':
        return <Mic className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'message':
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-primary/20 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Simulador de Chamadas</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAudioMuted(!audioMuted)}
                    className="h-8 w-8"
                  >
                    {audioMuted ? (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Teste o funcionamento do sistema de chamadas
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Visitor Info */}
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  Dados do Visitante Simulado
                </div>
                <Input
                  placeholder="Nome do visitante"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="h-9"
                />
                <Textarea
                  placeholder="Mensagem do visitante"
                  value={visitorMessage}
                  onChange={(e) => setVisitorMessage(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
              </div>

              {/* Simulation Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={simulateDoorbell}
                  disabled={isSimulating}
                  className="h-20 flex-col gap-2"
                >
                  <Bell className="h-6 w-6 text-amber-500" />
                  <span className="text-xs">Campainha</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={simulateAudioMessage}
                  disabled={isSimulating}
                  className="h-20 flex-col gap-2"
                >
                  <Mic className="h-6 w-6 text-blue-500" />
                  <span className="text-xs">Mensagem Áudio</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={simulateVideoCall}
                  disabled={isSimulating}
                  className="h-20 flex-col gap-2"
                >
                  <Video className="h-6 w-6 text-green-500" />
                  <span className="text-xs">Videochamada</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={simulateTextMessage}
                  disabled={isSimulating}
                  className="h-20 flex-col gap-2"
                >
                  <MessageCircle className="h-6 w-6 text-purple-500" />
                  <span className="text-xs">Mensagem Texto</span>
                </Button>
              </div>

              {/* Full Simulation Button */}
              <Button
                onClick={runFullSimulation}
                disabled={isSimulating}
                className="w-full"
                size="lg"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Simulando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Executar Simulação Completa
                  </>
                )}
              </Button>

              {/* Simulation Steps */}
              <AnimatePresence>
                {simulationSteps.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <div className="text-sm font-medium">Progresso:</div>
                    <div className="space-y-1.5">
                      {simulationSteps.map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded"
                        >
                          {getTypeIcon(step.type)}
                          <span className="flex-1">{step.message}</span>
                          {getStepIcon(step)}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Current Room Info */}
              {currentRoomName && (
                <div className="text-xs text-muted-foreground text-center">
                  Sala: {currentRoomName}
                </div>
              )}

              {/* Property Info */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {propertyName}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
