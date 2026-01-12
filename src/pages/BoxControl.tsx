import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { 
  Package, 
  Lock, 
  Unlock, 
  History, 
  CheckCircle2, 
  Shield, 
  Box,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface BoxStatus {
  hasPackage: boolean;
  packageStatus: 'pending' | 'delivered' | 'collected' | null;
  securityStatus: 'secure' | 'warning' | 'alert';
  isLocked: boolean;
  location: string;
  lastUpdate: Date;
}

interface HistoryItem {
  id: string;
  action: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'info';
}

const BoxControl = () => {
  const { toast } = useToast();
  const [boxStatus, setBoxStatus] = useState<BoxStatus>({
    hasPackage: true,
    packageStatus: 'delivered',
    securityStatus: 'secure',
    isLocked: true,
    location: 'Caixa DoorVii',
    lastUpdate: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: '1', action: 'Pacote entregue', timestamp: new Date(Date.now() - 3600000), status: 'success' },
    { id: '2', action: 'Caixa trancada', timestamp: new Date(Date.now() - 7200000), status: 'info' },
    { id: '3', action: 'Caixa aberta pelo morador', timestamp: new Date(Date.now() - 86400000), status: 'info' },
  ]);

  const handleOpen = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setBoxStatus(prev => ({ ...prev, isLocked: false, lastUpdate: new Date() }));
    setHistory(prev => [
      { id: Date.now().toString(), action: 'Caixa aberta', timestamp: new Date(), status: 'info' },
      ...prev
    ]);
    
    toast({
      title: "Caixa Aberta",
      description: "A caixa foi destrancada com sucesso.",
    });
    setIsLoading(false);
  };

  const handleClose = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setBoxStatus(prev => ({ ...prev, isLocked: true, lastUpdate: new Date() }));
    setHistory(prev => [
      { id: Date.now().toString(), action: 'Caixa trancada', timestamp: new Date(), status: 'success' },
      ...prev
    ]);
    
    toast({
      title: "Caixa Trancada",
      description: "A caixa foi trancada com sucesso.",
    });
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setBoxStatus(prev => ({ ...prev, lastUpdate: new Date() }));
    toast({
      title: "Status Atualizado",
      description: "O status da caixa foi atualizado.",
    });
    setIsLoading(false);
  };

  const getPackageStatusText = () => {
    switch (boxStatus.packageStatus) {
      case 'delivered': return 'Entregue';
      case 'pending': return 'Aguardando';
      case 'collected': return 'Retirado';
      default: return 'Sem pacote';
    }
  };

  const getSecurityStatusText = () => {
    switch (boxStatus.securityStatus) {
      case 'secure': return 'Seguro';
      case 'warning': return 'Atenção';
      case 'alert': return 'Alerta';
      default: return 'Desconhecido';
    }
  };

  const getSecurityStatusColor = () => {
    switch (boxStatus.securityStatus) {
      case 'secure': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'warning': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
      case 'alert': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `Há ${minutes} min`;
    if (hours < 24) return `Há ${hours}h`;
    return `Há ${days} dia${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Status Banner */}
        {boxStatus.hasPackage && boxStatus.packageStatus === 'delivered' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-600 text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">Pacote recebido com segurança</span>
          </motion.div>
        )}

        {/* Initial Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Painel Inicial</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="h-8 w-8"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Pacote</h3>
                    {boxStatus.hasPackage && boxStatus.packageStatus === 'delivered' && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div className="space-y-0.5 text-sm">
                    <p>
                      <span className="text-muted-foreground">Pacote:</span>{' '}
                      <span className="text-primary font-medium">{getPackageStatusText()}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Status:</span>{' '}
                      <span className={`font-medium ${
                        boxStatus.securityStatus === 'secure' ? 'text-green-600' : 
                        boxStatus.securityStatus === 'warning' ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {getSecurityStatusText()}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Local:</span>{' '}
                      <span className="text-foreground">{boxStatus.location}</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Access Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Controle de Acesso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-primary/5 hover:border-primary"
                  onClick={handleOpen}
                  disabled={isLoading || !boxStatus.isLocked}
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Unlock className="w-5 h-5 text-foreground" />
                  </div>
                  <span className="text-sm font-medium">Abrir</span>
                </Button>

                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-primary/5 hover:border-primary"
                  onClick={handleClose}
                  disabled={isLoading || boxStatus.isLocked}
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Lock className="w-5 h-5 text-foreground" />
                  </div>
                  <span className="text-sm font-medium">Fechar</span>
                </Button>

                <Button
                  variant="outline"
                  className={`flex flex-col items-center gap-2 h-auto py-4 hover:bg-primary/5 hover:border-primary ${showHistory ? 'bg-primary/10 border-primary' : ''}`}
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <History className="w-5 h-5 text-foreground" />
                  </div>
                  <span className="text-sm font-medium">Histórico</span>
                </Button>
              </div>

              {/* Lock Status Indicator */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${boxStatus.isLocked ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-sm text-muted-foreground">
                  {boxStatus.isLocked ? 'Caixa trancada' : 'Caixa destrancada'}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* History Section */}
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Histórico de Atividades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.status === 'success' ? 'bg-green-500' :
                        item.status === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.action}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Security Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getSecurityStatusColor()}`}>
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Status de Segurança</h3>
                  <p className="text-sm text-muted-foreground">
                    Última atualização: {formatTimestamp(boxStatus.lastUpdate)}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={getSecurityStatusColor()}
                >
                  {getSecurityStatusText()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default BoxControl;
