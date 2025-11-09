import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, X } from 'lucide-react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if should show iOS instructions
    if (iOS && !window.matchMedia('(display-mode: standalone)').matches) {
      const hasSeenPrompt = localStorage.getItem('ios-install-prompt-seen');
      if (!hasSeenPrompt) {
        setShowInstallPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        toast.success('Aplikasi berhasil diinstall!', {
          description: 'Anda sekarang bisa mengakses dari layar utama'
        });
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      toast.error('Gagal menginstall aplikasi');
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    if (isIOS) {
      localStorage.setItem('ios-install-prompt-seen', 'true');
    }
  };

  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in">
      <Card className="shadow-premium border-primary/20 bg-gradient-subtle hover-lift">
        <CardHeader className="relative pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {isIOS ? (
                <Smartphone className="h-6 w-6 text-primary" />
              ) : (
                <Download className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Install Aplikasi</CardTitle>
              <CardDescription className="text-xs">
                Akses lebih cepat dari layar utama
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isIOS ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">Cara Install di iPhone/iPad:</p>
              <ol className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-[1.5rem] text-primary">1.</span>
                  <span>Tap tombol <strong className="text-foreground">Share</strong> (ikon kotak dengan panah)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-[1.5rem] text-primary">2.</span>
                  <span>Scroll ke bawah dan tap <strong className="text-foreground">"Add to Home Screen"</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-[1.5rem] text-primary">3.</span>
                  <span>Tap <strong className="text-foreground">"Add"</strong> untuk menyelesaikan</span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Install aplikasi untuk pengalaman yang lebih baik dan akses offline.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={handleInstallClick} 
                  className="flex-1 bg-gradient-primary hover:opacity-90 shadow-elegant"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Install Sekarang
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  size="sm"
                  className="px-3"
                >
                  Nanti
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
