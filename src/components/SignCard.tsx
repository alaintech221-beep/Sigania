import React from 'react';
import { RoadSign, SignProgress, MASTERY_LEVELS } from '../types/signs';
import { CATEGORIES } from '../data/signs';
import { SignImage } from './SignImage';
import { AlertCircle, Volume2 } from 'lucide-react';
import { speakFrench, playTapSound } from '../utils/audio';
import { getSignMasteryLevel } from '../utils/storage';

interface SignCardProps {
  sign: RoadSign;
  progress?: SignProgress;
  isMistake: boolean;
  onSelect: (sign: RoadSign) => void;
  soundEnabled: boolean;
}

export const SignCard: React.FC<SignCardProps> = ({
  sign,
  progress,
  isMistake,
  onSelect,
  soundEnabled,
}) => {
  const cat = CATEGORIES[sign.categorie];
  const level = getSignMasteryLevel(progress);
  const levelConfig = MASTERY_LEVELS[level];

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTapSound(soundEnabled);
    speakFrench(`${sign.nom}. ${sign.signification}`);
  };

  // Garde uniquement le code court (ex: "B14" au lieu de "B14 (20)")
  const shortCode = sign.code.replace(/\s*\([^)]*\)/g, '').trim();

  return (
    <div
      onClick={() => {
        playTapSound(soundEnabled);
        onSelect(sign);
      }}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md cursor-pointer active:scale-[0.98]"
    >
      {/* Top section: Catégorie, Code court sur sa ligne, Pastille sur sa ligne */}
      <div className="mb-2">
        {/* Ligne 1 : Catégorie & Bouton audio */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
            {cat ? cat.name : sign.categorie}
          </span>
          <button
            onClick={handleSpeak}
            className="p-1 -mr-1 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Écouter le nom"
            aria-label={`Écouter ${sign.nom}`}
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ligne 2 : Code du panneau sur sa propre ligne, entièrement visible */}
        <div className="mt-1">
          <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
            {shortCode}
          </span>
        </div>

        {/* Ligne 3 : Pastille de niveau de maîtrise sur sa propre ligne, sans chevauchement */}
        <div className="mt-1.5 flex items-center">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
            style={{
              backgroundColor: `${levelConfig.color}15`,
              borderColor: `${levelConfig.color}40`,
              color: levelConfig.color,
            }}
            title={`Niveau de maîtrise : ${levelConfig.label}`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: levelConfig.color }}
            />
            <span className="text-[10px] font-bold">{levelConfig.label}</span>
          </span>
        </div>
      </div>

      {/* Road Sign Image Slot */}
      <div className="w-full aspect-square max-w-[110px] mx-auto my-2 flex items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/60 transition-transform group-hover:scale-105">
        <SignImage
          sign={sign}
          imageClassName="w-20 h-20 object-contain filter drop-shadow-sm"
        />
      </div>

      {/* Title & Short Meaning */}
      <div className="mt-2 text-center">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
          {sign.nom}
        </h3>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
          {sign.signification}
        </p>
      </div>

      {/* Bottom Status strip (niveau affiché UNE SEULE FOIS en haut, plus de répétition ici) */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
        {isMistake ? (
          <span className="flex items-center gap-1 text-rose-500 font-semibold text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> À réviser
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-[10px] font-medium capitalize">
            {sign.difficulte ? `Niveau ${sign.difficulte}` : ''}
          </span>
        )}

        <span className="text-blue-600 dark:text-blue-400 font-medium text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 ml-auto">
          Détails →
        </span>
      </div>
    </div>
  );
};
