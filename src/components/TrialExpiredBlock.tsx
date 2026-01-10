import { motion } from 'framer-motion';
import { Clock, AlertTriangle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import doorviiLogo from '@/assets/doorvii-logo-full.png';

interface TrialExpiredBlockProps {
  onContact?: () => void;
}

export function TrialExpiredBlock({ onContact }: TrialExpiredBlockProps) {
  const { signOut } = useAuth();

  const handleContactWhatsApp = () => {
    const message = encodeURIComponent('Olá! Meu período de teste do Doorvii expirou e gostaria de saber mais sobre os planos disponíveis.');
    window.open(`https://wa.me/5548996029392?text=${message}`, '_blank');
    onContact?.();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="border-destructive/20 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <img src={doorviiLogo} alt="Doorvii" className="h-12" />
            </div>
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">
              Período de Teste Expirado
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Seu período de teste de 7 dias chegou ao fim.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>O que acontece agora?</span>
              </div>
              <p className="text-sm">
                Para continuar usando o Doorvii e todas as suas funcionalidades, 
                entre em contato conosco para conhecer nossos planos.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleContactWhatsApp}
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <MessageCircle className="w-5 h-5" />
                Falar no WhatsApp
              </Button>
              
              <Button 
                variant="outline" 
                onClick={signOut}
                className="w-full"
              >
                Sair da conta
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Tem dúvidas? Nossa equipe está pronta para ajudar você a escolher o melhor plano.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
