import { motion } from 'framer-motion';
import { Clock, Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrialStatusBadgeProps {
  daysRemaining: number;
  isAdmin?: boolean;
}

export function TrialStatusBadge({ daysRemaining, isAdmin }: TrialStatusBadgeProps) {
  const handleContactWhatsApp = () => {
    const message = encodeURIComponent(`Olá! Estou usando o Doorvii em período de teste e gostaria de saber mais sobre os planos disponíveis.`);
    window.open(`https://wa.me/5548996029392?text=${message}`, '_blank');
  };

  // Admins don't see trial badge
  if (isAdmin) {
    return null;
  }

  // Determine styling based on days remaining
  const getStyles = () => {
    if (daysRemaining <= 1) {
      return {
        bg: 'bg-gradient-to-r from-red-500/15 to-red-600/10',
        border: 'border-red-500/30',
        text: 'text-red-700 dark:text-red-400',
        icon: 'text-red-500',
        badge: 'bg-red-500',
      };
    }
    if (daysRemaining <= 3) {
      return {
        bg: 'bg-gradient-to-r from-orange-500/15 to-amber-500/10',
        border: 'border-orange-500/30',
        text: 'text-orange-700 dark:text-orange-400',
        icon: 'text-orange-500',
        badge: 'bg-orange-500',
      };
    }
    return {
      bg: 'bg-gradient-to-r from-blue-500/10 to-primary/10',
      border: 'border-primary/20',
      text: 'text-foreground',
      icon: 'text-primary',
      badge: 'bg-primary',
    };
  };

  const styles = getStyles();

  const getMessage = () => {
    if (daysRemaining === 0) return 'Seu teste expira hoje!';
    if (daysRemaining === 1) return 'Último dia do teste!';
    return `${daysRemaining} dias restantes`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${styles.border} ${styles.bg} p-4 mb-4`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${styles.badge} flex items-center justify-center`}>
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className={`font-semibold ${styles.text}`}>
              Período de Teste
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${styles.icon}`}>
                {daysRemaining}
              </span>
              <span className={`text-sm ${styles.text} opacity-80`}>
                {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
              </span>
            </div>
          </div>
        </div>
        
        <Button
          size="sm"
          onClick={handleContactWhatsApp}
          className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Assinar</span>
        </Button>
      </div>
      
      {daysRemaining <= 3 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`mt-3 pt-3 border-t ${styles.border}`}
        >
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className={`w-4 h-4 ${styles.icon}`} />
            <span className={styles.text}>
              {daysRemaining <= 1 
                ? 'Garanta seu acesso agora!' 
                : 'Fale conosco para continuar usando'}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
