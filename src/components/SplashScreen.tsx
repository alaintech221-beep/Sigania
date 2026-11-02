import React, { useState, useEffect } from 'react';
import { FastForward } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Start fade out at 2.1s (so it smoothly transitions into the 2.5s mark)
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2100);

    // Complete splash screen at 2.5s
    const endTimer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [onFinish]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 150);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-slate-950 via-[#0a1128] to-slate-950 text-white select-none transition-opacity duration-400 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 16px)',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}
      aria-label="Écran de bienvenue SignaGo"
    >
      {/* Top bar with Skip button */}
      <div className="w-full px-5 pt-4 flex justify-end items-center z-20">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          title="Passer l'introduction"
        >
          <span>Passer</span>
          <FastForward className="w-3.5 h-3.5 text-blue-400" />
        </button>
      </div>

      {/* Center Branding Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-6">
        {/* Animated App Icon */}
        <div className="relative mb-5 animate-splash-fade-in-up">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-50 animate-pulse" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-2.5 shadow-2xl border border-blue-500/40 flex items-center justify-center">
            <img
              src="/icon.svg"
              alt="SignaGo Icon"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>
        </div>

        {/* Title & Slogan */}
        <div className="text-center animate-splash-fade-in-up" style={{ animationDelay: '150ms' }}>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-lg flex items-center justify-center gap-1">
            <span>Signa</span>
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-400 bg-clip-text text-transparent">
              Go
            </span>
          </h1>
          <p className="mt-2 text-sm sm:text-base font-medium text-slate-300/90 tracking-wide max-w-xs sm:max-w-md mx-auto">
            Apprends les panneaux de la route
          </p>
        </div>

        {/* Decorative mini badges */}
        <div
          className="flex items-center justify-center gap-2 mt-4 animate-splash-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            Hors ligne
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Code officiel
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Quiz & Répétition
          </span>
        </div>
      </div>

      {/* Road & Driving Car Section */}
      <div className="w-full relative pb-4">
        {/* Road Structure */}
        <div className="w-full h-24 sm:h-28 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-y-2 border-slate-700/70 relative overflow-hidden shadow-2xl flex items-center">
          {/* Subtle asphalt road grain */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:12px_12px]" />

          {/* Top solid white shoulder line */}
          <div className="absolute top-2 left-0 right-0 h-1 bg-white/70" />

          {/* Center animated dashed lines (scrolling right to left) */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 overflow-hidden flex items-center">
            <div className="flex animate-road-lines whitespace-nowrap">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="inline-block w-12 sm:w-16 h-1.5 bg-white/90 rounded-sm mx-4 sm:mx-6 shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                />
              ))}
            </div>
          </div>

          {/* Bottom solid white shoulder line */}
          <div className="absolute bottom-2 left-0 right-0 h-1 bg-white/70" />

          {/* Animated Car driving left to right */}
          <div className="absolute bottom-3 left-0 animate-car-drive z-10 pointer-events-none">
            <div className="relative animate-car-bob">
              {/* Headlights beam projecting forward (to the right) */}
              <div
                className="absolute top-2.5 left-[88px] w-48 sm:w-64 h-14 bg-gradient-to-r from-amber-200/40 via-amber-100/15 to-transparent pointer-events-none"
                style={{
                  clipPath: 'polygon(0 35%, 100% 0%, 100% 100%, 0 65%)',
                }}
              />

              {/* Vector Side-View Modern Car */}
              <svg
                width="110"
                height="46"
                viewBox="0 0 110 46"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.8)]"
              >
                {/* Taillight glow (left / rear) */}
                <circle cx="8" cy="23" r="3" fill="#ef4444" />
                <circle cx="6" cy="23" r="6" fill="#ef4444" opacity="0.4" />

                {/* Car Main Body Chassis */}
                <path
                  d="M8 22C8 20 10 18 13 18L26 18L40 7C42 5 45 4 49 4L72 4C76 4 79 6 81 9L93 18L99 18C103 18 106 21 106 25L106 29C106 31 104 33 101 33L93 33C93 28 89 24 84 24C79 24 75 28 75 33L37 33C37 28 33 24 28 24C23 24 19 28 19 33L12 33C9.8 33 8 31.2 8 29L8 22Z"
                  fill="url(#car_gradient)"
                  stroke="#1e3a8a"
                  strokeWidth="1.2"
                />

                {/* Roof Highlight */}
                <path
                  d="M48 6L72 6C74.5 6 76.5 7.2 78 9.5L88 17.5L41 17.5L48 6Z"
                  fill="url(#window_reflection)"
                  opacity="0.85"
                />

                {/* Rear & Front Windows */}
                <path
                  d="M42 16.5L48 7.5H62V16.5H42Z"
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth="0.8"
                />
                <path
                  d="M65 7.5H71C73.5 7.5 75 8.5 76.5 10.5L84.5 16.5H65V7.5Z"
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth="0.8"
                />

                {/* Window glare bar */}
                <line
                  x1="49"
                  y1="9"
                  x2="55"
                  y2="15"
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.5"
                />
                <line
                  x1="68"
                  y1="9"
                  x2="76"
                  y2="15"
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.5"
                />

                {/* Door seam / accent line */}
                <line x1="63.5" y1="7" x2="63.5" y2="31" stroke="#1d4ed8" strokeWidth="1.2" />
                <rect x="58" y="20.5" width="4" height="1.2" rx="0.6" fill="#cbd5e1" />

                {/* Front Headlight (right side) */}
                <path
                  d="M98 19L105 20C105.8 20.2 106 21 106 22L99 22L98 19Z"
                  fill="#fef08a"
                  filter="drop-shadow(0 0 4px #facc15)"
                />

                {/* Wheels (Rear and Front) */}
                {/* Rear Wheel */}
                <g className="animate-spin-wheel" style={{ transformOrigin: '28px 33px' }}>
                  <circle cx="28" cy="33" r="9" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
                  <circle cx="28" cy="33" r="5.5" fill="#94a3b8" />
                  <circle cx="28" cy="33" r="2.5" fill="#1e293b" />
                  {/* Wheel spokes */}
                  <line x1="28" y1="27.5" x2="28" y2="38.5" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="22.5" y1="33" x2="33.5" y2="33" stroke="#cbd5e1" strokeWidth="1" />
                </g>

                {/* Front Wheel */}
                <g className="animate-spin-wheel" style={{ transformOrigin: '84px 33px' }}>
                  <circle cx="84" cy="33" r="9" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
                  <circle cx="84" cy="33" r="5.5" fill="#94a3b8" />
                  <circle cx="84" cy="33" r="2.5" fill="#1e293b" />
                  {/* Wheel spokes */}
                  <line x1="84" y1="27.5" x2="84" y2="38.5" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="78.5" y1="33" x2="89.5" y2="33" stroke="#cbd5e1" strokeWidth="1" />
                </g>

                {/* Gradients */}
                <defs>
                  <linearGradient id="car_gradient" x1="8" y1="4" x2="106" y2="33" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="0.5" stopColor="#2563eb" />
                    <stop offset="1" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="window_reflection" x1="48" y1="6" x2="88" y2="17.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#60a5fa" stopOpacity="0.4" />
                    <stop offset="1" stopColor="#1e3a8a" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Loading Bar */}
      <div className="w-full fixed bottom-0 left-0 right-0 z-30">
        <div className="w-full h-1 bg-slate-900 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-amber-400 animate-splash-progress rounded-full" />
        </div>
      </div>
    </div>
  );
};
