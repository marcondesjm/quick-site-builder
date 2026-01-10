import { motion } from 'framer-motion';
import { Sparkles, Timer, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface TrialStatusBadgeProps {
  daysRemaining: number;
  isAdmin?: boolean;
}

export function TrialStatusBadge({ daysRemaining, isAdmin }: TrialStatusBadgeProps) {
  const navigate = useNavigate();

  const handleNavigateToPlans = () => {
    navigate('/planos');
  };

  // Admins don't see trial badge
  if (isAdmin) {
    return null;
  }

  // Determine styling based on days remaining
  const getStyles = () => {
    if (daysRemaining <= 1) {
      return {
        bg: 'bg-gradient-to-r from-red-600 via-red-500 to-orange-500',
        border: 'border-red-400',
        text: 'text-white',
        icon: 'text-white',
        badge: 'bg-white/20',
        glow: 'shadow-[0_0_30px_rgba(239,68,68,0.5)]',
      };
    }
    if (daysRemaining <= 3) {
      return {
        bg: 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500',
        border: 'border-orange-400',
        text: 'text-white',
        icon: 'text-white',
        badge: 'bg-white/20',
        glow: 'shadow-[0_0_25px_rgba(249,115,22,0.4)]',
      };
    }
    return {
      bg: 'bg-gradient-to-r from-primary via-blue-500 to-cyan-500',
      border: 'border-primary/50',
      text: 'text-white',
      icon: 'text-white',
      badge: 'bg-white/20',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]',
    };
  };

  const styles = getStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`rounded-2xl border-2 ${styles.border} ${styles.bg} ${styles.glow} p-5 mb-6 relative overflow-hidden`}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      </div>
      
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Animated icon container */}
          <motion.div 
            className={`w-16 h-16 rounded-2xl ${styles.badge} backdrop-blur-sm flex items-center justify-center border border-white/30`}
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Timer className="w-8 h-8 text-white" />
          </motion.div>
          
          <div>
            <p className={`text-sm font-medium ${styles.text} opacity-90 uppercase tracking-wide`}>
              Período de Teste
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <motion.span 
                className={`text-4xl font-black ${styles.icon} drop-shadow-lg`}
                key={daysRemaining}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {daysRemaining}
              </motion.span>
              <span className={`text-lg font-semibold ${styles.text}`}>
                {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
              </span>
            </div>
          </div>
        </div>
        
        <Button
          size="lg"
          onClick={handleNavigateToPlans}
          className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-xl hover:scale-105 transition-transform"
        >
          <Crown className="w-5 h-5" />
          <span className="hidden sm:inline">Assinar Agora</span>
          <span className="sm:hidden">Assinar</span>
        </Button>
      </div>
      
      {daysRemaining <= 3 && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative mt-4 pt-4 border-t border-white/20"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            >
              <Sparkles className={`w-5 h-5 ${styles.icon}`} />
            </motion.div>
            <span className={`font-medium ${styles.text}`}>
              {daysRemaining <= 1 
                ? '⚠️ Último dia! Garanta seu acesso agora!' 
                : '✨ Fale conosco para continuar usando todas as funcionalidades'}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
