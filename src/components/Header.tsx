import React, { useState } from 'react';
import { Volume2, VolumeX, Moon, Sun, Globe } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AppSettings } from '../utils/storage';
import { playTapSound } from '../utils/audio';

interface HeaderProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  activeMistakesCount: number;
}

const COUNTRIES = [
  { code: 'FR', label: 'France', flag: '🇫🇷' },
  { code: 'BE', label: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', label: 'Suisse', flag: '🇨🇭' },
  { code: 'CA', label: 'Canada (QC)', flag: '🇨🇦' },
  { code: 'INT', label: 'Convention de Vienne', flag: '🌍' },
] as const;

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  activeMistakesCount,
}) => {
  const [showCountryModal, setShowCountryModal] = useState(false);

  const currentCountry = COUNTRIES.find((c) => c.code === settings.country) || COUNTRIES[0];

  const handleToggleSound = () => {
    playTapSound(settings.soundEnabled);
    onUpdateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const handleToggleTheme = () => {
    playTapSound(settings.soundEnabled);
    onUpdateSettings({ darkMode: !settings.darkMode });
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 transition-colors">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 p-1 flex items-center justify-center shadow-sm overflow-hidden border border-blue-500/30">
              <img
                src="/icon.svg"
                alt="SignaGo Logo"
                className="w-full h-full object-contain filter drop-shadow-sm"
              />
            </div>
            <div>
              <span className="text-base font-bold text-slate-100 tracking-tight">SignaGo</span>
              <span className="hidden sm:inline text-xs text-slate-400 ml-2">· Panneaux de la route</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Country Selector Trigger */}
            <button
              onClick={() => {
                playTapSound(settings.soundEnabled);
                setShowCountryModal(true);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 transition-all active:scale-95"
              title="Choisir le pays / réglementation"
            >
              <span>{currentCountry.flag}</span>
              <span className="hidden xs:inline">{currentCountry.code}</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-lg text-xs transition-colors border ${
                settings.soundEnabled
                  ? 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20'
                  : 'text-slate-400 bg-slate-800 border-slate-700/80 hover:bg-slate-700'
              }`}
              title={settings.soundEnabled ? 'Son activé' : 'Son coupé'}
              aria-label="Basculer le son"
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-lg text-xs text-slate-300 hover:text-white bg-slate-800 border border-slate-700/80 hover:bg-slate-700 transition-colors"
              title={settings.darkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label="Basculer le thème"
            >
              {settings.darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>

            {/* In-App PWA Install */}
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Country Selection Modal */}
      {showCountryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl text-slate-900 dark:text-white animate-scale-up">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-bold">Sélection du pays</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Les 40 panneaux de base correspondent à la Convention de Vienne sur la signalisation routière, adoptée en France, Belgique, Suisse et internationalement.
            </p>

            <div className="space-y-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    playTapSound(settings.soundEnabled);
                    onUpdateSettings({ country: c.code });
                    setShowCountryModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all ${
                    settings.country === c.code
                      ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">{c.flag}</span>
                    <span>{c.label}</span>
                  </span>
                  {settings.country === c.code && (
                    <span className="text-xs text-blue-500 font-bold">Actif</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCountryModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
};
