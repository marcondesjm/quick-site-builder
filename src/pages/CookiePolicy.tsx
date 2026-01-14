import { motion } from "framer-motion";
import { ArrowLeft, Cookie, Shield, Settings, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CookiePolicy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Cookie,
      title: "O que são Cookies?",
      content: `Cookies são pequenos arquivos de texto que são armazenados no seu dispositivo (computador, tablet ou celular) quando você visita um site. Eles são amplamente utilizados para fazer os sites funcionarem de forma mais eficiente, bem como para fornecer informações aos proprietários do site.`
    },
    {
      icon: Settings,
      title: "Cookies Essenciais",
      content: `Estes cookies são necessários para o funcionamento do site e não podem ser desativados em nossos sistemas. Eles geralmente são definidos apenas em resposta a ações feitas por você, como definir suas preferências de privacidade, fazer login ou preencher formulários. Você pode configurar seu navegador para bloquear esses cookies, mas algumas partes do site podem não funcionar corretamente.`
    },
    {
      icon: BarChart3,
      title: "Cookies de Análise",
      content: `Estes cookies nos permitem contar visitas e fontes de tráfego para que possamos medir e melhorar o desempenho do nosso site. Eles nos ajudam a saber quais páginas são mais e menos populares e a ver como os visitantes se movimentam pelo site. Todas as informações coletadas por esses cookies são agregadas e, portanto, anônimas.`
    },
    {
      icon: Users,
      title: "Cookies de Funcionalidade",
      content: `Estes cookies permitem que o site forneça funcionalidades e personalização aprimoradas. Eles podem ser definidos por nós ou por provedores terceiros cujos serviços adicionamos às nossas páginas. Se você não permitir esses cookies, alguns ou todos esses serviços podem não funcionar corretamente.`
    },
    {
      icon: Shield,
      title: "Seus Direitos",
      content: `Você tem o direito de decidir se aceita ou rejeita cookies. Você pode exercer suas preferências de cookies clicando nos botões de aceitação ou recusa no banner de cookies. Além disso, você pode configurar seu navegador para recusar todos os cookies ou para indicar quando um cookie está sendo enviado. No entanto, se você optar por recusar cookies, algumas funcionalidades do site podem ficar comprometidas.`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <motion.header 
        className="container mx-auto px-4 py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </motion.header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 pb-16">
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
              <Cookie className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Política de Cookies
            </h1>
            <p className="text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Introduction */}
          <motion.div
            className="bg-card border border-border rounded-2xl p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-muted-foreground leading-relaxed">
              Esta Política de Cookies explica o que são cookies, como os utilizamos no site DoorVII, 
              os tipos de cookies que utilizamos e como você pode gerenciar suas preferências de cookies. 
              Ao continuar a navegar em nosso site, você concorda com o uso de cookies conforme descrito 
              nesta política.
            </p>
          </motion.div>

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                className="bg-card border border-border rounded-2xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-3">
                      {section.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* How to manage cookies */}
          <motion.div
            className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Como gerenciar cookies no seu navegador
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base mb-4">
              A maioria dos navegadores permite que você gerencie suas preferências de cookies. 
              Você pode configurar seu navegador para recusar cookies ou para excluir determinados cookies. 
              Veja como fazer isso nos navegadores mais populares:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                <strong>Chrome:</strong> Configurações → Privacidade e segurança → Cookies
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                <strong>Firefox:</strong> Configurações → Privacidade e Segurança → Cookies
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                <strong>Safari:</strong> Preferências → Privacidade → Cookies
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                <strong>Edge:</strong> Configurações → Cookies e permissões do site
              </li>
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <p className="text-muted-foreground text-sm">
              Se você tiver dúvidas sobre nossa Política de Cookies, entre em contato conosco pelo{" "}
              <a 
                href="https://wa.me/5511999999999" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                WhatsApp
              </a>.
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default CookiePolicy;
