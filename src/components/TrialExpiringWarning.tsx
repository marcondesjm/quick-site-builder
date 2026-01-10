import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface TrialExpiringWarningProps {
  daysRemaining: number;
  onDismiss?: () => void;
}

export function TrialExpiringWarning({ daysRemaining, onDismiss }: TrialExpiringWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);

  // Check localStorage to see if we've already shown this warning today
  useEffect(() => {
    const lastShownDate = localStorage.getItem('trial-warning-last-shown');
    const today = new Date().toDateString();
    
    if (lastShownDate === today) {
      setIsDismissed(true);
    }
  }, []);

  // Show push notification once per session when trial is about to expire
  useEffect(() => {
    if (hasShownNotification || daysRemaining > 3) return;
    
    const notificationKey = `trial-notification-${daysRemaining}`;
    const hasShown = sessionStorage.getItem(notificationKey);
    
    if (!hasShown && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ Seu período de teste está acabando!', {
        body: daysRemaining === 1 
          ? 'Último dia! Fale conosco para continuar usando o Doorvii.'
          : `Restam apenas ${daysRemaining} dias. Fale conosco para continuar usando o Doorvii.`,
        icon: '/pwa-192x192.png',
        tag: 'trial-expiring',
      });
      sessionStorage.setItem(notificationKey, 'true');
      setHasShownNotification(true);
    }
  }, [daysRemaining, hasShownNotification]);

  const handleDismiss = () => {
    const today = new Date().toDateString();
    localStorage.setItem('trial-warning-last-shown', today);
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleContactWhatsApp = () => {
    const message = encodeURIComponent(`Olá! Meu período de teste do Doorvii expira em ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} e gostaria de saber mais sobre os planos disponíveis.`);
    window.open(`https://wa.me/5548996029392?text=${message}`, '_blank');
  };

  // Only show for 3 days or less
  if (daysRemaining > 3 || isDismissed) {
    return null;
  }

  const urgencyColor = daysRemaining <= 1 
    ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400' 
    : daysRemaining <= 2 
      ? 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400'
      : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400';

  const iconColor = daysRemaining <= 1 
    ? 'text-red-500' 
    : daysRemaining <= 2 
      ? 'text-orange-500'
      : 'text-yellow-500';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`mb-4 p-3 rounded-lg border ${urgencyColor} flex items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Clock className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">
              {daysRemaining === 1 
                ? '⚠️ Último dia do período de teste!' 
                : daysRemaining === 0
                  ? '⚠️ Seu teste expira hoje!'
                  : `⏰ Seu período de teste expira em ${daysRemaining} dias`
              }
            </p>
            <p className="text-xs opacity-80 hidden sm:block">
              Fale conosco para continuar usando todas as funcionalidades
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleContactWhatsApp}
            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 text-xs px-2 h-8"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            className="h-8 w-8 opacity-60 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
