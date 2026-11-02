import React, { useState } from 'react';
import { Download, Share2, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all rounded-lg shadow-sm"
        title="Installer l'application hors ligne"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Installer</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all rounded-lg border border-slate-300 dark:border-slate-700"
          title="Installer sur iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-500" />
          <span>Installer</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-slate-900 dark:text-white">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold">Installer sur iPhone & iPad</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Profitez de l'application hors ligne sans connexion internet :
              </p>

              <ol className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <span>Touchez le bouton de <strong>Partage</strong> (<Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" />) dans la barre Safari.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <span>Faites défiler vers le bas et sélectionnez <strong>Sur l'écran d'accueil</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                  <span>Touchez <strong>Ajouter</strong> en haut à droite.</span>
                </li>
              </ol>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                J'ai compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
