import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, Share, MoreVertical, Check, Monitor, Copy, Link2, X, QrCode, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      toast.success('Link copiado!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.origin;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Link copiado!');
    }
  };

  const shareUrl = window.location.origin;
  const shareText = 'Confira o DoorVii Home - Sua campainha inteligente';

  const socialShareOptions = [
    {
      name: 'WhatsApp',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      color: 'bg-[#25D366] hover:bg-[#20BD5A] text-white',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    },
    {
      name: 'Telegram',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      color: 'bg-[#0088cc] hover:bg-[#0077b5] text-white',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'X (Twitter)',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: 'bg-black hover:bg-gray-800 text-white',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Facebook',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: 'bg-[#1877F2] hover:bg-[#166FE5] text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'LinkedIn',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      color: 'bg-[#0A66C2] hover:bg-[#004182] text-white',
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700 text-white',
      url: `mailto:?subject=${encodeURIComponent('DoorVii Home')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`,
    },
  ];

  const handleSocialShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
    setSharePopoverOpen(false);
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
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden max-h-[90vh]">
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

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
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
                  <Popover open={sharePopoverOpen} onOpenChange={setSharePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button className="w-full gap-2 h-11">
                        <Share className="w-4 h-4" />
                        Compartilhar Link
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-3" align="center">
                      <p className="text-sm font-medium mb-3 text-center">Compartilhar via</p>
                      <div className="grid grid-cols-3 gap-2">
                        {socialShareOptions.map((option) => (
                          <button
                            key={option.name}
                            onClick={() => handleSocialShare(option.url)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${option.color}`}
                          >
                            <option.icon />
                            <span className="text-xs font-medium">{option.name}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
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
