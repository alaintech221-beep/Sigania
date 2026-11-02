export type CategoryId =
  | 'danger'
  | 'interdiction'
  | 'obligation'
  | 'priorite'
  | 'indication'
  | 'direction'
  | 'panonceau'
  | 'zone'
  | 'feu'
  | 'marquage'
  | 'agent';

export type DifficultyLevel = 'facile' | 'moyen' | 'difficile';

export interface RoadSign {
  id: number;
  code: string;
  nom: string;
  signification: string;
  categorie: CategoryId;
  difficulte?: DifficultyLevel;
  imageUrl: string;
  regle: string;
  astuce?: string;
}

export type MasteryLevel = 0 | 1 | 2 | 3;
export type MasteryLabel = 'Nouveau' | 'En apprentissage' | 'Bien connu' | 'Maîtrisé';

export interface MasteryLevelConfig {
  level: MasteryLevel;
  label: MasteryLabel;
  description: string;
  color: string;
  dotBg: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
}

export const MASTERY_LEVELS: Record<MasteryLevel, MasteryLevelConfig> = {
  0: {
    level: 0,
    label: 'Nouveau',
    description: 'Pas encore vu ou à réviser',
    color: '#94a3b8',
    dotBg: 'bg-slate-400 dark:bg-slate-500',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-600 dark:text-slate-300',
    borderColor: 'border-slate-300 dark:border-slate-700',
  },
  1: {
    level: 1,
    label: 'En apprentissage',
    description: 'En cours d’acquisition (1 bonne réponse)',
    color: '#f59e0b',
    dotBg: 'bg-amber-500',
    badgeBg: 'bg-amber-500/10',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/30',
  },
  2: {
    level: 2,
    label: 'Bien connu',
    description: 'Bonne maîtrise (2 bonnes réponses)',
    color: '#3b82f6',
    dotBg: 'bg-blue-500',
    badgeBg: 'bg-blue-500/10',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  3: {
    level: 3,
    label: 'Maîtrisé',
    description: 'Totalement acquis et réflexe',
    color: '#10b981',
    dotBg: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500/10',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
};

export interface SignProgress {
  correctCount: number;
  wrongCount: number;
  lastAnswered?: string;
  mastered: boolean;
  level?: MasteryLevel;
  consecutiveCorrectInRevision?: number;
}

export interface QuizResultRecord {
  id: string;
  date: string;
  score: number;
  total: number;
  mode: 'standard' | 'marathon' | 'revision' | 'category';
  category?: CategoryId;
}

export interface UserStats {
  mistakeIds: number[];
  progressBySign: Record<number, SignProgress>;
  history: QuizResultRecord[];
  streakDays: number;
  lastActiveDate: string;
}

export interface CategoryInfo {
  id: CategoryId;
  codePrefix: string;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconType: string;
}
