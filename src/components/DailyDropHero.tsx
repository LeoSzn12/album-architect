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
    <div className="w-full relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0e0e12]/90 p-6 md:p-8 shadow-2xl backdrop-blur-2xl mb-8 group hover:border-white/20 transition-all">
      {/* Subtle Specular Top Sheen */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div className="flex flex-col gap-2 max-w-xl">
          {/* Tagline bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              {dailyTheme.subtitle} • {todaySeed}
            </span>

            {dailyStreak > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {dailyStreak} Day Streak 🔥
              </span>
            )}

            {isCompletedToday && (
              <span className="px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                Completed Today
              </span>
            )}
          </div>

          {/* Title & Description */}
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            {dailyTheme.title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {dailyTheme.description} Everyone gets identical 5-card pools. Compete globally for today&apos;s crown!
          </p>
        </div>

        {/* Action Button */}
        <div className="w-full md:w-auto flex sm:flex-col items-center gap-2">
          <button
            onClick={handlePlayDaily}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-black text-sm shadow-xl hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isCompletedToday ? 'Replay Today’s Drop' : 'Play Today’s Drop'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
          <span className="hidden sm:block text-[10px] text-zinc-500 text-center uppercase tracking-widest font-bold">
            Resets at Midnight
          </span>
        </div>
      </div>
    </div>
  );
};
