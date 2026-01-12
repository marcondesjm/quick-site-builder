import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, Share, MoreVertical, Check, Monitor, Copy, Link2, X, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallAppHeaderButton() {
  const [open, setOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setOpen(false);
        toast.success('App instalado com sucesso!');
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    toast.success('Link copiado!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DoorVii Home',
          text: 'Confira o DoorVii Home - Sua campainha inteligente',
          url: window.location.origin,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      handleCopyLink();
    }
  };

  // Don't show if already installed
  if (isStandalone) return null;

  const appUrl = window.location.origin;
  const isDesktop = !isMobile;

  const benefits = [
    'Acesso mais rápido',
    'Funciona offline',
    'Notificações em tempo real',
    'Interface otimizada',
    'Sincronização automática'
  ];

  return (
    <>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Instalar App</span>
        </Button>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <QrCode className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">Instalar DoorVii Home</DialogTitle>
                <p className="text-xs text-muted-foreground">App gratuito para seu dispositivo</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Main Content - Different for mobile vs desktop */}
            {isDesktop ? (
              <div className="space-y-6">
                {/* QR Code Section */}
                <motion.div 
                  className="flex flex-col items-center text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="p-4 bg-white rounded-2xl shadow-lg mb-4">
                    <QRCodeSVG 
                      value={appUrl} 
                      size={160}
                      level="H"
                      includeMargin={false}
                      fgColor="#16a34a"
                      imageSettings={{
                        src: "/doorvii-camera.png",
                        x: undefined,
                        y: undefined,
                        height: 32,
                        width: 32,
                        excavate: true,
                      }}
                    />
                  </div>
                  <p className="text-lg font-semibold text-foreground mb-1">Vem usar o DoorVii!</p>
                  <p className="text-sm text-muted-foreground">
                    Aponte a câmera do seu celular para o QR Code
                  </p>
                </motion.div>

                {/* Desktop detected notice */}
                <motion.div 
                  className="bg-muted/50 rounded-xl p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Monitor className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Dispositivo Desktop Detectado</p>
                      <p className="text-xs text-muted-foreground">Instruções para instalação no computador</p>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {showInstructions && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 border-t border-border/50 mt-3 space-y-2">
                          <p className="text-sm font-medium mb-2">Como instalar no Chrome/Edge:</p>
                          <ol className="text-sm text-muted-foreground space-y-1.5">
                            <li className="flex items-start gap-2">
                              <span className="bg-primary/20 text-primary rounded-full min-w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                              <span>Clique no ícone de instalação na barra de endereço</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="bg-primary/20 text-primary rounded-full min-w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                              <span>Ou use o menu (⋮) → "Instalar DoorVii Home..."</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="bg-primary/20 text-primary rounded-full min-w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                              <span>Confirme clicando em "Instalar"</span>
                            </li>
                          </ol>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!showInstructions && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-muted-foreground p-0 h-auto mt-2"
                      onClick={() => setShowInstructions(true)}
                    >
                      Ver Instruções Detalhadas
                    </Button>
                  )}
                </motion.div>

                {/* Share and Copy Buttons */}
                <motion.div 
                  className="flex flex-col gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button 
                    className="w-full gap-2 h-11"
                    onClick={handleShare}
                  >
                    <Share className="w-4 h-4" />
                    Compartilhar Link
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 h-11"
                    onClick={handleCopyLink}
                  >
                    <Copy className="w-4 h-4" />
                    Copiar Link
                  </Button>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mobile Install Button */}
                {deferredPrompt ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Button onClick={handleInstall} className="w-full gap-2 h-12">
                      <Download className="w-5 h-5" />
                      Instalar Agora
                    </Button>
                  </motion.div>
                ) : isIOS ? (
                  <motion.div 
                    className="p-4 rounded-xl bg-muted/50 border border-border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-sm font-medium mb-3">Como instalar no iPhone:</p>
                    <ol className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                        <span>Toque no botão <Share className="w-4 h-4 inline mx-1" /> Compartilhar</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                        <span>Role e toque em "Adicionar à Tela de Início"</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                        <span>Toque em "Adicionar"</span>
                      </li>
                    </ol>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="p-4 rounded-xl bg-muted/50 border border-border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-sm font-medium mb-3">Como instalar no Android:</p>
                    <ol className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                        <span>Toque nos <MoreVertical className="w-4 h-4 inline mx-1" /> 3 pontos do navegador</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                        <span>Toque em "Instalar app" ou "Adicionar à tela inicial"</span>
                      </li>
                    </ol>
                  </motion.div>
                )}
              </div>
            )}

            {/* Benefits Section */}
            <motion.div 
              className="mt-6 pt-6 border-t"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm font-medium mb-3">Por que instalar o app?</p>
              <div className="grid grid-cols-1 gap-2">
                {benefits.map((benefit, index) => (
                  <motion.div 
                    key={benefit}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
