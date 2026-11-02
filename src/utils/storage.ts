import { CategoryId, MasteryLevel, QuizResultRecord, SignProgress, UserStats } from '../types/signs';

const PRIMARY_STORAGE_KEY = 'signago_user_stats_v1';
const PREV_STORAGE_KEY = 'coderoute_user_stats_v2';

const PRIMARY_SETTINGS_KEY = 'signago_settings_v1';
const PREV_SETTINGS_KEY = 'coderoute_settings_v2';

export interface AppSettings {
  country: 'FR' | 'BE' | 'CH' | 'CA' | 'INT';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  darkMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  country: 'FR',
  soundEnabled: true,
  hapticsEnabled: true,
  darkMode: true,
};

const DEFAULT_STATS: UserStats = {
  mistakeIds: [],
  progressBySign: {},
  history: [],
  streakDays: 1,
  lastActiveDate: new Date().toISOString().slice(0, 10),
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(PRIMARY_SETTINGS_KEY) || localStorage.getItem(PREV_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(PRIMARY_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings', err);
  }
}

export function loadStats(): UserStats {
  try {
    const raw = localStorage.getItem(PRIMARY_STORAGE_KEY) || localStorage.getItem(PREV_STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw) as UserStats;
    
    // Check streak
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (parsed.lastActiveDate === yesterday) {
        parsed.streakDays = (parsed.streakDays || 0) + 1;
      } else {
        parsed.streakDays = 1;
      }
      parsed.lastActiveDate = today;
      localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(parsed));
    }
    
    return {
      mistakeIds: parsed.mistakeIds || [],
      progressBySign: parsed.progressBySign || {},
      history: parsed.history || [],
      streakDays: parsed.streakDays || 1,
      lastActiveDate: parsed.lastActiveDate || today,
    };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: UserStats): void {
  try {
    localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Error saving stats to localStorage', err);
  }
}

/**
 * Returns the mastery level (0: Nouveau, 1: En apprentissage, 2: Bien connu, 3: Maîtrisé).
 * Preserves full backwards-compatibility with previous stored stats.
 */
export function getSignMasteryLevel(progress?: SignProgress): MasteryLevel {
  if (!progress) return 0;
  if (typeof progress.level === 'number' && progress.level >= 0 && progress.level <= 3) {
    return progress.level as MasteryLevel;
  }
  // Backwards compatibility for previously saved stats
  if (progress.mastered) return 3;
  if (progress.correctCount >= 2 && progress.correctCount > progress.wrongCount) return 2;
  if (progress.correctCount > 0) return 1;
  return 0;
}

export function recordSignAnswer(signId: number, isCorrect: boolean): UserStats {
  const stats = loadStats();
  const currentProgress: SignProgress = stats.progressBySign[signId] || {
    correctCount: 0,
    wrongCount: 0,
    mastered: false,
    level: 0,
    consecutiveCorrectInRevision: 0,
  };

  const currentLevel = getSignMasteryLevel(currentProgress);
  // Une bonne réponse fait monter d'un niveau (max 3), une mauvaise fait redescendre d'un niveau (min 0)
  const newLevel: MasteryLevel = isCorrect
    ? (Math.min(3, currentLevel + 1) as MasteryLevel)
    : (Math.max(0, currentLevel - 1) as MasteryLevel);

  currentProgress.level = newLevel;
  currentProgress.mastered = newLevel === 3;

  if (isCorrect) {
    currentProgress.correctCount += 1;
    // Règle de révision : un panneau est retiré de la révision après 2 bonnes réponses d'affilée
    const wasInMistakes = stats.mistakeIds.includes(signId);
    if (wasInMistakes) {
      const streak = (currentProgress.consecutiveCorrectInRevision || 0) + 1;
      currentProgress.consecutiveCorrectInRevision = streak;
      if (streak >= 2) {
        // Retiré de la révision après 2 réussites consécutives
        stats.mistakeIds = stats.mistakeIds.filter((id) => id !== signId);
        currentProgress.consecutiveCorrectInRevision = 0;
      }
    }
  } else {
    currentProgress.wrongCount += 1;
    // Réinitialise la série de réussite consécutive
    currentProgress.consecutiveCorrectInRevision = 0;
    // Ajoute aux panneaux à réviser
    if (!stats.mistakeIds.includes(signId)) {
      stats.mistakeIds.push(signId);
    }
  }

  currentProgress.lastAnswered = new Date().toISOString();
  stats.progressBySign[signId] = currentProgress;
  saveStats(stats);
  return stats;
}

export function removeSignFromRevision(signId: number): UserStats {
  const stats = loadStats();
  stats.mistakeIds = stats.mistakeIds.filter((id) => id !== signId);
  if (stats.progressBySign[signId]) {
    stats.progressBySign[signId].consecutiveCorrectInRevision = 0;
  }
  saveStats(stats);
  return stats;
}

export function clearAllRevisionMistakes(): UserStats {
  const stats = loadStats();
  stats.mistakeIds = [];
  Object.keys(stats.progressBySign).forEach((key) => {
    const numKey = Number(key);
    if (stats.progressBySign[numKey]) {
      stats.progressBySign[numKey].consecutiveCorrectInRevision = 0;
    }
  });
  saveStats(stats);
  return stats;
}

export function saveQuizResult(
  score: number,
  total: number,
  mode: 'standard' | 'marathon' | 'revision' | 'category',
  category?: CategoryId
): UserStats {
  const stats = loadStats();
  const newRecord: QuizResultRecord = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
    score,
    total,
    mode,
    category,
  };

  stats.history = [newRecord, ...(stats.history || [])].slice(0, 30);
  saveStats(stats);
  return stats;
}

export function resetAllStats(): UserStats {
  const fresh: UserStats = {
    mistakeIds: [],
    progressBySign: {},
    history: [],
    streakDays: 1,
    lastActiveDate: new Date().toISOString().slice(0, 10),
  };
  saveStats(fresh);
  return fresh;
}
