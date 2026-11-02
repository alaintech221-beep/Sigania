import React from 'react';
import { BookOpen, HelpCircle, RotateCcw, BarChart3 } from 'lucide-react';
import { playTapSound } from '../utils/audio';

export type TabType = 'cours' | 'quiz' | 'revision' | 'stats';

interface NavbarProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  mistakesCount: number;
  soundEnabled: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onChangeTab,
  mistakesCount,
  soundEnabled,
}) => {
  const tabs = [
    {
      id: 'cours' as TabType,
      label: 'Cours',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'quiz' as TabType,
      label: 'Quiz',
      icon: HelpCircle,
      badge: null,
    },
    {
      id: 'revision' as TabType,
      label: 'Révision',
      icon: RotateCcw,
      badge: mistakesCount > 0 ? mistakesCount : null,
    },
    {
      id: 'stats' as TabType,
      label: 'Progrès',
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => {
                playTapSound(soundEnabled);
                onChangeTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center min-h-[44px] py-1 transition-all active:scale-95 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge !== null && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-tight mt-1 truncate">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-5 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
