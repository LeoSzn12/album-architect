'use client';

import React from 'react';
import { Calendar, Flame, ArrowRight, Trophy, Sparkles, Zap } from 'lucide-react';
import { useDraftStore } from '@/store/useDraftStore';
import { getDailySeed, getDailyTheme } from '@/lib/dailyDrop';
import { playDraftLockSound } from '@/lib/audioEngine';

interface DailyDropHeroProps {
  onStart: () => void;
}

export const DailyDropHero: React.FC<DailyDropHeroProps> = ({ onStart }) => {
  const { dailyStreak, lastDailyCompletedDate, startDailyDrop, audioEnabled } = useDraftStore();

  const todaySeed = getDailySeed();
  const dailyTheme = getDailyTheme();
  const isCompletedToday = lastDailyCompletedDate === todaySeed;

  const handlePlayDaily = () => {
    playDraftLockSound(audioEnabled);
    startDailyDrop();
    onStart();
  };

  return (
    <div className="w-full relative overflow-hidden rounded-3xl border border-purple-500/40 bg-gradient-to-r from-purple-950/70 via-gray-900 to-indigo-950/70 p-6 md:p-8 shadow-2xl backdrop-blur-md mb-8 group hover:border-purple-400/60 transition-all">
      {/* Decorative ambient glows */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-purple-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/30 transition-all" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div className="flex flex-col gap-2 max-w-xl">
          {/* Tagline bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              {dailyTheme.subtitle} • {todaySeed}
            </span>

            {dailyStreak > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {dailyStreak} Day Streak 🔥
              </span>
            )}

            {isCompletedToday && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                Completed Today
              </span>
            )}
          </div>

          {/* Title & Description */}
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            {dailyTheme.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            {dailyTheme.description} Everyone gets identical 5-card pools. Compete globally for today's crown!
          </p>
        </div>

        {/* Action Button */}
        <div className="w-full md:w-auto flex sm:flex-col items-center gap-2">
          <button
            onClick={handlePlayDaily}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-black text-sm shadow-xl shadow-purple-900/40 hover:shadow-purple-900/60 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isCompletedToday ? 'Replay Today’s Drop' : 'Play Today’s Drop'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="hidden sm:block text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
            Resets at Midnight
          </span>
        </div>
      </div>
    </div>
  );
};
