import { useState, useEffect, memo } from 'react';
import { Wifi, WifiOff, RefreshCw, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  getPendingCount, 
  syncAllPending, 
  initializeOfflineSync,
  isOnline 
} from '@/utils/offlineQueue';

const OfflineIndicator = memo(() => {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const cleanup = initializeOfflineSync();
    
    const handleOnline = () => {
      setOnline(true);
      refreshPendingCount();
    };
    
    const handleOffline = () => {
      setOnline(false);
      toast({
        title: "Mode Offline",
        description: "Anda sedang offline. Transaksi akan disimpan dan disinkronkan saat online.",
        variant: "destructive",
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 10000);
    
    return () => {
      cleanup();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const refreshPendingCount = async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Error getting pending count:', error);
    }
  };

  const handleManualSync = async () => {
    if (!online) {
      toast({
        title: "Tidak Bisa Sync",
        description: "Anda sedang offline",
        variant: "destructive",
      });
      return;
    }
    
    setIsSyncing(true);
    try {
      const result = await syncAllPending();
      
      if (result.success > 0 || result.failed > 0) {
        toast({
          title: "Sinkronisasi Selesai",
          description: `Berhasil: ${result.success}, Gagal: ${result.failed}`,
        });
      } else {
        toast({
          title: "Tidak Ada yang Perlu Disinkronkan",
          description: "Semua transaksi sudah tersinkronisasi",
        });
      }
      
      await refreshPendingCount();
    } catch (error) {
      console.error('Error syncing:', error);
      toast({
        title: "Error",
        description: "Gagal melakukan sinkronisasi",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't show if online and no pending
  if (online && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      {!online && (
        <Badge variant="destructive" className="flex items-center gap-1 py-1.5 px-3">
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline</span>
        </Badge>
      )}
      
      {pendingCount > 0 && (
        <Badge 
          variant="secondary" 
          className="flex items-center gap-1 py-1.5 px-3 bg-amber-100 text-amber-800 border-amber-200"
        >
          <Cloud className="h-3.5 w-3.5" />
          <span>{pendingCount} pending</span>
        </Badge>
      )}
      
      {online && pendingCount > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="h-8"
        >
          {isSyncing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Wifi className="h-3.5 w-3.5 mr-1" />
              Sync
            </>
          )}
        </Button>
      )}
    </div>
  );
});

OfflineIndicator.displayName = 'OfflineIndicator';

export default OfflineIndicator;
