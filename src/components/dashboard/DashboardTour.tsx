import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Home,
  Bell,
  Video,
  QrCode,
  Users,
  History,
  Settings,
  MessageSquare,
  Package,
  Smartphone,
  CheckCircle,
  Luggage,
} from "lucide-react";

interface TourStep {
  id: number;
  icon: React.ElementType;
  title: string;
  description: string;
  tips: string[];
  gradient: string;
  visual: React.ReactNode;
}

const tourSteps: TourStep[] = [
  {
    id: 1,
    icon: Home,
    title: "Suas Propriedades",
    description: "Gerencie todas as suas casas, apartamentos ou escritórios em um só lugar. Cada propriedade tem seu próprio QR Code e histórico.",
    tips: ["Adicione quantas propriedades precisar", "Cada propriedade tem QR Code único", "Veja status online/offline em tempo real"],
    gradient: "from-blue-500 to-cyan-500",
    visual: (
      <div className="space-y-3">
        {[
          { name: "Casa Principal", status: "online", icon: "🏠" },
          { name: "Apartamento", status: "offline", icon: "🏢" },
          { name: "Escritório", status: "online", icon: "🏛️" },
        ].map((prop, i) => (
          <motion.div
            key={i}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-3 bg-white/10 rounded-lg p-3"
          >
            <span className="text-2xl">{prop.icon}</span>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{prop.name}</p>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${prop.status === 'online' ? 'bg-green-400' : 'bg-gray-400'}`} />
                <span className="text-white/60 text-xs">{prop.status === 'online' ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: 2,
    icon: Bell,
    title: "Campainha Inteligente",
    description: "Quando um visitante toca a campainha, você recebe notificação instantânea no seu celular com som e vibração.",
    tips: ["Toque sonoro característico", "Vibração para não perder", "Funciona mesmo com app em segundo plano"],
    gradient: "from-orange-500 to-amber-500",
    visual: (
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center"
          >
            <Bell className="w-8 h-8 text-white" />
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 bg-white/10 rounded-lg p-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <div>
              <p className="text-white text-sm font-medium">Visitante na porta!</p>
              <p className="text-white/60 text-xs">Casa Principal • Agora</p>
            </div>
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    id: 3,
    icon: Video,
    title: "Videochamada com Visitante",
    description: "Inicie uma videochamada HD com o visitante para ver e conversar. Use o Google Meet integrado para máxima qualidade.",
    tips: ["Vídeo em alta definição", "Áudio bidirecional claro", "Funciona no navegador do visitante"],
    gradient: "from-green-500 to-emerald-500",
    visual: (
      <div className="relative">
        <div className="bg-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="aspect-video bg-slate-700 rounded-lg flex items-center justify-center relative">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Video className="w-12 h-12 text-green-400" />
            </motion.div>
            <Badge className="absolute top-2 left-2 bg-red-500/80">
              <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" /> AO VIVO
            </Badge>
          </div>
          <div className="flex justify-center gap-3 mt-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white">📞</span>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span>🎤</span>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span>📹</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    icon: QrCode,
    title: "QR Code de Acesso",
    description: "Gere QR Codes únicos para cada propriedade. Visitantes escaneiam e você recebe a chamada instantaneamente.",
    tips: ["Imprima e cole na entrada", "Compartilhe digitalmente", "Funciona sem instalar app"],
    gradient: "from-purple-500 to-pink-500",
    visual: (
      <div className="text-center">
        <motion.div
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 mx-auto bg-white rounded-xl p-2 mb-4"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg grid grid-cols-5 gap-1 p-2">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-sm ${Math.random() > 0.4 ? "bg-white" : "bg-transparent"}`}
              />
            ))}
          </div>
        </motion.div>
        <Badge className="bg-purple-500/20 text-purple-200">
          Visitante escaneia → Você recebe a chamada
        </Badge>
      </div>
    ),
  },
  {
    id: 5,
    icon: MessageSquare,
    title: "Mensagens de Áudio/Vídeo",
    description: "Quando você não pode atender, o visitante pode deixar uma mensagem de áudio ou vídeo que você assiste depois.",
    tips: ["Grave mensagem de resposta", "Receba vídeos do visitante", "Histórico salvo automaticamente"],
    gradient: "from-cyan-500 to-blue-500",
    visual: (
      <div className="space-y-3">
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white/10 rounded-lg p-3 ml-8"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-sm">V</div>
            <div className="flex-1">
              <div className="h-2 bg-cyan-400/50 rounded-full w-24">
                <motion.div
                  className="h-full bg-cyan-400 rounded-full"
                  animate={{ width: ["0%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <p className="text-white/60 text-xs mt-1">Áudio do visitante • 0:15</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-primary/30 rounded-lg p-3 mr-8"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm text-white">Eu</div>
            <div className="flex-1">
              <p className="text-white/60 text-xs">Sua resposta • 0:08</p>
            </div>
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    id: 6,
    icon: Users,
    title: "Compartilhe com a Família",
    description: "Convide familiares para gerenciar suas propriedades. Todos recebem notificações e podem atender chamadas.",
    tips: ["Convite por código único", "Cada membro recebe alertas", "Gerencie permissões"],
    gradient: "from-rose-500 to-red-500",
    visual: (
      <div className="flex flex-wrap gap-3 justify-center">
        {[
          { name: "Você", role: "Admin", emoji: "👤" },
          { name: "Cônjuge", role: "Membro", emoji: "💑" },
          { name: "Filho(a)", role: "Membro", emoji: "👦" },
          { name: "Convidado", role: "Visitante", emoji: "🧑" },
        ].map((member, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className="flex flex-col items-center bg-white/10 rounded-lg p-3 min-w-[70px]"
          >
            <span className="text-2xl mb-1">{member.emoji}</span>
            <p className="text-white text-xs font-medium">{member.name}</p>
            <Badge variant="outline" className="text-[10px] mt-1 border-white/30 text-white/80">
              {member.role}
            </Badge>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: 7,
    icon: Package,
    title: "Rastreamento de Entregas",
    description: "Acompanhe suas entregas de grandes marketplaces. Veja quando o entregador está chegando.",
    tips: ["Integração com correios", "Alerta de entrega próxima", "Histórico de pacotes"],
    gradient: "from-amber-500 to-orange-500",
    visual: (
      <div className="space-y-2">
        {[
          { name: "Mercado Livre", status: "Saiu para entrega", icon: "📦", color: "bg-yellow-400" },
          { name: "Shopee", status: "Em trânsito", icon: "🚚", color: "bg-orange-400" },
          { name: "Amazon", status: "Entregue", icon: "✅", color: "bg-green-400" },
        ].map((pkg, i) => (
          <motion.div
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-3 bg-white/10 rounded-lg p-2"
          >
            <div className={`w-8 h-8 ${pkg.color} rounded-lg flex items-center justify-center text-lg`}>
              {pkg.icon}
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{pkg.name}</p>
              <p className="text-white/60 text-xs">{pkg.status}</p>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: 8,
    icon: History,
    title: "Histórico Completo",
    description: "Todas as atividades ficam registradas. Veja quem tocou a campainha, quando e se foi atendido.",
    tips: ["Timeline detalhada", "Filtre por tipo de evento", "Mídia salva automaticamente"],
    gradient: "from-indigo-500 to-violet-500",
    visual: (
      <div className="space-y-2">
        {[
          { time: "10:30", event: "Chamada atendida", icon: "✅", type: "success" },
          { time: "09:15", event: "Entrega recebida", icon: "📦", type: "info" },
          { time: "08:45", event: "Chamada perdida", icon: "❌", type: "warning" },
          { time: "Ontem", event: "Novo membro adicionado", icon: "👤", type: "info" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 bg-white/10 rounded-lg p-2"
          >
            <span className="text-lg">{item.icon}</span>
            <div className="flex-1">
              <p className="text-white text-sm">{item.event}</p>
              <p className="text-white/40 text-xs">{item.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: 9,
    icon: Settings,
    title: "Painel de Controle",
    description: "Controle sua caixa de entregas remotamente. Tranque, destranque e monitore o status de segurança em tempo real.",
    tips: ["Tranque/destranque remotamente", "Sensor de pacotes", "Histórico de acessos"],
    gradient: "from-slate-600 to-zinc-700",
    visual: (
      <div className="space-y-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/10 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-zinc-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">📦</span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">Caixa de Entregas</p>
                <p className="text-white/60 text-xs">Casa Principal</p>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
              Seguro
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 rounded-lg p-3 text-center"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="text-2xl mb-1"
              >
                🔒
              </motion.div>
              <p className="text-white/80 text-xs">Trancado</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 rounded-lg p-3 text-center"
            >
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-2xl mb-1"
              >
                📬
              </motion.div>
              <p className="text-white/80 text-xs">1 Pacote</p>
            </motion.div>
          </div>
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-2"
        >
          <div className="flex-1 bg-green-500/20 rounded-lg p-2 text-center">
            <span className="text-white text-xs">🔓 Destrancar</span>
          </div>
          <div className="flex-1 bg-red-500/20 rounded-lg p-2 text-center">
            <span className="text-white text-xs">🔒 Trancar</span>
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    id: 10,
    icon: Luggage,
    title: "MalaVii - Bagagens de Viagem",
    description: "Cole um adesivo NFC na sua mala. Em caso de extravio, qualquer pessoa pode ligar para você aproximando o celular.",
    tips: ["Recupere malas perdidas", "Funciona em aeroportos do mundo todo", "Privacidade do seu número protegida"],
    gradient: "from-amber-500 to-orange-500",
    visual: (
      <div className="space-y-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex justify-center"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative"
          >
            <div className="w-28 h-28 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Luggage className="w-14 h-14 text-white" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 border-4 border-amber-400 rounded-full"
            />
          </motion.div>
        </motion.div>
        <div className="grid grid-cols-2 gap-2">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 rounded-lg p-3 text-center"
          >
            <span className="text-2xl mb-1 block">✈️</span>
            <p className="text-white/80 text-xs">Aeroportos</p>
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 rounded-lg p-3 text-center"
          >
            <span className="text-2xl mb-1 block">🏨</span>
            <p className="text-white/80 text-xs">Hotéis</p>
          </motion.div>
        </div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-amber-500/20 rounded-lg p-2 text-center"
        >
          <span className="text-white text-xs">📱 Aproxime o celular → Ligue para o dono</span>
        </motion.div>
      </div>
    ),
  },
];

interface DashboardTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const DashboardTour = ({ isOpen, onClose, onComplete }: DashboardTourProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [progress, setProgress] = useState(0);
  const AUTOPLAY_INTERVAL = 6000;

  const currentStep = tourSteps[currentIndex];

  const nextSlide = useCallback(() => {
    if (currentIndex === tourSteps.length - 1) {
      onComplete?.();
      onClose();
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setProgress(0);
  }, [currentIndex, onClose, onComplete]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setProgress(0);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  }, []);

  const toggleAutoplay = useCallback(() => {
    setIsPlaying((prev) => !prev);
    setProgress(0);
  }, []);

  useEffect(() => {
    if (!isPlaying || isHovering || !isOpen) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + (100 / (AUTOPLAY_INTERVAL / 100));
      });
    }, 100);

    const slideInterval = setInterval(nextSlide, AUTOPLAY_INTERVAL);

    return () => {
      clearInterval(progressInterval);
      clearInterval(slideInterval);
    };
  }, [isPlaying, isHovering, isOpen, nextSlide]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setProgress(0);
      setIsPlaying(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Play className="w-3 h-3 mr-1" /> Tour do Dashboard
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} de {tourSteps.length}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="grid md:grid-cols-2 gap-0">
            {/* Visual Side */}
            <div className={`p-6 bg-gradient-to-br ${currentStep.gradient} min-h-[300px] flex items-center justify-center`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  {currentStep.visual}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Text Side */}
            <div className="p-6 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${currentStep.gradient} text-white text-sm mb-4`}>
                    <currentStep.icon className="w-4 h-4" />
                    Passo {currentIndex + 1}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {currentStep.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {currentStep.description}
                  </p>
                  <ul className="space-y-2">
                    {currentStep.tips.map((tip, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle className={`w-4 h-4 text-transparent bg-clip-text bg-gradient-to-r ${currentStep.gradient}`} style={{ color: currentStep.gradient.includes('blue') ? '#3b82f6' : currentStep.gradient.includes('orange') ? '#f97316' : currentStep.gradient.includes('green') ? '#22c55e' : currentStep.gradient.includes('purple') ? '#a855f7' : currentStep.gradient.includes('cyan') ? '#06b6d4' : currentStep.gradient.includes('rose') ? '#f43f5e' : currentStep.gradient.includes('amber') ? '#f59e0b' : '#8b5cf6' }} />
                        {tip}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 border-t bg-muted/30">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleAutoplay}
                className={isPlaying ? "text-primary border-primary" : ""}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5 items-center">
              {tourSteps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className="relative h-1.5 rounded-full overflow-hidden transition-all"
                  style={{ width: i === currentIndex ? '1.5rem' : '0.375rem' }}
                >
                  <div className="absolute inset-0 bg-muted-foreground/30" />
                  {i === currentIndex && isPlaying && (
                    <motion.div
                      className="absolute inset-0 bg-primary origin-left"
                      style={{ scaleX: progress / 100 }}
                    />
                  )}
                  {i === currentIndex && !isPlaying && (
                    <div className="absolute inset-0 bg-primary" />
                  )}
                  {i < currentIndex && (
                    <div className="absolute inset-0 bg-primary" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentIndex === tourSteps.length - 1 ? (
                <Button onClick={() => { onComplete?.(); onClose(); }} className="gap-2">
                  <CheckCircle className="w-4 h-4" /> Concluir Tour
                </Button>
              ) : (
                <Button variant="outline" size="icon" onClick={nextSlide}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
