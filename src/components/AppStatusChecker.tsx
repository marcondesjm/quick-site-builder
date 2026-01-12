import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useBoxControls, useBoxHistory } from "@/hooks/useBoxControl";
import { RefreshCw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const getSecurityStatusText = (status: string) => {
  switch (status) {
    case 'secure': return 'Seguro';
    case 'warning': return 'Atenção';
    case 'alert': return 'Alerta';
    default: return 'Desconhecido';
  }
};

export const AppStatusChecker = () => {
  const { toast } = useToast();
  const { data: boxes, refetch: refetchBoxes } = useBoxControls();
  const { refetch: refetchHistory } = useBoxHistory();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasCheckedOnLoad, setHasCheckedOnLoad] = useState(false);

  const currentBox = boxes?.[0];

  // Auto-refresh when app becomes visible
  useEffect(() => {
    const performStatusCheck = async (showToast = true) => {
      console.log('Performing global status check...');
      await refetchBoxes();
      await refetchHistory();
      
      if (showToast) {
        toast({
          title: "✅ Verificação concluída",
          description: "Status da caixa atualizado. Tudo OK!",
          duration: 3000,
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App became visible - refreshing status...');
        performStatusCheck();
      } else if (document.visibilityState === 'hidden') {
        console.log('App is being hidden...');
        setShowExitConfirm(true);
      }
    };

    const handleFocus = () => {
      console.log('Window focused - refreshing status...');
      performStatusCheck();
    };

    // Initial load check (only once)
    if (!hasCheckedOnLoad) {
      const initialTimeout = setTimeout(() => {
        performStatusCheck();
        setHasCheckedOnLoad(true);
      }, 1000);

      return () => clearTimeout(initialTimeout);
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetchBoxes, refetchHistory, toast, hasCheckedOnLoad]);

  const handleUpdateBeforeExit = async () => {
    await refetchBoxes();
    await refetchHistory();
    toast({
      title: "✅ Atualizado!",
      description: "Status sincronizado com sucesso.",
      duration: 2000,
    });
    setShowExitConfirm(false);
  };

  return (
    <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Antes de sair...
          </AlertDialogTitle>
          <AlertDialogDescription>
            Deseja atualizar o status da caixa antes de fechar o aplicativo?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="p-4 rounded-xl bg-muted/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={currentBox?.is_locked ? "default" : "secondary"}>
              {currentBox?.is_locked ? '🔒 Trancada' : '🔓 Destrancada'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Segurança:</span>
            <Badge variant={currentBox?.security_status === 'secure' ? "default" : "destructive"}>
              {getSecurityStatusText(currentBox?.security_status || 'secure')}
            </Badge>
          </div>
        </div>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">
            <X className="w-4 h-4 mr-2" />
            Fechar
          </AlertDialogCancel>
          <AlertDialogAction 
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            onClick={handleUpdateBeforeExit}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Status
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
