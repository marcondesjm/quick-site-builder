import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Download, 
  Smartphone, 
  CheckCircle2, 
  Share, 
  Plus, 
  MoreVertical, 
  Rocket,
  WifiOff,
  Bell,
  HardDrive,
  Zap,
  Shield,
  Trash2,
  Info,
  Lightbulb,
  XCircle,
  Mail,
  ArrowRight,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [serviceWorkerActive, setServiceWorkerActive] = useState(false);
  const [cacheApiAvailable, setCacheApiAvailable] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check Service Worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        setServiceWorkerActive(!!registration?.active);
      });
    }

    // Check Cache API availability
    setCacheApiAvailable('caches' in window);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Unregister and re-register service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        // Re-register after a brief delay
        setTimeout(() => {
          navigator.serviceWorker.register('/sw.js');
        }, 500);
      }

      toast.success("Cache limpo com sucesso! O app foi atualizado.");
      // Reload after a brief delay
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error("Erro ao limpar o cache. Tente novamente.");
    } finally {
      setIsClearing(false);
    }
  };

  const appFeatures = [
    { icon: Rocket, text: "Acesso rápido pela tela inicial", color: "text-orange-500" },
    { icon: WifiOff, text: "Funciona completamente offline", color: "text-blue-500" },
    { icon: Bell, text: "Notificações push ativadas", color: "text-yellow-500" },
    { icon: HardDrive, text: "Dados salvos localmente", color: "text-purple-500" },
    { icon: Zap, text: "Performance otimizada", color: "text-green-500" },
    { icon: Shield, text: "Seguro e privado", color: "text-amber-500" },
  ];

  const getDisplayMode = () => {
    if (window.matchMedia("(display-mode: standalone)").matches) return "Standalone (PWA)";
    if (window.matchMedia("(display-mode: fullscreen)").matches) return "Fullscreen";
    if (window.matchMedia("(display-mode: minimal-ui)").matches) return "Minimal UI";
    return "Navegador";
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold mb-1">Instalação do App</h1>
          <p className="text-muted-foreground">
            Instale o DoorVII como um aplicativo nativo no seu dispositivo.
          </p>
        </motion.div>

        {/* Installation Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl border p-4 ${
            isInstalled 
              ? 'bg-success/10 border-success/30' 
              : 'bg-card border-border'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isInstalled ? 'bg-success/20' : 'bg-muted'
            }`}>
              {isInstalled ? (
                <CheckCircle2 className="w-6 h-6 text-success" />
              ) : (
                <Smartphone className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h2 className={`font-semibold text-lg ${isInstalled ? 'text-success' : 'text-yellow-500'}`}>
                {isInstalled ? 'App Instalado ✓' : 'App Não Instalado'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isInstalled 
                  ? 'O DoorVii Home está instalado e funcionando como app nativo.'
                  : 'Instale para ter acesso rápido, funcionar offline e receber notificações.'
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Not Installed - Show Instructions */}
        {!isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card/50 p-4"
          >
            <div className="flex items-start gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <span className="font-medium">Como instalar no computador:</span>
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground ml-7">
              <li>
                1. Procure o <span className="font-medium text-foreground">ícone de instalação</span> na barra de endereço (⊕ ou ↓)
              </li>
              <li>
                2. Ou no menu (⋮) → "Instalar DoorVii Home"
              </li>
              <li>
                3. Clique em "<span className="font-medium text-foreground">Instalar</span>" e pronto!
              </li>
            </ol>

            {deferredPrompt && (
              <Button onClick={handleInstall} className="w-full mt-4 gap-2" size="lg">
                <Download className="w-5 h-5" />
                Instalar Agora
              </Button>
            )}

            {isIOS && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="font-medium mb-2 text-sm">No iPhone/iPad:</p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    1. Toque em <Share className="w-4 h-4 text-primary" /> Compartilhar
                  </li>
                  <li className="flex items-center gap-2">
                    2. Role e toque em <Plus className="w-4 h-4" /> "Adicionar à Tela de Início"
                  </li>
                  <li>3. Toque em "Adicionar"</li>
                </ol>
              </div>
            )}
          </motion.div>
        )}

        {/* Installed - Success State */}
        {isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-success/30 bg-card p-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-success mb-2">
              Seu celular já tem nosso app instalado!
            </h3>
            <p className="text-muted-foreground mb-6">
              O DoorVii Home está instalado e funcionando perfeitamente.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <p className="font-medium mb-1">Dúvidas ou sugestões?</p>
              <p className="text-sm text-muted-foreground mb-2">Entre em contato com nosso suporte:</p>
              <a 
                href="mailto:suporte.doorvii@gmail.com" 
                className="text-primary hover:underline flex items-center justify-center gap-1"
              >
                <Mail className="w-4 h-4" />
                suporte.doorvii@gmail.com
              </a>
            </div>

            <Button 
              variant="outline" 
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => {
                toast.info("Para desinstalar, mantenha pressionado o ícone do app e selecione 'Desinstalar'");
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Desinstalar App
            </Button>
          </motion.div>
        )}

        {/* App Features */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Recursos do App</h3>
          </div>
          <div className="space-y-3">
            {appFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                className="flex items-center gap-3"
              >
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
                <span className="text-sm">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Maintenance Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <h3 className="font-semibold mb-4">Manutenção</h3>
          
          <button 
            onClick={handleClearCache}
            disabled={isClearing}
            className="w-full flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Limpar Cache</p>
                <p className="text-sm text-muted-foreground">
                  {isClearing ? 'Limpando...' : 'Atualiza o app para a versão mais recente'}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>

          {/* App Status Message */}
          <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
            <p className="text-sm">
              <span className="font-medium text-success">App funcionando perfeitamente!</span>
              {' '}
              <span className="text-muted-foreground">Use "Limpar Cache" se encontrar algum problema.</span>
            </p>
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-border bg-card p-4 text-sm"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Service Worker:</span>
              <span className={serviceWorkerActive ? 'text-success' : 'text-destructive'}>
                {serviceWorkerActive ? '✓ Ativo' : '✕ Inativo'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cache API:</span>
              <span className={cacheApiAvailable ? 'text-success' : 'text-destructive'}>
                {cacheApiAvailable ? '✓ Disponível' : '✕ Indisponível'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Modo:</span>
              <span>{getDisplayMode()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Instalável:</span>
              <span className={deferredPrompt || isInstalled ? 'text-success' : 'text-destructive'}>
                {isInstalled ? '✓ Instalado' : deferredPrompt ? '✓ Sim' : '✕ Não'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="w-full"
          >
            Voltar
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Install;
