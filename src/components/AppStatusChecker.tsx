import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useBoxControls, useBoxHistory } from "@/hooks/useBoxControl";

export const AppStatusChecker = () => {
  const { toast } = useToast();
  const { refetch: refetchBoxes } = useBoxControls();
  const { refetch: refetchHistory } = useBoxHistory();
  const [hasCheckedOnLoad, setHasCheckedOnLoad] = useState(false);

  // Auto-refresh when app becomes visible
  useEffect(() => {
    const performStatusCheck = async (showToast = false) => {
      console.log('Performing global status check...');
      await refetchBoxes();
      await refetchHistory();
      
      // Only show toast on first load
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
        performStatusCheck(false); // Silent refresh
      }
    };

    const handleFocus = () => {
      console.log('Window focused - refreshing status...');
      performStatusCheck(false); // Silent refresh
    };

    // Initial load check (only once, with toast)
    if (!hasCheckedOnLoad) {
      const initialTimeout = setTimeout(() => {
        performStatusCheck(true); // Show toast only on first load
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

  return null;
};
