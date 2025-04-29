
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if we've already dismissed the prompt recently
    const hasDismissedPrompt = localStorage.getItem('pwaPromptDismissed');
    const dismissalTimestamp = Number(localStorage.getItem('pwaPromptDismissedTime') || '0');
    const oneDayMs = 24 * 60 * 60 * 1000;
    const isDismissalExpired = Date.now() - dismissalTimestamp > oneDayMs;
    
    // Clear expired dismissals
    if (hasDismissedPrompt && isDismissalExpired) {
      localStorage.removeItem('pwaPromptDismissed');
      localStorage.removeItem('pwaPromptDismissedTime');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Only show the prompt if user hasn't dismissed it before
      // or if the dismissal period has expired
      if (!hasDismissedPrompt || isDismissalExpired) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if the app is already installed
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone === true;
    
    if (isAppInstalled) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
    } finally {
      // We no longer need the prompt. Clear it up
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Store dismissal in localStorage with timestamp
    localStorage.setItem('pwaPromptDismissed', 'true');
    localStorage.setItem('pwaPromptDismissedTime', Date.now().toString());
  };

  if (!showPrompt || dismissed) return null;

  return (
    <Alert className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 bg-primary text-primary-foreground shadow-lg mb-safe-bottom">
      <div className="flex items-center justify-between">
        <AlertDescription className="flex-1">
          Install Compendio for a better experience with offline access
        </AlertDescription>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleInstallClick}
            className="bg-white text-primary hover:bg-gray-100"
          >
            Install
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDismiss}>
            <X className="h-5 w-5" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
    </Alert>
  );
}
