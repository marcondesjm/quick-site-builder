import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft,
  Bell,
  Check,
  Zap,
  Crown,
  Sparkles,
  Home as HomeIcon
} from "lucide-react";
import PlanCheckoutDialog from "@/components/PlanCheckoutDialog";

const Plans = () => {
  const navigate = useNavigate();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: "", price: 0 });

  const handleSelectPlan = (planName: string, planPrice: number) => {
    setSelectedPlan({ name: planName, price: planPrice });
    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <motion.header 
        className="container mx-auto px-4 py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <HomeIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">DoorVii Home</span>
          </motion.div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </nav>
      </motion.header>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Bell className="w-4 h-4" />
            Planos de Assinatura
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Escolha o plano ideal para você
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Comece gratuitamente e faça upgrade quando precisar de mais recursos
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Plano Essencial */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full border-2 hover:border-green-500/50 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-7 h-7 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Essencial</h3>
                    <p className="text-sm text-muted-foreground">Para residências individuais</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-foreground">R$ 9,90</span>
                    <span className="text-muted-foreground">/ mês</span>
                  </div>
                </div>

                <ul className="space-y-3 flex-grow mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Campainha virtual ativa</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">QR Code permanente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Aviso instantâneo ao morador</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Acesso via celular (sem app obrigatório)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Suporte básico</span>
                  </li>
                </ul>

                <div className="text-center text-xs text-muted-foreground mb-4 py-2 bg-green-500/5 rounded-lg">
                  🎯 Ideal para casas e apartamentos
                </div>

                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full border-green-500/50 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all"
                  onClick={() => handleSelectPlan("Essencial", 9.90)}
                >
                  Começar Agora
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Plano Plus - Destaque */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full border-2 border-primary shadow-2xl hover:shadow-primary/20 transition-all duration-300 relative overflow-hidden scale-[1.03] group">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-blue-500 to-primary" />
              <div className="absolute -top-0 right-4 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-b-xl shadow-lg">
                POPULAR
              </div>
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Plus</h3>
                    <p className="text-sm text-muted-foreground">Mais controle e personalização</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-foreground">R$ 19,90</span>
                    <span className="text-muted-foreground">/ mês</span>
                  </div>
                </div>

                <div className="text-xs text-primary font-semibold mb-3 uppercase tracking-wide">Tudo do Essencial +</div>

                <ul className="space-y-3 flex-grow mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Nome da residência personalizado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Mensagem personalizada na tela</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Histórico de toques (últimos acessos)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Suporte prioritário</span>
                  </li>
                </ul>

                <div className="text-center text-xs text-muted-foreground mb-4 py-2 bg-primary/5 rounded-lg">
                  🎯 Ideal para famílias, home office
                </div>

                <Button 
                  size="lg"
                  className="w-full shadow-lg hover:shadow-xl transition-all"
                  onClick={() => handleSelectPlan("Plus", 19.90)}
                >
                  Escolher Plus
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Plano Pro */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="h-full border-2 hover:border-purple-500/50 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Crown className="w-7 h-7 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Pro</h3>
                    <p className="text-sm text-muted-foreground">Para condomínios e uso profissional</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-foreground">R$ 39,90</span>
                    <span className="text-muted-foreground">/ mês</span>
                  </div>
                </div>

                <div className="text-xs text-purple-500 font-semibold mb-3 uppercase tracking-wide">Tudo do Plus +</div>

                <ul className="space-y-3 flex-grow mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Múltiplos moradores/notificações</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Página personalizada com identidade visual</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Suporte VIP</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Prioridade em novas funções</span>
                  </li>
                </ul>

                <div className="text-center text-xs text-muted-foreground mb-4 py-2 bg-purple-500/5 rounded-lg">
                  🎯 Ideal para condomínios, empresas, escritórios
                </div>

                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full border-purple-500/50 hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all"
                  onClick={() => handleSelectPlan("Pro", 39.90)}
                >
                  Escolher Pro
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Opcionais/Upsell */}
        <motion.div
          className="mt-12 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4 text-center">
                🧩 Opcionais Disponíveis
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
                  <p className="text-sm text-muted-foreground">➕ Domínio personalizado</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
                  <p className="text-sm text-muted-foreground">➕ Integração WhatsApp Business</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
                  <p className="text-sm text-muted-foreground">➕ Mensagem automática para entregadores</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
                  <p className="text-sm text-muted-foreground">➕ Relatórios mensais de acessos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ ou Garantia */}
        <motion.div
          className="mt-12 text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <p className="text-muted-foreground text-sm">
            ✅ Cancele quando quiser • ✅ Sem fidelidade • ✅ Suporte em português
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer 
        className="container mx-auto px-4 py-8 border-t mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">DoorVii Home</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 DoorVii Home. Todos os direitos reservados.
          </p>
        </div>
      </motion.footer>

      {/* Plan Checkout Dialog */}
      <PlanCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        planName={selectedPlan.name}
        planPrice={selectedPlan.price}
      />
    </div>
  );
};

export default Plans;
