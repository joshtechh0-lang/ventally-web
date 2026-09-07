import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-red-500/90 backdrop-blur-sm px-4 py-2 flex items-center justify-center gap-2">
      <WifiOff size={16} className="text-white flex-shrink-0" />
      <p className="text-white text-sm font-medium">No internet connection — please check your network</p>
    </div>
  );
};
