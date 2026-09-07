import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

export const IOSInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Detect Safari (Chrome on iOS has 'CriOS' instead of 'Version' generally, but simple regex works mostly. Let's be thorough)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
    
    // Check if it's already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    // We only show on iOS Safari when not already installed
    if (isIOS && isSafari && !isStandalone) {
      const hasDismissed = localStorage.getItem('ios_install_prompt_dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios_install_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-4 pb-8 sm:pb-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-bg-surface rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-500 border border-white/10">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 p-2 text-text-muted hover:text-text-pure transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden">
             <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse-soft" />
             <img src="/apple-touch-icon.png" alt="Ventally" className="w-12 h-12 rounded-xl relative z-10 shadow-lg" />
          </div>

          <h3 className="text-xl font-bold text-text-pure mb-2">Install Ventally</h3>
          <p className="text-text-muted text-sm mb-6 leading-relaxed">
            For instant session alerts and better call reliability, add Ventally to your Home Screen.
          </p>

          <div className="w-full bg-bg-card rounded-xl p-4 mb-6 relative overflow-hidden border border-white/5">
            <div className="flex items-center gap-4 text-sm text-text-muted mb-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-primary">
                1
              </div>
              <p className="text-left">Tap the <Share className="inline w-4 h-4 mx-1" /> Share button below.</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-text-muted">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-primary">
                2
              </div>
              <p className="text-left">Select <span className="text-text-pure font-medium mx-1">Add to Home Screen</span> <PlusSquare className="inline w-4 h-4" />.</p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full py-3.5 px-4 bg-primary hover:bg-primary-hover text-text-pure rounded-xl font-semibold transition-all active:scale-[0.98] shadow-glow-primary"
          >
            Got It, Enable Notifications
          </button>
        </div>
      </div>
    </div>
  );
};
