import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import doorviiLogo from '@/assets/doorvii-logo-new.png';

export default function PoliticaPrivacidade() {
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
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Política de Privacidade</h1>
          </div>

          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Introdução</h2>
            <p className="text-muted-foreground leading-relaxed">
              A DoorVii está comprometida em proteger sua privacidade. Esta Política de Privacidade explica 
              como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você usa 
              nossa plataforma de portaria digital inteligente.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Informações que Coletamos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Coletamos os seguintes tipos de informações:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Dados de cadastro:</strong> Nome completo, e-mail, telefone/WhatsApp</li>
              <li><strong>Dados de propriedades:</strong> Endereços e informações das propriedades cadastradas</li>
              <li><strong>Dados de uso:</strong> Logs de acesso, histórico de chamadas e atividades</li>
              <li><strong>Dados de comunicação:</strong> Mensagens de áudio e vídeo durante chamadas</li>
              <li><strong>Dados técnicos:</strong> Tipo de dispositivo, sistema operacional, endereço IP</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Como Usamos suas Informações</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Fornecer e manter nossos serviços de portaria digital</li>
              <li>Enviar notificações sobre visitas e atividades</li>
              <li>Melhorar e personalizar sua experiência</li>
              <li>Comunicar atualizações, promoções e informações relevantes</li>
              <li>Garantir a segurança e prevenir fraudes</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Não vendemos suas informações pessoais. Podemos compartilhar dados com:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Membros da propriedade:</strong> Outros usuários autorizados na mesma propriedade</li>
              <li><strong>Prestadores de serviço:</strong> Parceiros que nos ajudam a operar a plataforma</li>
              <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Armazenamento e Segurança</h2>
            <p className="text-muted-foreground leading-relaxed">
              Suas informações são armazenadas em servidores seguros com criptografia. 
              Implementamos medidas técnicas e organizacionais para proteger seus dados contra 
              acesso não autorizado, alteração, divulgação ou destruição.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos suas informações enquanto sua conta estiver ativa ou conforme necessário para 
              fornecer serviços. Dados de chamadas e atividades são retidos por um período limitado 
              para fins de histórico e segurança.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Seus Direitos (LGPD)</h2>
            <p className="text-muted-foreground leading-relaxed">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Confirmar a existência de tratamento de dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar anonimização ou exclusão de dados</li>
              <li>Revogar consentimento a qualquer momento</li>
              <li>Solicitar portabilidade dos dados</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Cookies e Tecnologias</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência. 
              Para mais informações, consulte nossa{' '}
              <Link to="/politica-cookies" className="text-primary hover:underline">
                Política de Cookies
              </Link>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Menores de Idade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O DoorVii não é destinado a menores de 18 anos. Não coletamos intencionalmente 
              informações de menores. Se tomarmos conhecimento de tal coleta, excluiremos os dados imediatamente.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">10. Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta política periodicamente. Notificaremos sobre alterações significativas 
              por e-mail ou notificação no aplicativo. Recomendamos revisar esta página regularmente.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">11. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato 
              através do suporte no aplicativo ou pelo WhatsApp disponível na plataforma.
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
