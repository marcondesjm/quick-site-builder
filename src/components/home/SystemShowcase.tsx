import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Bell,
  Shield,
  QrCode,
  Users,
  Package,
  History,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Circle,
  Bike,
  Car,
  Luggage,
} from "lucide-react";

interface ShowcaseItem {
  id: number;
  icon: React.ElementType;
  title: string;
  description: string;
  features: string[];
  gradient: string;
  mockup: React.ReactNode;
}

const showcaseItems: ShowcaseItem[] = [
  {
    id: 1,
    icon: Video,
    title: "Videochamadas em Tempo Real",
    description: "Converse com visitantes através de videochamadas HD seguras. Veja quem está na porta mesmo quando não está em casa.",
    features: ["Vídeo HD", "Áudio bidirecional", "Gravação automática", "Funciona em qualquer dispositivo"],
    gradient: "from-blue-500 to-cyan-500",
    mockup: (
      <div className="relative w-full h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden">
        <div className="absolute inset-4 bg-slate-700 rounded-lg flex items-center justify-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
            <Video className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
          <Badge className="bg-green-500/20 text-green-400">
            <Circle className="w-2 h-2 mr-1 fill-green-400" /> Ao vivo
          </Badge>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">📞</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    icon: Bell,
    title: "Notificações Instantâneas",
    description: "Receba alertas em tempo real no seu celular quando alguém tocar a campainha. Nunca perca uma visita importante.",
    features: ["Push notifications", "Alertas sonoros", "Histórico completo", "Configurável por propriedade"],
    gradient: "from-orange-500 to-amber-500",
    mockup: (
      <div className="relative w-full h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden p-4">
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur rounded-lg p-3 mb-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Nova campainha!</p>
              <p className="text-white/60 text-xs">Casa Principal • Agora</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur rounded-lg p-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Entrega detectada</p>
              <p className="text-white/60 text-xs">Apartamento • 5 min atrás</p>
            </div>
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    id: 3,
    icon: QrCode,
    title: "QR Code para Visitantes",
    description: "Gere QR Codes únicos para cada propriedade. Visitantes escaneiam e você recebe a chamada instantaneamente.",
    features: ["Códigos únicos", "Acesso sem app", "Fácil compartilhamento", "Seguro e rastreável"],
    gradient: "from-purple-500 to-pink-500",
    mockup: (
      <div className="relative w-full h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-32 h-32 bg-white rounded-xl p-2"
        >
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg grid grid-cols-5 gap-1 p-2">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-sm ${Math.random() > 0.4 ? "bg-white" : "bg-transparent"}`}
              />
            ))}
          </div>
        </motion.div>
        <div className="absolute bottom-4 left-4 right-4">
          <Badge className="bg-purple-500/20 text-purple-400">
            Escaneie para chamar
          </Badge>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    icon: Shield,
    title: "Controle de Acesso Seguro",
    description: "Códigos temporários para entregas, prestadores de serviço e visitantes. Controle total sobre quem acessa sua propriedade.",
    features: ["Códigos temporários", "Validade configurável", "Histórico de acessos", "Revogação instantânea"],
    gradient: "from-emerald-500 to-teal-500",
    mockup: (
      <div className="relative w-full h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden p-4">
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="text-white/60 text-xs mb-2">Código de Acesso</p>
          <div className="flex gap-2 justify-center">
            {["D", "O", "O", "R", "-", "A", "B", "C", "D"].map((char, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="w-8 h-10 bg-primary/20 rounded flex items-center justify-center"
              >
                <span className="text-primary font-mono font-bold">{char}</span>
              </motion.div>
            ))}
          </div>
          <p className="text-white/40 text-xs text-center mt-3">Válido até 31/12/2025</p>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    icon: Users,
    title: "Multi-usuários e Famílias",
    description: "Convide familiares para gerenciar suas propriedades. Cada membro recebe notificações e pode atender chamadas.",
    features: ["Convites por código", "Permissões flexíveis", "Até 10 membros", "Gestão centralizada"],
    gradient: "from-rose-500 to-red-500",
    mockup: (
      <div className="relative w-full h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden p-4">
        <div className="flex flex-wrap gap-2 justify-center items-center h-full">
          {[
            { name: "Você", role: "Admin", color: "bg-primary" },
            { name: "Maria", role: "Membro", color: "bg-pink-500" },
            { name: "João", role: "Membro", color: "bg-blue-500" },
            { name: "Ana", role: "Membro", color: "bg-green-500" },
          ].map((member, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center"
            >
              <div className={`w-12 h-12 ${member.color} rounded-full flex items-center justify-center text-white font-bold`}>
                {member.name[0]}
              </div>
              <p className="text-white text-xs mt-1">{member.name}</p>
              <Badge variant="outline" className="text-[10px] mt-0.5">{member.role}</Badge>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 6,
    icon: History,
    title: "Histórico Completo",
    description: "Registros detalhados de todas as atividades. Veja quem tocou a campainha, quando e se foi atendido.",
    features: ["Timeline de eventos", "Filtros avançados", "Exportação de dados", "Mídia salva"],
    gradient: "from-indigo-500 to-violet-500",
    mockup: (
      <div className="relative w-full h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden p-4 overflow-y-auto">
        {[
          { time: "10:30", event: "Chamada atendida", icon: "✅" },
          { time: "09:15", event: "Entrega recebida", icon: "📦" },
          { time: "08:45", event: "Chamada perdida", icon: "❌" },
          { time: "Ontem", event: "Visitante identificado", icon: "👤" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-3 mb-2 bg-white/5 rounded-lg p-2"
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
    id: 7,
    icon: Bike,
    title: "MotoVii - Adesivo para Motos",
    description: "Adesivo NFC especial para motociclistas. Programe e cole no baú ou carenagem para receber entregas com segurança.",
    features: ["Adesivo NFC resistente", "Design exclusivo para motos", "Múltiplos tamanhos", "Ideal para motoboys e entregadores"],
    gradient: "from-teal-500 to-cyan-500",
    mockup: (
      <div className="relative w-full h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
            <Bike className="w-16 h-16 text-white" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 border-4 border-teal-400 rounded-full"
          />
        </motion.div>
        <div className="absolute bottom-4 left-4 right-4">
          <Badge className="bg-teal-500/20 text-teal-400">
            🏍️ Adesivo NFC para Moto
          </Badge>
        </div>
      </div>
    ),
  },
  {
    id: 8,
    icon: Car,
    title: "CarVii - Adesivo para Carros",
    description: "Videochamadas seguras para seu carro. Ideal para estacionamento, acidentes ou assistência na estrada. Proteja seu veículo com privacidade total.",
    features: ["Contato em estacionamento", "Notificação de acidentes", "Privacidade do número", "Assistência na estrada"],
    gradient: "from-indigo-500 to-purple-500",
    mockup: (
      <div className="relative w-full h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
            <Car className="w-16 h-16 text-white" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 border-4 border-indigo-400 rounded-full"
          />
        </motion.div>
        <div className="absolute bottom-4 left-4 right-4">
          <Badge className="bg-indigo-500/20 text-indigo-400">
            🚗 Adesivo NFC para Carro
          </Badge>
        </div>
      </div>
    ),
  },
  {
    id: 9,
    icon: Luggage,
    title: "MalaVii - Adesivo para Bagagens",
    description: "Proteja sua mala de viagem com MalaVii. Em caso de extravio, qualquer pessoa pode ligar para você aproximando o celular.",
    features: ["Recupere malas perdidas", "Funciona em aeroportos", "Privacidade total", "Contato instantâneo"],
    gradient: "from-amber-500 to-orange-500",
    mockup: (
      <div className="relative w-full h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Luggage className="w-16 h-16 text-white" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 border-4 border-amber-400 rounded-full"
          />
        </motion.div>
        <div className="absolute bottom-4 left-4 right-4">
          <Badge className="bg-amber-500/20 text-amber-400">
            🧳 Adesivo NFC para Mala
          </Badge>
        </div>
      </div>
    ),
  },
];

export const SystemShowcase = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [progress, setProgress] = useState(0);
  const AUTOPLAY_INTERVAL = 5000; // 5 seconds

  const currentItem = showcaseItems[currentIndex];

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % showcaseItems.length);
    setProgress(0);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + showcaseItems.length) % showcaseItems.length);
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

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying || isHovering) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + (100 / (AUTOPLAY_INTERVAL / 100));
      });
    }, 100);

    const slideInterval = setInterval(() => {
      nextSlide();
    }, AUTOPLAY_INTERVAL);

    return () => {
      clearInterval(progressInterval);
      clearInterval(slideInterval);
    };
  }, [isPlaying, isHovering, nextSlide]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
    <section className="container mx-auto px-4 py-20">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Badge className="mb-4" variant="outline">
          <Play className="w-3 h-3 mr-1" /> Tour do Sistema
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Conheça cada funcionalidade
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Veja em detalhes como o DoorVII pode transformar a segurança da sua casa
        </p>
      </motion.div>

      <div 
        className="max-w-5xl mx-auto"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Card className="overflow-hidden border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Mockup Side */}
              <div className={`p-8 bg-gradient-to-br ${currentItem.gradient} relative overflow-hidden`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentItem.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10"
                  >
                    {currentItem.mockup}
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 bg-black/10" />
              </div>

              {/* Content Side */}
              <div className="p-8 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentItem.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${currentItem.gradient} text-white text-sm mb-4`}>
                      <currentItem.icon className="w-4 h-4" />
                      {currentIndex + 1} de {showcaseItems.length}
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">
                      {currentItem.title}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {currentItem.description}
                    </p>
                    <ul className="space-y-2">
                      {currentItem.features.map((feature, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${currentItem.gradient}`} />
                          {feature}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevSlide}>
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

          <div className="flex gap-2 items-center">
            {showcaseItems.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className="relative h-2 rounded-full overflow-hidden transition-all"
                style={{ width: i === currentIndex ? '2rem' : '0.5rem' }}
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
              </button>
            ))}
          </div>

          <Button variant="outline" size="icon" onClick={nextSlide}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
