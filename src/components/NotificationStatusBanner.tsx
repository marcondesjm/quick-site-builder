import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';

export function NotificationStatusBanner() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, loading, subscribe, permission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if not logged in, not supported, or already subscribed
  if (!user || !isSupported || isSubscribed || dismissed) {
    return null;
  }

  // If permission was denied, show a different message
  if (permission === 'denied') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/30"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <BellOff className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Notificações Bloqueadas
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Você bloqueou as notificações. Para receber alertas de visitantes, 
              acesse as <strong>configurações do navegador</strong> e permita notificações para este site.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => setDismissed(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  const handleEnable = async () => {
    await subscribe();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 dark:bg-amber-500/5"
    >
      <div className="flex items-start gap-3">
        <motion.div
          animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
          transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
          className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0"
        >
          <Bell className="w-5 h-5 text-amber-600 dark:text-amber-500" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-700 dark:text-amber-500 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Notificações Desativadas
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Você <strong>não receberá alertas</strong> quando visitantes tocarem a campainha ou quando o assistente notificar sobre chegadas.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={loading}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ativando...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Ativar Notificações
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="text-muted-foreground"
            >
              Depois
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => setDismissed(true)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
