import React, { useState, useMemo } from 'react';
import { RoadSign, CategoryId, UserStats, DifficultyLevel, MasteryLevel, MASTERY_LEVELS } from '../types/signs';
import { ROAD_SIGNS, CATEGORIES } from '../data/signs';
import { SignCard } from './SignCard';
import { SignDetailModal } from './SignDetailModal';
import { SignImage } from './SignImage';
import {
  Search,
  X,
  Sparkles,
  Filter,
  CheckCircle2,
  RotateCcw,
  LayoutGrid,
  List,
  ChevronRight,
} from 'lucide-react';
import { playTapSound } from '../utils/audio';
import { getSignMasteryLevel } from '../utils/storage';

interface CoursViewProps {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  onStartQuizWithCategory: (category?: CategoryId) => void;
  soundEnabled: boolean;
}

export const CoursView: React.FC<CoursViewProps> = ({
  stats,
  onUpdateStats,
  onStartQuizWithCategory,
  soundEnabled,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [selectedMastery, setSelectedMastery] = useState<MasteryLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSign, setSelectedSign] = useState<RoadSign | null>(null);

  // Bascule vue Grille / Liste mémorisée en local (grille par défaut)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try {
      const saved = localStorage.getItem('signago_cours_view_mode');
      return saved === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    playTapSound(soundEnabled);
    setViewMode(mode);
    try {
      localStorage.setItem('signago_cours_view_mode', mode);
    } catch {
      // ignore
    }
  };

  // Dynamic category list based on current dataset
  const categoriesList = useMemo(() => {
    const list: Array<{ id: CategoryId | 'all'; label: string; count: number }> = [
      { id: 'all', label: 'Tous', count: ROAD_SIGNS.length },
    ];
    
    // Order standard categories first if present
    const order: CategoryId[] = [
      'danger',
      'priorite',
      'interdiction',
      'obligation',
      'indication',
      'direction',
      'panonceau',
      'zone',
      'feu',
      'marquage',
      'agent'
    ];

    order.forEach((catId) => {
      const signsInCat = ROAD_SIGNS.filter((s) => s.categorie === catId);
      if (signsInCat.length > 0) {
        const info = CATEGORIES[catId];
        list.push({
          id: catId,
          label: info ? info.name : catId,
          count: signsInCat.length,
        });
      }
    });

    return list;
  }, []);

  // Filter logic
  const filteredSigns = useMemo(() => {
    return ROAD_SIGNS.filter((sign) => {
      const matchCategory = selectedCategory === 'all' || sign.categorie === selectedCategory;
      const matchDifficulty = selectedDifficulty === 'all' || sign.difficulte === selectedDifficulty;
      const signMastery = getSignMasteryLevel(stats.progressBySign[sign.id]);
      const matchMastery = selectedMastery === 'all' || signMastery === selectedMastery;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        sign.nom.toLowerCase().includes(q) ||
        sign.signification.toLowerCase().includes(q) ||
        sign.code.toLowerCase().includes(q) ||
        sign.regle.toLowerCase().includes(q) ||
        (sign.astuce && sign.astuce.toLowerCase().includes(q));
      return matchCategory && matchDifficulty && matchMastery && matchSearch;
    });
  }, [selectedCategory, selectedDifficulty, selectedMastery, searchQuery, stats.progressBySign]);

  const masteredCount = Object.values(stats.progressBySign).filter((p) => p.mastered).length;
  const mistakesCount = stats.mistakeIds.length;

  const handleToggleMistake = (signId: number) => {
    const isCurrentlyMistake = stats.mistakeIds.includes(signId);
    let newMistakeIds: number[];
    if (isCurrentlyMistake) {
      newMistakeIds = stats.mistakeIds.filter((id) => id !== signId);
    } else {
      newMistakeIds = [...stats.mistakeIds, signId];
    }
    const updated: UserStats = {
      ...stats,
      mistakeIds: newMistakeIds,
    };
    onUpdateStats(updated);
  };

  return (
    <div className="space-y-4">
      {/* Search & Overview Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Fiches de cours · {ROAD_SIGNS.length} panneaux
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pastille de maîtrise sur chaque fiche : Nouveau, En apprentissage, Bien connu, Maîtrisé
            </p>
          </div>

          {/* Quick Stats Pill-strip & Mode Switch */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{masteredCount} maîtrisés</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
                <RotateCcw className="w-4 h-4" />
                <span>{mistakesCount} à revoir</span>
              </span>
            </div>

            {/* Bouton de bascule Grille / Liste */}
            <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleToggleViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Affichage en grille"
                aria-label="Affichage en grille"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grille</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleViewMode('list')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Affichage en liste"
                aria-label="Affichage en liste"
              >
                <List className="w-3.5 h-3.5" />
                <span>Liste</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, code (A1a, B1, AB4...), règle..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mastery Level Quick Filter with Pastilles */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <span className="text-slate-400 font-medium text-[11px] mr-1">Maîtrise :</span>
          <button
            onClick={() => {
              playTapSound(soundEnabled);
              setSelectedMastery('all');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedMastery === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Tous
          </button>
          {([0, 1, 2, 3] as MasteryLevel[]).map((lvl) => {
            const conf = MASTERY_LEVELS[lvl];
            const isSelected = selectedMastery === lvl;
            return (
              <button
                key={lvl}
                onClick={() => {
                  playTapSound(soundEnabled);
                  setSelectedMastery(lvl);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'ring-2 ring-blue-500/50 shadow-xs'
                    : 'opacity-80 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: `${conf.color}15`,
                  color: conf.color,
                  border: `1px solid ${conf.color}40`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: conf.color }}
                />
                <span>{conf.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Horizontal Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {categoriesList.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                playTapSound(soundEnabled);
                setSelectedCategory(cat.id);
              }}
              className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Info description when category selected */}
      {selectedCategory !== 'all' && CATEGORIES[selectedCategory] && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            {CATEGORIES[selectedCategory].description}
          </p>
          <button
            onClick={() => onStartQuizWithCategory(selectedCategory)}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quiz {CATEGORIES[selectedCategory].name}</span>
          </button>
        </div>
      )}

      {/* Cards Grid */}
      {filteredSigns.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <Filter className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Aucun panneau trouvé
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Essayez un autre mot-clé ou réinitialisez le filtre.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedDifficulty('all');
            }}
            className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredSigns.map((sign) => (
            <SignCard
              key={sign.id}
              sign={sign}
              progress={stats.progressBySign[sign.id]}
              isMistake={stats.mistakeIds.includes(sign.id)}
              onSelect={setSelectedSign}
              soundEnabled={soundEnabled}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSigns.map((sign) => {
            const cat = CATEGORIES[sign.categorie];
            const level = getSignMasteryLevel(stats.progressBySign[sign.id]);
            const levelConfig = MASTERY_LEVELS[level];
            const shortCode = sign.code.replace(/\s*\([^)]*\)/g, '').trim();
            const isMistake = stats.mistakeIds.includes(sign.id);

            return (
              <div
                key={sign.id}
                onClick={() => {
                  playTapSound(soundEnabled);
                  setSelectedSign(sign);
                }}
                className="group flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 rounded-2xl transition-all cursor-pointer shadow-sm active:scale-[0.99]"
              >
                {/* Petite image à gauche */}
                <div className="w-12 h-12 shrink-0 p-1 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-center">
                  <SignImage
                    sign={sign}
                    imageClassName="w-10 h-10 object-contain filter drop-shadow-sm"
                  />
                </div>

                {/* Code et Nom au centre */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                      {shortCode}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 truncate">
                      {cat ? cat.name : sign.categorie}
                    </span>
                    {isMistake && (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                        À réviser
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {sign.nom}
                  </h3>
                </div>

                {/* Pastille de niveau de maîtrise & Flèche à droite */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
                    style={{
                      backgroundColor: `${levelConfig.color}15`,
                      borderColor: `${levelConfig.color}40`,
                      color: levelConfig.color,
                    }}
                    title={`Niveau : ${levelConfig.label}`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: levelConfig.color }}
                    />
                    <span className="text-[10px] font-bold">{levelConfig.label}</span>
                  </span>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <SignDetailModal
        sign={selectedSign}
        progress={selectedSign ? stats.progressBySign[selectedSign.id] : undefined}
        isMistake={selectedSign ? stats.mistakeIds.includes(selectedSign.id) : false}
        onClose={() => setSelectedSign(null)}
        onToggleMistake={handleToggleMistake}
        soundEnabled={soundEnabled}
      />
    </div>
  );
};
