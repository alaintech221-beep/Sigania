import React, { useState, useEffect, useMemo } from 'react';
import { RoadSign, CategoryId, UserStats, MASTERY_LEVELS } from '../types/signs';
import { ROAD_SIGNS, CATEGORIES } from '../data/signs';
import { SignImage } from './SignImage';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
  Sparkles,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  playCorrectSound,
  playWrongSound,
  playFanfareSound,
  playTapSound,
  triggerHaptic,
  speakFrench,
} from '../utils/audio';
import { getSignMasteryLevel } from '../utils/storage';

interface QuizViewProps {
  stats: UserStats;
  onRecordAnswer: (signId: number, isCorrect: boolean) => void;
  onSaveQuizResult: (
    score: number,
    total: number,
    mode: 'standard' | 'marathon' | 'revision' | 'category',
    category?: CategoryId
  ) => void;
  onSwitchToRevision: () => void;
  presetCategory?: CategoryId;
  presetMode?: 'standard' | 'marathon' | 'revision' | 'category';
  presetSignIds?: number[];
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export type QuizMode = 'standard' | 'marathon' | 'category' | 'revision';

function getSignWeight(sign: RoadSign, stats: UserStats): number {
  const level = getSignMasteryLevel(stats.progressBySign[sign.id]);
  // Lower level signs (Nouveau: 8, En apprentissage: 5) are proposed significantly more often
  let weight = level === 0 ? 8 : level === 1 ? 5 : level === 2 ? 2 : 1;
  if (stats.mistakeIds.includes(sign.id)) {
    weight += 6;
  }
  return weight;
}

function selectWeightedQuizPool(candidates: RoadSign[], count: number, stats: UserStats): RoadSign[] {
  if (candidates.length <= count) {
    return [...candidates].sort((a, b) => {
      const wa = getSignWeight(a, stats);
      const wb = getSignWeight(b, stats);
      return wb - wa + (Math.random() - 0.5) * 1.5;
    });
  }

  const pool = [...candidates];
  const selected: RoadSign[] = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const weights = pool.map((s) => getSignWeight(s, stats));
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    let rand = Math.random() * totalWeight;

    let chosenIdx = 0;
    for (let j = 0; j < pool.length; j++) {
      rand -= weights[j];
      if (rand <= 0) {
        chosenIdx = j;
        break;
      }
    }

    selected.push(pool[chosenIdx]);
    pool.splice(chosenIdx, 1);
  }

  return selected;
}

export const QuizView: React.FC<QuizViewProps> = ({
  stats,
  onRecordAnswer,
  onSaveQuizResult,
  onSwitchToRevision,
  presetCategory,
  presetMode,
  presetSignIds,
  soundEnabled,
  hapticsEnabled,
}) => {
  const [inQuiz, setInQuiz] = useState(false);
  const [quizPool, setQuizPool] = useState<RoadSign[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [currentChoices, setCurrentChoices] = useState<RoadSign[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [sessionMistakes, setSessionMistakes] = useState<RoadSign[]>([]);
  const [activeMode, setActiveMode] = useState<QuizMode>('standard');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>(presetCategory || 'danger');

  // Start a new quiz session with weighted selection favoring lower mastery levels
  const startQuiz = (mode: QuizMode, category?: CategoryId, specificIds?: number[]) => {
    setActiveMode(mode);
    let finalPool: RoadSign[] = [];

    if (mode === 'revision') {
      const idsToRevise = specificIds && specificIds.length > 0 ? specificIds : stats.mistakeIds;
      const signs = ROAD_SIGNS.filter((s) => idsToRevise.includes(s.id));
      // Prioritize lower level signs (level 0 then 1 then 2)
      finalPool = [...signs].sort((a, b) => {
        const lvlA = getSignMasteryLevel(stats.progressBySign[a.id]);
        const lvlB = getSignMasteryLevel(stats.progressBySign[b.id]);
        return lvlA - lvlB;
      });
    } else if (mode === 'category' && category) {
      const catSigns = ROAD_SIGNS.filter((s) => s.categorie === category);
      finalPool = selectWeightedQuizPool(catSigns, Math.min(10, catSigns.length), stats);
    } else if (mode === 'marathon') {
      finalPool = [...ROAD_SIGNS].sort((a, b) => {
        const wa = getSignWeight(a, stats);
        const wb = getSignWeight(b, stats);
        return wb - wa + (Math.random() - 0.5) * 2;
      });
    } else {
      // Standard 10 questions: heavily prioritize lower mastery levels (Nouveau, En apprentissage)
      finalPool = selectWeightedQuizPool(ROAD_SIGNS, 10, stats);
    }

    setQuizPool(finalPool);
    setCurrentIndex(0);
    setScore(0);
    setSessionMistakes([]);
    setQuizFinished(false);
    setSelectedChoiceId(null);
    setIsAnswered(false);
    setInQuiz(true);

    if (finalPool.length > 0) {
      setupQuestionChoices(finalPool[0]);
    }
  };

  // Auto start revision quiz if triggered with presetMode
  useEffect(() => {
    if (presetMode === 'revision' && (presetSignIds?.length || stats.mistakeIds.length > 0) && !inQuiz) {
      startQuiz('revision', undefined, presetSignIds);
    } else if (presetCategory && !inQuiz && presetMode === 'category') {
      setSelectedCategory(presetCategory);
      startQuiz('category', presetCategory);
    }
  }, [presetMode, presetCategory, presetSignIds]);

  // Generate 4 options for a question (1 correct, 3 distractors)
  const setupQuestionChoices = (currentSign: RoadSign) => {
    // Prefer distractors from the same category to make it realistic
    const sameCatDistractors = ROAD_SIGNS.filter(
      (s) => s.id !== currentSign.id && s.categorie === currentSign.categorie
    );
    const otherDistractors = ROAD_SIGNS.filter(
      (s) => s.id !== currentSign.id && s.categorie !== currentSign.categorie
    );

    const shuffledSame = [...sameCatDistractors].sort(() => 0.5 - Math.random());
    const shuffledOther = [...otherDistractors].sort(() => 0.5 - Math.random());

    // Mix mostly same category with some others
    const chosenDistractors = [
      ...shuffledSame.slice(0, 2),
      ...shuffledOther.slice(0, 2),
    ].slice(0, 3);

    const allChoices = [currentSign, ...chosenDistractors].sort(() => 0.5 - Math.random());
    setCurrentChoices(allChoices);
  };

  const handleSelectChoice = (choice: RoadSign) => {
    if (isAnswered) return;

    const currentSign = quizPool[currentIndex];
    const isCorrect = choice.id === currentSign.id;

    setSelectedChoiceId(choice.id);
    setIsAnswered(true);

    if (isCorrect) {
      setScore((prev) => prev + 1);
      playCorrectSound(soundEnabled);
      triggerHaptic(hapticsEnabled, 'success');
      onRecordAnswer(currentSign.id, true);
    } else {
      playWrongSound(soundEnabled);
      triggerHaptic(hapticsEnabled, 'error');
      setSessionMistakes((prev) => [...prev, currentSign]);
      onRecordAnswer(currentSign.id, false);
    }
  };

  const handleNext = () => {
    playTapSound(soundEnabled);
    if (currentIndex + 1 < quizPool.length) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedChoiceId(null);
      setIsAnswered(false);
      setupQuestionChoices(quizPool[nextIndex]);
    } else {
      // Quiz completed!
      setQuizFinished(true);
      playFanfareSound(soundEnabled);
      onSaveQuizResult(
        score,
        quizPool.length,
        activeMode,
        activeMode === 'category' ? selectedCategory : undefined
      );
    }
  };

  const currentSign = quizPool[currentIndex];
  const progressPercent = quizPool.length > 0 ? ((currentIndex) / quizPool.length) * 100 : 0;

  // Render Start Screen if not in quiz
  if (!inQuiz) {
    return (
      <div className="space-y-4">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-lg shadow-blue-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-200">
              Entraînement QCM
            </span>
            <h2 className="text-2xl font-black mt-1 tracking-tight">
              Testez vos réflexes
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-blue-100 max-w-sm leading-relaxed">
              Identifiez le panneau, retenez la règle officielle et éliminez vos erreurs grâce à la répétition ciblée.
            </p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Mode Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Mode 1: Express 10 questions */}
          <button
            onClick={() => {
              playTapSound(soundEnabled);
              startQuiz('standard');
            }}
            className="flex flex-col items-start p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left group active:scale-[0.98] shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Quiz Express
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              10 questions rapides avec priorité à vos erreurs récentes.
            </p>
            <span className="mt-3 text-xs font-semibold text-blue-600 dark:text-blue-400">
              Lancer 10 QCM →
            </span>
          </button>

          {/* Mode 2: Marathon tous les panneaux */}
          <button
            onClick={() => {
              playTapSound(soundEnabled);
              startQuiz('marathon');
            }}
            className="flex flex-col items-start p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-left group active:scale-[0.98] shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Grand Chelem
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Les {ROAD_SIGNS.length} panneaux du programme complet sans exception.
            </p>
            <span className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Lancer {ROAD_SIGNS.length} QCM →
            </span>
          </button>

          {/* Mode 3: Par catégorie */}
          <div className="flex flex-col items-start p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Par Catégorie
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">
              Travaillez une famille de panneaux spécifique.
            </p>
            <div className="w-full flex gap-1 mt-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as CategoryId)}
                className="flex-1 py-1.5 px-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {Object.keys(CATEGORIES).map((catKey) => {
                  const catId = catKey as CategoryId;
                  const count = ROAD_SIGNS.filter((s) => s.categorie === catId).length;
                  if (count === 0) return null;
                  return (
                    <option key={catId} value={catId}>
                      {CATEGORIES[catId].name} ({count})
                    </option>
                  );
                })}
              </select>
              <button
                onClick={() => {
                  playTapSound(soundEnabled);
                  startQuiz('category', selectedCategory);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Go
              </button>
            </div>
          </div>
        </div>

        {/* If user has mistakes, show banner */}
        {stats.mistakeIds.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 gap-3">
            <div className="flex items-center gap-3">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-bold">
                  {stats.mistakeIds.length} panneau{stats.mistakeIds.length > 1 ? 'x' : ''} en cours de révision
                </p>
                <p className="text-[11px] text-rose-400/80">
                  2 bonnes réponses d'affilée pour les valider. Niveaux bas prioritaires.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  playTapSound(soundEnabled);
                  startQuiz('revision');
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 transition-colors shadow-sm"
              >
                Quiz Révision ({stats.mistakeIds.length})
              </button>
              <button
                onClick={onSwitchToRevision}
                className="px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-800 text-rose-600 dark:text-rose-300 text-xs font-bold shrink-0 transition-colors border border-rose-300 dark:border-rose-900"
              >
                Voir fiches
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Finished Summary Screen
  if (quizFinished) {
    const total = quizPool.length;
    const ratio = total > 0 ? score / total : 0;
    const percentage = Math.round(ratio * 100);

    let feedbackTitle = 'Bon travail !';
    let feedbackColor = 'text-blue-500';
    if (ratio === 1) {
      feedbackTitle = 'Score Parfait ! 🏆';
      feedbackColor = 'text-emerald-500';
    } else if (ratio >= 0.8) {
      feedbackTitle = 'Excellente maîtrise !';
      feedbackColor = 'text-emerald-500';
    } else if (ratio < 0.5) {
      feedbackTitle = 'Besoin de révision';
      feedbackColor = 'text-rose-500';
    }

    return (
      <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl text-center space-y-5 animate-scale-up">
        {/* Score Ring */}
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 54}
              strokeDashoffset={2 * Math.PI * 54 * (1 - ratio)}
              strokeLinecap="round"
              className={ratio >= 0.7 ? 'text-emerald-500' : 'text-blue-500'}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
              {score}/{total}
            </span>
            <span className="text-xs font-semibold text-slate-400">{percentage}%</span>
          </div>
        </div>

        <div>
          <h2 className={`text-xl font-black ${feedbackColor}`}>{feedbackTitle}</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {sessionMistakes.length === 0
              ? 'Aucune erreur commise sur cette série, félicitations !'
              : `${sessionMistakes.length} panneau(x) ont été ajoutés à vos révisions prioritaires.`}
          </p>
        </div>

        {/* Mistakes Review if any */}
        {sessionMistakes.length > 0 && (
          <div className="text-left bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>Panneaux à revoir ({sessionMistakes.length}) :</span>
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {sessionMistakes.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center p-1">
                    <SignImage
                      sign={m}
                      imageClassName="w-8 h-8 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{m.nom}</p>
                    <p className="text-[11px] text-slate-500 truncate">{m.signification}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {sessionMistakes.length > 0 && (
            <button
              onClick={() => {
                playTapSound(soundEnabled);
                onSwitchToRevision();
              }}
              className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Réviser les erreurs</span>
            </button>
          )}

          <button
            onClick={() => {
              playTapSound(soundEnabled);
              startQuiz(activeMode, selectedCategory);
            }}
            className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>Nouveau Quiz</span>
          </button>

          <button
            onClick={() => {
              playTapSound(soundEnabled);
              setInQuiz(false);
            }}
            className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors sm:col-span-2"
          >
            Retour au menu
          </button>
        </div>
      </div>
    );
  }

  // Active Question View
  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Quiz Progress & Abort header */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <button
          onClick={() => {
            playTapSound(soundEnabled);
            setInQuiz(false);
          }}
          className="hover:text-slate-700 dark:hover:text-slate-200 font-semibold"
        >
          ← Quitter le quiz
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
            {currentIndex + 1} / {quizPool.length}
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-emerald-500 font-bold tabular-nums">
            {score} pts
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-center">
        {/* Category & Mastery Badge */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span
            className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full ${
              CATEGORIES[currentSign.categorie].bgColor
            }`}
          >
            {CATEGORIES[currentSign.categorie].name}
          </span>
          {(() => {
            const currentLevel = getSignMasteryLevel(stats.progressBySign[currentSign.id]);
            const conf = MASTERY_LEVELS[currentLevel];
            return (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                style={{
                  backgroundColor: `${conf.color}18`,
                  borderColor: `${conf.color}40`,
                  color: conf.color,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: conf.color }}
                />
                <span>{conf.label}</span>
              </span>
            );
          })()}
        </div>

        {/* Big Road Sign Image Preview */}
        <div className="w-40 h-40 mx-auto my-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex items-center justify-center filter drop-shadow-md">
          <SignImage
            sign={currentSign}
            imageClassName="w-32 h-32 object-contain filter drop-shadow-md"
          />
        </div>

        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2 mb-4">
          Quel est le nom ou la signification de ce panneau ?
        </p>

        {/* 4 Choices Big Mobile Buttons */}
        <div className="space-y-2.5">
          {currentChoices.map((choice) => {
            const isSelected = selectedChoiceId === choice.id;
            const isCorrect = choice.id === currentSign.id;

            let buttonStyle =
              'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 hover:border-blue-400';

            if (isAnswered) {
              if (isCorrect) {
                buttonStyle =
                  'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30';
              } else if (isSelected && !isCorrect) {
                buttonStyle =
                  'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300';
              } else {
                buttonStyle = 'opacity-40 border-slate-200 dark:border-slate-800 text-slate-400';
              }
            }

            return (
              <button
                key={choice.id}
                disabled={isAnswered}
                onClick={() => handleSelectChoice(choice)}
                className={`w-full min-h-[52px] p-3.5 rounded-2xl border text-left font-semibold text-sm transition-all duration-150 flex items-center justify-between gap-3 active:scale-[0.99] ${buttonStyle}`}
              >
                <span className="leading-snug">{choice.nom}</span>
                {isAnswered && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Instant Explanation Feedback Sheet */}
        {isAnswered && (
          <div className="mt-5 text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-slide-up space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {selectedChoiceId === currentSign.id ? (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Exact ! Niveau +1</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-sm">
                  <XCircle className="w-4 h-4" />
                  <span>Faux ! Niveau -1 · C'était : {currentSign.nom}</span>
                </div>
              )}
              {(() => {
                const currentLevel = getSignMasteryLevel(stats.progressBySign[currentSign.id]);
                const conf = MASTERY_LEVELS[currentLevel];
                return (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                    style={{
                      backgroundColor: `${conf.color}15`,
                      color: conf.color,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: conf.color }}
                    />
                    <span>Nouveau statut : {conf.label}</span>
                  </span>
                );
              })()}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              <strong>Signification :</strong> {currentSign.signification}
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong>Règle :</strong> {currentSign.regle}
            </p>

            {currentSign.astuce && (
              <div className="flex items-start gap-1.5 pt-1 text-xs text-amber-600 dark:text-amber-400">
                <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>Astuce :</strong> {currentSign.astuce}
                </span>
              </div>
            )}

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="mt-3 w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <span>
                {currentIndex + 1 < quizPool.length ? 'Question suivante' : 'Voir les résultats'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
