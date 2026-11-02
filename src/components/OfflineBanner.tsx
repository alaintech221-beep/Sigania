import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 flex items-center justify-between gap-3 rounded-xl bg-amber-600/95 dark:bg-amber-600/90 text-white px-4 py-2.5 shadow-lg backdrop-blur-md text-xs font-medium border border-amber-400/40 animate-slide-up">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 shrink-0 text-amber-200" />
        <span>Mode Hors Ligne actif — Toutes les fiches et quiz restent 100% fonctionnels.</span>
      </div>
      <span className="w-2 h-2 rounded-full bg-amber-200 animate-pulse shrink-0" />
    </div>
  );
};
