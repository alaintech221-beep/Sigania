import React, { useState, useMemo } from 'react';
import { RoadSign, UserStats, MASTERY_LEVELS } from '../types/signs';
import { ROAD_SIGNS, CATEGORIES } from '../data/signs';
import { SignImage } from './SignImage';
import {
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Trash2,
  Eye,
  Volume2,
  BrainCircuit,
  Trophy,
  XCircle,
  ThumbsUp,
} from 'lucide-react';
import { playTapSound, playCorrectSound, playWrongSound, speakFrench } from '../utils/audio';
import { getSignMasteryLevel, removeSignFromRevision, clearAllRevisionMistakes } from '../utils/storage';

interface RevisionViewProps {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  onRecordAnswer: (signId: number, isCorrect: boolean) => void;
  onStartRevisionQuiz: (mistakeIds: number[]) => void;
  onSwitchToQuiz: () => void;
  soundEnabled: boolean;
}

export const RevisionView: React.FC<RevisionViewProps> = ({
  stats,
  onUpdateStats,
  onRecordAnswer,
  onStartRevisionQuiz,
  onSwitchToQuiz,
  soundEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'flashcards'>('cards');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Mistake signs strictly from stats.mistakeIds, sorted with lowest mastery levels first
  const mistakeSigns = useMemo(() => {
    const signs = ROAD_SIGNS.filter((s) => stats.mistakeIds.includes(s.id));
    return [...signs].sort((a, b) => {
      const lvlA = getSignMasteryLevel(stats.progressBySign[a.id]);
      const lvlB = getSignMasteryLevel(stats.progressBySign[b.id]);
      // Priority to lower levels (0: Nouveau, 1: En apprentissage)
      if (lvlA !== lvlB) return lvlA - lvlB;
      return a.id - b.id;
    });
  }, [stats.mistakeIds, stats.progressBySign]);

  const handleRemoveFromMistakes = (signId: number) => {
    playTapSound(soundEnabled);
    const updated = removeSignFromRevision(signId);
    onUpdateStats(updated);
  };

  const handleRequestClearAll = () => {
    playTapSound(soundEnabled);
    setShowConfirmClear(true);
  };

  const handleConfirmClearAll = () => {
    playTapSound(soundEnabled);
    const updated = clearAllRevisionMistakes();
    onUpdateStats(updated);
    setShowConfirmClear(false);
  };

  // Encouraging empty state when no signs are left to revise
  if (mistakeSigns.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-5 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
          <Trophy className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Carnet de révision à jour</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Bravo ! Aucune erreur en attente
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Vous avez assimilé tous les panneaux testés. Si vous faites une erreur lors d'un quiz, le panneau réapparaîtra ici automatiquement et nécessitera <strong>2 bonnes réponses d'affilée</strong> pour être validé.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => {
              playTapSound(soundEnabled);
              onSwitchToQuiz();
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all inline-flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Lancer un Quiz d'entraînement</span>
          </button>
        </div>
      </div>
    );
  }

  const currentFlashcard = mistakeSigns[flashcardIndex] || mistakeSigns[0];
  const currentProgress = currentFlashcard ? stats.progressBySign[currentFlashcard.id] : undefined;
  const currentStreak = currentProgress?.consecutiveCorrectInRevision || 0;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Leitner Spaced Repetition Header Card */}
      <div className="bg-gradient-to-br from-rose-600 to-amber-600 text-white rounded-3xl p-5 shadow-lg shadow-rose-500/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-rose-200 flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Répétition Ciblée · Règle des 2 Réussites</span>
            </span>
            <h2 className="text-xl font-black mt-1">
              {mistakeSigns.length} panneau{mistakeSigns.length > 1 ? 'x' : ''} à réviser
            </h2>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-lg font-black tabular-nums">
            {mistakeSigns.length}
          </div>
        </div>
        <p className="mt-2 text-xs text-rose-100 leading-relaxed">
          Chaque panneau doit être réussi <strong>2 fois consécutives</strong> pour sortir définitivement de cette liste. Les niveaux bas sont proposés en priorité.
        </p>

        {/* Action Button */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              playTapSound(soundEnabled);
              onStartRevisionQuiz(mistakeSigns.map((s) => s.id));
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-white text-rose-700 font-bold text-xs sm:text-sm hover:bg-rose-50 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Lancer le Quiz ciblé ({mistakeSigns.length})</span>
          </button>
          <button
            onClick={handleRequestClearAll}
            className="p-3 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
            title="Vider la liste de révision"
            aria-label="Vider la liste de révision"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-tabs: Liste des erreurs vs Cartes mémoire */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <button
          onClick={() => {
            playTapSound(soundEnabled);
            setActiveTab('cards');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'cards'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Fiches à réviser ({mistakeSigns.length})
        </button>
        <button
          onClick={() => {
            playTapSound(soundEnabled);
            setActiveTab('flashcards');
            setShowAnswer(false);
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'flashcards'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Mode Cartes Mémoire
        </button>
      </div>

      {/* Tab 1: Cards list */}
      {activeTab === 'cards' && (
        <div className="space-y-2.5">
          {mistakeSigns.map((sign) => {
            const cat = CATEGORIES[sign.categorie];
            const level = getSignMasteryLevel(stats.progressBySign[sign.id]);
            const conf = MASTERY_LEVELS[level];
            const signProgress = stats.progressBySign[sign.id];
            const consecutive = signProgress?.consecutiveCorrectInRevision || 0;

            return (
              <div
                key={sign.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-sm hover:border-rose-400 dark:hover:border-rose-500 transition-colors"
              >
                {/* Road Sign Image */}
                <div className="w-14 h-14 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-center filter drop-shadow-sm">
                  <SignImage
                    sign={sign}
                    imageClassName="w-11 h-11 object-contain"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {cat?.name || sign.categorie}
                    </span>
                    {sign.code && (
                      <span className="text-[10px] font-mono text-slate-400">· {sign.code}</span>
                    )}
                    {/* Pastille de niveau de maîtrise */}
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold border"
                      style={{
                        backgroundColor: `${conf.color}15`,
                        borderColor: `${conf.color}35`,
                        color: conf.color,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: conf.color }}
                      />
                      <span>{conf.label}</span>
                    </span>

                    {/* Badge 2 réussites consécutives */}
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                        consecutive === 1
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      <span>{consecutive}/2 réussi</span>
                      {consecutive === 1 && <span>(encore 1)</span>}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {sign.nom}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {sign.signification}
                  </p>
                </div>

                {/* Actions: Pronounce & Checkmark */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => speakFrench(`${sign.nom}. ${sign.signification}`)}
                    className="p-2 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Écouter"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveFromMistakes(sign.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                    title="Valider manuellement (retirer des révisions)"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Flashcards Interactive Mode */}
      {activeTab === 'flashcards' && currentFlashcard && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
            <span>
              Carte {flashcardIndex + 1} sur {mistakeSigns.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="uppercase font-bold tracking-wider text-rose-500">
                {CATEGORIES[currentFlashcard.categorie]?.name || currentFlashcard.categorie}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  currentStreak === 1
                    ? 'bg-amber-500/15 text-amber-500'
                    : 'bg-rose-500/15 text-rose-500'
                }`}
              >
                {currentStreak}/2 réussi
              </span>
            </div>
          </div>

          {/* Flashcard Body */}
          <div
            onClick={() => {
              playTapSound(soundEnabled);
              setShowAnswer(!showAnswer);
            }}
            className="cursor-pointer min-h-[220px] p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center transition-all hover:scale-[1.01]"
          >
            {/* Sign Image */}
            <div className="w-32 h-32 flex items-center justify-center">
              <SignImage
                sign={currentFlashcard}
                imageClassName="w-28 h-28 object-contain filter drop-shadow-md"
              />
            </div>

            {showAnswer ? (
              <div className="mt-4 space-y-1 animate-slide-up">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {currentFlashcard.nom}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {currentFlashcard.signification}
                </p>
                <p className="text-[11px] text-slate-500 italic mt-1">
                  {currentFlashcard.regle}
                </p>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <Eye className="w-4 h-4" />
                <span>Touchez pour révéler la signification</span>
              </div>
            )}
          </div>

          {/* Interactive validation buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                playWrongSound(soundEnabled);
                onRecordAnswer(currentFlashcard.id, false);
                setShowAnswer(false);
                if (flashcardIndex + 1 < mistakeSigns.length) {
                  setFlashcardIndex((prev) => prev + 1);
                }
              }}
              className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-rose-500/20"
            >
              <XCircle className="w-4 h-4" />
              <span>À revoir (0/2)</span>
            </button>

            <button
              onClick={() => {
                playCorrectSound(soundEnabled);
                onRecordAnswer(currentFlashcard.id, true);
                setShowAnswer(false);
                if (currentStreak + 1 >= 2) {
                  // Will be removed, adjust index if needed
                  if (flashcardIndex >= mistakeSigns.length - 1) {
                    setFlashcardIndex(Math.max(0, mistakeSigns.length - 2));
                  }
                } else {
                  if (flashcardIndex + 1 < mistakeSigns.length) {
                    setFlashcardIndex((prev) => prev + 1);
                  }
                }
              }}
              className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-emerald-500/20"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Réussi ({currentStreak + 1}/2)</span>
            </button>
          </div>

          {/* Flashcard Navigation */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={flashcardIndex === 0}
              onClick={() => {
                playTapSound(soundEnabled);
                setFlashcardIndex((prev) => Math.max(0, prev - 1));
                setShowAnswer(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40"
            >
              Précédente
            </button>

            <button
              disabled={flashcardIndex >= mistakeSigns.length - 1}
              onClick={() => {
                playTapSound(soundEnabled);
                setFlashcardIndex((prev) => Math.min(mistakeSigns.length - 1, prev + 1));
                setShowAnswer(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-500"
            >
              Suivante
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal pour vider la liste de révision */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => {
              playTapSound(soundEnabled);
              setShowConfirmClear(false);
            }}
          />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 z-10 animate-scale-up">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Vider la liste de révision ?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tous les panneaux seront retirés de la liste de révision. Vos niveaux de maîtrise et votre progression globale seront conservés.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  playTapSound(soundEnabled);
                  setShowConfirmClear(false);
                }}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
