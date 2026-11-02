import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navbar, TabType } from './components/Navbar';
import { CoursView } from './components/CoursView';
import { QuizView } from './components/QuizView';
import { RevisionView } from './components/RevisionView';
import { StatsView } from './components/StatsView';
import { OfflineBanner } from './components/OfflineBanner';
import { SplashScreen } from './components/SplashScreen';
import { CategoryId, UserStats } from './types/signs';
import {
  loadStats,
  saveStats,
  recordSignAnswer,
  saveQuizResult,
  resetAllStats,
  loadSettings,
  saveSettings,
  AppSettings,
} from './utils/storage';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('cours');
  const [stats, setStats] = useState<UserStats>(loadStats);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [quizCategoryPreset, setQuizCategoryPreset] = useState<CategoryId | undefined>(undefined);
  const [quizPresetMode, setQuizPresetMode] = useState<'standard' | 'marathon' | 'revision' | 'category' | undefined>(undefined);
  const [quizPresetSignIds, setQuizPresetSignIds] = useState<number[] | undefined>(undefined);

  // Apply dark mode class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveSettings(settings);
  }, [settings]);

  // Sync stats when updated
  const handleUpdateStats = (newStats: UserStats) => {
    setStats(newStats);
    saveStats(newStats);
  };

  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      saveSettings(next);
      return next;
    });
  };

  const handleRecordAnswer = (signId: number, isCorrect: boolean) => {
    const updated = recordSignAnswer(signId, isCorrect);
    setStats(updated);
  };

  const handleSaveQuizResult = (
    score: number,
    total: number,
    mode: 'standard' | 'marathon' | 'revision' | 'category',
    category?: CategoryId
  ) => {
    const updated = saveQuizResult(score, total, mode, category);
    setStats(updated);
  };

  const handleResetStats = () => {
    const fresh = resetAllStats();
    setStats(fresh);
  };

  const handleStartQuizWithCategory = (category?: CategoryId) => {
    setQuizCategoryPreset(category);
    setQuizPresetMode('category');
    setQuizPresetSignIds(undefined);
    setCurrentTab('quiz');
  };

  const handleStartRevisionQuiz = (mistakeIds: number[]) => {
    setQuizPresetMode('revision');
    setQuizPresetSignIds(mistakeIds);
    setQuizCategoryPreset(undefined);
    setCurrentTab('quiz');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Animated Entrance Splash Screen */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Top Header */}
      <Header
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        activeMistakesCount={stats.mistakeIds.length}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pt-4 pb-24">
        {currentTab === 'cours' && (
          <CoursView
            stats={stats}
            onUpdateStats={handleUpdateStats}
            onStartQuizWithCategory={handleStartQuizWithCategory}
            soundEnabled={settings.soundEnabled}
          />
        )}

        {currentTab === 'quiz' && (
          <QuizView
            stats={stats}
            onRecordAnswer={handleRecordAnswer}
            onSaveQuizResult={handleSaveQuizResult}
            onSwitchToRevision={() => setCurrentTab('revision')}
            presetCategory={quizCategoryPreset}
            presetMode={quizPresetMode}
            presetSignIds={quizPresetSignIds}
            soundEnabled={settings.soundEnabled}
            hapticsEnabled={settings.hapticsEnabled}
          />
        )}

        {currentTab === 'revision' && (
          <RevisionView
            stats={stats}
            onUpdateStats={handleUpdateStats}
            onRecordAnswer={handleRecordAnswer}
            onStartRevisionQuiz={handleStartRevisionQuiz}
            onSwitchToQuiz={() => {
              setQuizPresetMode(undefined);
              setQuizPresetSignIds(undefined);
              setCurrentTab('quiz');
            }}
            soundEnabled={settings.soundEnabled}
          />
        )}

        {currentTab === 'stats' && (
          <StatsView
            stats={stats}
            settings={settings}
            onResetStats={handleResetStats}
            soundEnabled={settings.soundEnabled}
          />
        )}
      </main>

      {/* Offline Connectivity Banner */}
      <OfflineBanner />

      {/* Fixed Mobile Bottom Navbar */}
      <Navbar
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        mistakesCount={stats.mistakeIds.length}
        soundEnabled={settings.soundEnabled}
      />
    </div>
  );
}
