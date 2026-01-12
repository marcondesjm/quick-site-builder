import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { APP_VERSION } from '@/config/version';

interface AppVersion {
  id: string;
  version: string;
  release_notes: string | null;
  is_critical: boolean;
  created_at: string;
}

interface VersionCheckResult {
  isUpToDate: boolean;
  latestVersion: string | null;
  releaseNotes: string | null;
  isCritical: boolean;
  isLoading: boolean;
  error: string | null;
  checkNow: () => Promise<void>;
}

// Compare version strings (e.g., "1.0.1" vs "1.0.2")
function compareVersions(current: string, latest: string): number {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;
    
    if (latestPart > currentPart) return 1; // Latest is newer
    if (latestPart < currentPart) return -1; // Current is newer (shouldn't happen)
  }
  
  return 0; // Same version
}

export function useVersionCheck(): VersionCheckResult {
  const [isUpToDate, setIsUpToDate] = useState(true);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [releaseNotes, setReleaseNotes] = useState<string | null>(null);
  const [isCritical, setIsCritical] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkVersion = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('app_versions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        console.error('Error fetching version:', fetchError);
        setError('Erro ao verificar atualizações');
        return;
      }

      if (data) {
        const latestVer = (data as AppVersion).version;
        setLatestVersion(latestVer);
        setReleaseNotes((data as AppVersion).release_notes);
        setIsCritical((data as AppVersion).is_critical);
        
        const comparison = compareVersions(APP_VERSION, latestVer);
        setIsUpToDate(comparison <= 0);
      }
    } catch (err) {
      console.error('Version check error:', err);
      setError('Erro ao verificar atualizações');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check version on mount
  useEffect(() => {
    checkVersion();
  }, [checkVersion]);

  // Check periodically (every 30 minutes)
  useEffect(() => {
    const interval = setInterval(checkVersion, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkVersion]);

  return {
    isUpToDate,
    latestVersion,
    releaseNotes,
    isCritical,
    isLoading,
    error,
    checkNow: checkVersion
  };
}
