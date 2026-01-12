import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useBoxControls, useBoxHistory } from "@/hooks/useBoxControl";

export const AppStatusChecker = () => {
  const { toast } = useToast();
  const { refetch: refetchBoxes } = useBoxControls();
  const { refetch: refetchHistory } = useBoxHistory();
  const [hasCheckedOnLoad, setHasCheckedOnLoad] = useState(false);

  // Auto-refresh when app becomes visible (silently, without toast)
  useEffect(() => {
    const performStatusCheck = async () => {
      console.log('Performing global status check...');
      await refetchBoxes();
      await refetchHistory();
      // Removed toast notification to reduce visual clutter
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App became visible - refreshing status...');
        performStatusCheck();
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

  return null;
};
