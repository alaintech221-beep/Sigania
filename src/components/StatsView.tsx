import React, { useState } from 'react';
import { UserStats, CategoryId, MasteryLevel, MASTERY_LEVELS } from '../types/signs';
import { ROAD_SIGNS, CATEGORIES } from '../data/signs';
import { AppSettings, resetAllStats, getSignMasteryLevel } from '../utils/storage';
import {
  Trophy,
  Flame,
  CheckCircle2,
  RotateCcw,
  Calendar,
  Trash2,
  Shield,
  HelpCircle,
  Award,
} from 'lucide-react';
import { playTapSound } from '../utils/audio';

interface StatsViewProps {
  stats: UserStats;
  settings: AppSettings;
  onResetStats: () => void;
  soundEnabled: boolean;
}

export const StatsView: React.FC<StatsViewProps> = ({
  stats,
  settings,
  onResetStats,
  soundEnabled,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Global calculations
  const totalSigns = ROAD_SIGNS.length;
  const masteredCount = Object.values(stats.progressBySign).filter((p) => p.mastered).length;
  const globalMasteryPercent = Math.round((masteredCount / totalSigns) * 100);

  // Breakdown by the 4 mastery levels: Nouveau, En apprentissage, Bien connu, Maîtrisé
  const countsByLevel: Record<MasteryLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  ROAD_SIGNS.forEach((sign) => {
    const lvl = getSignMasteryLevel(stats.progressBySign[sign.id]);
    countsByLevel[lvl] += 1;
  });

  let totalAttempts = 0;
  let totalCorrect = 0;
  Object.values(stats.progressBySign).forEach((p) => {
    totalAttempts += p.correctCount + p.wrongCount;
    totalCorrect += p.correctCount;
  });
  const accuracyRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  // Dynamic breakdown per category present in dataset
  const presentCategories = Array.from(new Set(ROAD_SIGNS.map((s) => s.categorie)));
  const categoryStats = presentCategories.map((catId) => {
    const catSigns = ROAD_SIGNS.filter((s) => s.categorie === catId);
    const catMastered = catSigns.filter((s) => stats.progressBySign[s.id]?.mastered).length;
    const percent = catSigns.length > 0 ? Math.round((catMastered / catSigns.length) * 100) : 0;
    return {
      id: catId,
      info: CATEGORIES[catId] || {
        id: catId,
        codePrefix: '',
        name: catId,
        description: '',
        color: '#6366f1',
        bgColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        borderColor: 'border-indigo-500/30',
        iconType: 'circle'
      },
      total: catSigns.length,
      mastered: catMastered,
      percent,
    };
  });

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Top Mastery Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Statistiques de Maîtrise
        </h2>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          {/* Mastered */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {masteredCount}/{totalSigns}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600/80 mt-0.5">
              Panneaux acquis
            </span>
          </div>

          {/* Accuracy */}
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
              {accuracyRate}%
            </span>
            <span className="text-[11px] font-semibold text-blue-600/80 mt-0.5">
              Précision QCM
            </span>
          </div>

          {/* Streak */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-amber-500 tabular-nums flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 fill-amber-500" />
              {stats.streakDays}j
            </span>
            <span className="text-[11px] font-semibold text-amber-600/80 mt-0.5">
              Série d'assiduité
            </span>
          </div>
        </div>

        {/* Global Progress Gauge */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            <span>Progression globale de l'apprentissage</span>
            <span className="font-mono text-slate-900 dark:text-white">{globalMasteryPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${globalMasteryPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Breakdown by Mastery Level */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Panneaux par Niveau de Maîtrise
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Progression par palier sur les {totalSigns} panneaux
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {totalSigns} total
          </span>
        </div>

        {/* Multi-Segment Proportion Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          {([0, 1, 2, 3] as MasteryLevel[]).map((lvl) => {
            const count = countsByLevel[lvl];
            const pct = totalSigns > 0 ? (count / totalSigns) * 100 : 0;
            const conf = MASTERY_LEVELS[lvl];
            if (pct <= 0) return null;
            return (
              <div
                key={lvl}
                className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: conf.color,
                }}
                title={`${conf.label} : ${count} (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>

        {/* 4 Level Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {([0, 1, 2, 3] as MasteryLevel[]).map((lvl) => {
            const count = countsByLevel[lvl];
            const pct = totalSigns > 0 ? Math.round((count / totalSigns) * 100) : 0;
            const conf = MASTERY_LEVELS[lvl];

            return (
              <div
                key={lvl}
                className="p-3.5 rounded-2xl border flex flex-col justify-between transition-all"
                style={{
                  backgroundColor: `${conf.color}10`,
                  borderColor: `${conf.color}35`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: conf.color }}
                  />
                  <span
                    className="text-xs font-bold truncate"
                    style={{ color: conf.color }}
                  >
                    {conf.label}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                    {count}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {pct}%
                  </span>
                </div>

                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  {conf.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown by Category */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3.5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Progression par Famille de Panneaux
        </h3>

        <div className="space-y-3">
          {categoryStats.map((c) => (
            <div key={c.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {c.info.name}
                </span>
                <span className="font-mono text-slate-500">
                  {c.mastered}/{c.total} ({c.percent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${c.percent}%`,
                    backgroundColor: c.info.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz History */}
      {stats.history && stats.history.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Historique des Quiz</span>
            <span className="text-xs font-normal text-slate-400">
              {stats.history.length} session(s)
            </span>
          </h3>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {stats.history.slice(0, 8).map((record) => {
              const ratio = record.score / record.total;
              const percent = Math.round(ratio * 100);
              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        ratio >= 0.8
                          ? 'bg-emerald-500/20 text-emerald-500'
                          : ratio >= 0.5
                          ? 'bg-blue-500/20 text-blue-500'
                          : 'bg-rose-500/20 text-rose-500'
                      }`}
                    >
                      {percent}%
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white capitalize">
                        {record.mode === 'standard'
                          ? 'Quiz Express'
                          : record.mode === 'marathon'
                          ? 'Grand Chelem'
                          : record.mode === 'revision'
                          ? 'Révision ciblée'
                          : `Catégorie ${record.category || ''}`}
                      </p>
                      <p className="text-[11px] text-slate-400">{record.date}</p>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {record.score} / {record.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reset Progress Action */}
      <div className="pt-2 text-center">
        {!showConfirmReset ? (
          <button
            onClick={() => {
              playTapSound(soundEnabled);
              setShowConfirmReset(true);
            }}
            className="text-xs font-semibold text-rose-500 hover:text-rose-600 p-2 transition-colors flex items-center justify-center gap-1.5 mx-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Réinitialiser les données de progression</span>
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 space-y-2">
            <p className="text-xs font-bold">
              Êtes-vous sûr de vouloir effacer l'historique et les statistiques ?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  playTapSound(soundEnabled);
                  onResetStats();
                  setShowConfirmReset(false);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
              >
                Confirmer l'effacement
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
