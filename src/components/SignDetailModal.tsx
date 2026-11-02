import React from 'react';
import { RoadSign, SignProgress, MASTERY_LEVELS } from '../types/signs';
import { CATEGORIES } from '../data/signs';
import { SignImage } from './SignImage';
import { X, Volume2, Bookmark, BookmarkCheck, CheckCircle2, AlertTriangle, Lightbulb, ShieldAlert } from 'lucide-react';
import { speakFrench, playTapSound } from '../utils/audio';
import { getSignMasteryLevel } from '../utils/storage';

interface SignDetailModalProps {
  sign: RoadSign | null;
  progress?: SignProgress;
  isMistake: boolean;
  onClose: () => void;
  onToggleMistake: (signId: number) => void;
  soundEnabled: boolean;
}

export const SignDetailModal: React.FC<SignDetailModalProps> = ({
  sign,
  progress,
  isMistake,
  onClose,
  onToggleMistake,
  soundEnabled,
}) => {
  if (!sign) return null;

  const cat = CATEGORIES[sign.categorie];
  const level = getSignMasteryLevel(progress);
  const levelConfig = MASTERY_LEVELS[level];

  const handleSpeak = () => {
    playTapSound(soundEnabled);
    speakFrench(`${sign.nom}. ${sign.signification}. ${sign.regle}`);
  };

  const handleToggle = () => {
    playTapSound(soundEnabled);
    onToggleMistake(sign.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      {/* Backdrop click handler */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] text-slate-900 dark:text-white z-10 animate-slide-up">
        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${cat.bgColor}`}>
                {cat.name}
              </span>
              {sign.code && (
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  Code {sign.code}
                </span>
              )}
              {/* Mastery Pastille Badge */}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border"
                style={{
                  backgroundColor: `${levelConfig.color}18`,
                  borderColor: `${levelConfig.color}40`,
                  color: levelConfig.color,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: levelConfig.color }}
                />
                <span>{levelConfig.label}</span>
              </span>
              {sign.difficulte && (
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                    sign.difficulte === 'facile'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : sign.difficulte === 'moyen'
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-rose-500/10 text-rose-500'
                  }`}
                >
                  {sign.difficulte}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold mt-1 text-slate-900 dark:text-white">
              {sign.nom}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Sign Graphic & Audio */}
        <div className="flex flex-col items-center justify-center p-6 my-2 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
          <div className="w-36 h-36 flex items-center justify-center">
            <SignImage
              sign={sign}
              imageClassName="w-32 h-32 object-contain filter drop-shadow-md"
            />
          </div>

          <button
            onClick={handleSpeak}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 transition-all"
          >
            <Volume2 className="w-4 h-4" />
            <span>Écouter la fiche vocale</span>
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-3.5 my-4 text-sm">
          {/* Signification */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              <ShieldAlert className="w-4 h-4 text-blue-500" />
              <span>SIGNIFICATION</span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-medium">
              {sign.signification}
            </p>
          </div>

          {/* Règle officielle */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>RÈGLE DU CODE DE LA ROUTE</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
              {sign.regle}
            </p>
          </div>

          {/* Astuce mnémotechnique */}
          {sign.astuce && (
            <div className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                <Lightbulb className="w-4 h-4" />
                <span>ASTUCE POUR RETENIR</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                {sign.astuce}
              </p>
            </div>
          )}

          {/* User Progress Stats for this sign */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>
              Réussites : <strong className="text-emerald-500 font-bold">{progress?.correctCount || 0}</strong>
            </span>
            <span>
              Erreurs : <strong className="text-rose-500 font-bold">{progress?.wrongCount || 0}</strong>
            </span>
            <div className="flex items-center gap-1.5 font-semibold">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: levelConfig.color }}
              />
              <span style={{ color: levelConfig.color }}>{levelConfig.label}</span>
              {isMistake && <span className="text-rose-500 text-[10px]">(À revoir)</span>}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={handleToggle}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
              isMistake
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isMistake ? (
              <>
                <BookmarkCheck className="w-4 h-4" />
                <span>Dans les révisions</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span>Ajouter aux révisions</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors text-center"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
