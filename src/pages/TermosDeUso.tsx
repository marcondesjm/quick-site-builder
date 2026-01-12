import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import doorviiLogo from '@/assets/doorvii-logo-new.png';

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          <img src={doorviiLogo} alt="DoorVii" className="h-10 object-contain" />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 space-y-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Termos de Uso</h1>
          </div>

          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e usar o DoorVii, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
              Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              O DoorVii é uma plataforma de portaria digital inteligente que permite:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Gerenciamento de propriedades e visitantes</li>
              <li>Comunicação por videochamada entre visitantes e moradores</li>
              <li>Notificações em tempo real sobre visitas</li>
              <li>Registro e histórico de atividades</li>
              <li>Controle de acesso remoto</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Cadastro e Conta</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para utilizar nossos serviços, você deve criar uma conta fornecendo informações precisas e completas. 
              Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Uso Aceitável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você concorda em não usar o DoorVii para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Violar leis ou regulamentos aplicáveis</li>
              <li>Enviar conteúdo ilegal, ofensivo ou prejudicial</li>
              <li>Tentar acessar sistemas ou dados não autorizados</li>
              <li>Interferir no funcionamento normal do serviço</li>
              <li>Compartilhar acesso à sua conta com terceiros</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Privacidade e Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              O uso de seus dados pessoais é regido por nossa{' '}
              <Link to="/privacidade" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
              . Ao usar o DoorVii, você consente com a coleta e uso de dados conforme descrito.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Propriedade Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo, marcas, logos e software do DoorVii são de propriedade exclusiva da empresa 
              e estão protegidos por leis de propriedade intelectual. É proibida a reprodução sem autorização prévia.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O DoorVii é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de erros. 
              Não nos responsabilizamos por danos indiretos, incidentais ou consequenciais decorrentes do uso do serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Modificações dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. 
              Alterações significativas serão comunicadas por e-mail ou notificação no aplicativo. 
              O uso continuado após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Rescisão</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos suspender ou encerrar sua conta a qualquer momento, sem aviso prévio, 
              se você violar estes termos ou por qualquer outro motivo a nosso critério.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">10. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas sobre estes Termos de Uso, entre em contato conosco através do suporte no aplicativo 
              ou pelo WhatsApp disponível na plataforma.
            </p>
          </section>

          <div className="pt-6 border-t">
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} DoorVii - Portaria Digital Inteligente. Todos os direitos reservados.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
