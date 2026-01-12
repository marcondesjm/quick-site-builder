import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useProperties } from "@/hooks/useProperties";
import { useAddActivity } from "@/hooks/useActivities";
import { 
  useBoxControls, 
  useBoxHistory, 
  useCreateBox, 
  useUpdateBox, 
  useAddBoxHistory 
} from "@/hooks/useBoxControl";
import { supabase } from "@/integrations/supabase/client";
import { 
  Package, 
  History, 
  CheckCircle2, 
  Shield, 
  RefreshCw,
  LockKeyholeOpen,
  ArchiveRestore
} from "lucide-react";

const BoxControl = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: properties } = useProperties();
  const { data: boxes, isLoading: boxesLoading, refetch: refetchBoxes } = useBoxControls();
  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useBoxHistory();
  const createBox = useCreateBox();
  const updateBox = useUpdateBox();
  const addBoxHistory = useAddBoxHistory();
  const addActivity = useAddActivity();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);

  // Get current box (first one or selected)
  const currentBox = boxes?.find(b => b.id === selectedBox) || boxes?.[0];

  // Create default box if none exists
  useEffect(() => {
    if (!boxesLoading && boxes?.length === 0 && user?.id) {
      createBox.mutate({
        name: 'Caixa DoorVii',
        property_id: properties?.[0]?.id || null,
      });
    }
  }, [boxesLoading, boxes, user?.id, properties]);

  // Set selected box when loaded
  useEffect(() => {
    if (boxes?.length && !selectedBox) {
      setSelectedBox(boxes[0].id);
    }
  }, [boxes, selectedBox]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('box-controls-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'box_controls',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refetchBoxes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetchBoxes]);

  const handleOpen = async () => {
    if (!currentBox) return;
    
    setIsLoading(true);
    try {
      await updateBox.mutateAsync({ 
        id: currentBox.id, 
        is_locked: false 
      });
      
      await addBoxHistory.mutateAsync({
        box_id: currentBox.id,
        action: 'Caixa aberta pelo morador',
        status: 'info'
      });

      // Register in activity log
      addActivity.mutate({
        type: 'incoming',
        title: 'Caixa aberta',
        property_name: currentBox.name,
        property_id: currentBox.property_id || undefined,
      });
      
      toast({
        title: "Caixa Aberta",
        description: "A caixa foi destrancada com sucesso.",
      });
      
      refetchHistory();
    } catch (error) {
      console.error('Error opening box:', error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir a caixa.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    if (!currentBox) return;
    
    setIsLoading(true);
    try {
      await updateBox.mutateAsync({ 
        id: currentBox.id, 
        is_locked: true 
      });
      
      await addBoxHistory.mutateAsync({
        box_id: currentBox.id,
        action: 'Caixa trancada',
        status: 'success'
      });

      // Register in activity log
      addActivity.mutate({
        type: 'incoming',
        title: 'Caixa trancada',
        property_name: currentBox.name,
        property_id: currentBox.property_id || undefined,
      });
      
      toast({
        title: "Caixa Trancada",
        description: "A caixa foi trancada com sucesso.",
      });
      
      refetchHistory();
    } catch (error) {
      console.error('Error closing box:', error);
      toast({
        title: "Erro",
        description: "Não foi possível trancar a caixa.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refetchBoxes();
      await refetchHistory();
      
      if (currentBox) {
        await updateBox.mutateAsync({ 
          id: currentBox.id, 
          last_update: new Date().toISOString() 
        } as any);
      }
      
      toast({
        title: "Status Atualizado",
        description: "O status da caixa foi atualizado.",
      });
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPackageStatusText = (status: string | null) => {
    switch (status) {
      case 'delivered': return 'Entregue';
      case 'pending': return 'Aguardando';
      case 'collected': return 'Retirado';
      default: return 'Sem pacote';
    }
  };

  const getSecurityStatusText = (status: string) => {
    switch (status) {
      case 'secure': return 'Seguro';
      case 'warning': return 'Atenção';
      case 'alert': return 'Alerta';
      default: return 'Desconhecido';
    }
  };

  const getSecurityStatusColor = (status: string) => {
    switch (status) {
      case 'secure': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'warning': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
      case 'alert': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
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

  if (boxesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Status Banner */}
        {currentBox?.has_package && currentBox?.package_status === 'delivered' && (
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
                    <h3 className="font-semibold text-foreground">{currentBox?.name || 'Caixa DoorVii'}</h3>
                    {currentBox?.has_package && currentBox?.package_status === 'delivered' && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div className="space-y-0.5 text-sm">
                    <p>
                      <span className="text-muted-foreground">Pacote:</span>{' '}
                      <span className="text-primary font-medium">
                        {getPackageStatusText(currentBox?.package_status || null)}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Status:</span>{' '}
                      <span className={`font-medium ${
                        currentBox?.security_status === 'secure' ? 'text-green-600' : 
                        currentBox?.security_status === 'warning' ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {getSecurityStatusText(currentBox?.security_status || 'secure')}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Local:</span>{' '}
                      <span className="text-foreground">{currentBox?.name || 'Caixa DoorVii'}</span>
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
                  disabled={isLoading || !currentBox?.is_locked}
                >
                  <div className="w-14 h-14 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <LockKeyholeOpen className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">Abrir</span>
                </Button>

                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-primary/5 hover:border-primary"
                  onClick={handleClose}
                  disabled={isLoading || currentBox?.is_locked}
                >
                  <div className="w-14 h-14 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <ArchiveRestore className="w-8 h-8 text-red-600 dark:text-red-400" />
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
                <div className={`w-2 h-2 rounded-full ${currentBox?.is_locked ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-sm text-muted-foreground">
                  {currentBox?.is_locked ? 'Caixa trancada' : 'Caixa destrancada'}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* History Section */}
        <AnimatePresence>
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
                  {historyLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : history?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhuma atividade registrada
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {history?.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            item.status === 'success' ? 'bg-green-500' :
                            item.status === 'warning' ? 'bg-amber-500' : 
                            item.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.action}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatTimestamp(item.created_at)}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getSecurityStatusColor(currentBox?.security_status || 'secure')}`}>
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Status de Segurança</h3>
                  <p className="text-sm text-muted-foreground">
                    Última atualização: {currentBox ? formatTimestamp(currentBox.last_update) : 'N/A'}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={getSecurityStatusColor(currentBox?.security_status || 'secure')}
                >
                  {getSecurityStatusText(currentBox?.security_status || 'secure')}
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
