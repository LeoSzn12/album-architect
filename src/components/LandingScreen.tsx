'use client';

import React from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { Disc3, Zap, Trophy, Swords, ChevronRight } from 'lucide-react';
import { playDraftLockSound } from '@/lib/audioEngine';

interface LandingScreenProps {
  onStart: () => void;
  onOpenFriendsModal: () => void;
  onScrollToLeaderboard: () => void;
}

/**
 * First-time experience screen.
 * Shows only when the player has not yet started a draft.
 * Goal: feel like a sport draft lobby — not a settings dashboard.
 */
export const LandingScreen: React.FC<LandingScreenProps> = ({
  onStart,
  onOpenFriendsModal,
  onScrollToLeaderboard,
}) => {
  const { audioEnabled, gameMode, slots } = useDraftStore();
  const projectLabel = gameMode === 'draft' ? 'Draft' : gameMode === 'ep' ? 'EP' : 'Album';
  const isBuilder = gameMode !== 'draft';
  const startLabel = gameMode === 'draft' ? 'Start Draft' : `Start ${projectLabel} Builder`;

  const handleStart = () => {
    playDraftLockSound(audioEnabled);
    onStart();
  };

  return (
    <div className="w-full flex flex-col items-center gap-8 py-8 px-4">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center gap-4 max-w-2xl">
        {/* Animated Logo */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-500 animate-pulse opacity-40 blur-xl" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-purple-900/60 border border-purple-400/20">
            <Disc3 className="w-10 h-10 text-white animate-spin-slow" />
          </div>
        </div>

        <div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-wider bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm leading-tight">
            TRACKDRAFT
          </h1>
          <p className="text-lg font-bold text-gray-300 mt-2 tracking-wide">
          {isBuilder ? `${projectLabel} Builder` : 'Fantasy Music Draft Game'}
          </p>
        </div>

        <p className="text-base text-gray-400 leading-relaxed max-w-lg">
          {isBuilder ? (
            <>Build a <span className="text-white font-bold">{slots.length}-track {projectLabel}</span> across curated positions. Review the arc, reorder the final sequence, and submit when the project is ready.</>
          ) : (
            <>Draft <span className="text-white font-bold">7 tracks</span> across curated slots. Read the A&R logic, beat the AI, and turn your tracklist into a shareable project.</>
          )}
        </p>

        {/* Primary CTA */}
        <button
          onClick={handleStart}
          className="mt-2 px-10 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-extrabold text-lg rounded-2xl shadow-2xl shadow-purple-900/50 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-3"
        >
          <Zap className="w-5 h-5 text-amber-300" />
          <span>{startLabel}</span>
          <ChevronRight className="w-5 h-5 opacity-70" />
        </button>
      </div>

      {/* Rules Summary */}
      <div className="w-full max-w-2xl bg-gray-900/80 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-purple-400 mb-4">
          {isBuilder ? `How to build your ${projectLabel}` : 'How to Draft'}
        </h2>
        <ol className="flex flex-col gap-3">
          {[
            {
              num: '1',
              title: isBuilder ? `Fill each ${projectLabel.toLowerCase()} position` : 'Pick a track each round',
              desc: isBuilder
                ? `${slots.length} positions guide the arc from opener to closer. Album Builder also marks the three acts.`
                : '7 rounds. Each slot has a clear role: Intro, Lead Single, Peak, Emotional Turn, Risk, Resolution.',
            },
            {
              num: '2',
              title: 'Manage your artists',
              desc: 'Having the same solo artist on 2+ tracks costs penalty points. Featured guests are exempt.',
            },
            {
              num: '3',
              title: 'Use rerolls wisely',
              desc: 'Not feeling the 5 recommendations? Burn a reroll token for a fresh pool.',
            },
            {
              num: '4',
              title: isBuilder ? 'Review, reorder, then submit' : 'Get your score',
              desc: isBuilder
                ? 'Your build saves locally as you go. Use the tracklist arrows to set order before the final A&R review.'
                : 'Seven weighted categories explain fit, flow, narrative, variety, energy, taste, and replay value.',
            },
          ].map((rule) => (
            <li key={rule.num} className="flex items-start gap-4">
              <span className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-800 text-purple-300 text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                {rule.num}
              </span>
              <div>
                <span className="text-sm font-bold text-white">{rule.title}</span>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{rule.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Secondary Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onOpenFriendsModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-950/80 to-purple-950/80 hover:from-pink-900 hover:to-purple-900 border border-pink-700/60 text-pink-200 font-bold text-sm flex items-center gap-2 transition cursor-pointer"
        >
          <Swords className="w-4 h-4 text-pink-400" />
          <span>1v1 Challenge</span>
        </button>

        <button
          onClick={onScrollToLeaderboard}
          className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-amber-300 font-bold text-sm flex items-center gap-2 transition cursor-pointer"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Leaderboard</span>
        </button>
      </div>
    </div>
  );
};
