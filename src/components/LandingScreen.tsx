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
    <div className="w-full flex flex-col items-center gap-10 px-4 py-10 sm:py-14">
      {/* Hero Section */}
      <section aria-labelledby="landing-title" className="flex max-w-3xl flex-col items-center gap-5 text-center">
        {/* Animated Logo */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-2 rounded-3xl border border-fuchsia-300/30 bg-fuchsia-500/10" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-fuchsia-300/30 bg-gradient-to-br from-fuchsia-600 to-slate-900 shadow-xl shadow-fuchsia-950/40">
            <Disc3 className="w-10 h-10 text-white animate-spin-slow" />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-300/80">A&R playground for people with opinions</p>
          <h1 id="landing-title" className="font-display text-5xl font-black leading-tight text-white sm:text-7xl">
            TRACKDRAFT
          </h1>
          <p className="mt-3 text-xl font-bold tracking-tight text-slate-200">
            {isBuilder ? `${projectLabel} Builder` : 'Curate the project. Defend the sequence.'}
          </p>
        </div>

        <p className="max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
          {isBuilder ? (
            <>Build a <span className="text-white font-bold">{slots.length}-track {projectLabel}</span> across curated positions. Review the arc, reorder the final sequence, and submit when the project is ready.</>
          ) : (
            <>Draft <span className="font-bold text-white">7 tracks</span> from a constrained pool. Make the safe pick, find the left turn, and see whether your sequence beats the AI.</>
          )}
        </p>

        {/* Primary CTA */}
        <button
          onClick={handleStart}
          className="mt-2 flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-cyan-500 px-10 py-4 text-lg font-extrabold text-white shadow-xl shadow-fuchsia-950/40 transition-transform hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0"
        >
          <Zap className="w-5 h-5 text-amber-300" />
          <span>{startLabel}</span>
          <ChevronRight className="w-5 h-5 opacity-70" />
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">No account or provider connection required</p>
      </section>

      {/* Rules Summary */}
      <section aria-labelledby="how-to-play" className="w-full max-w-3xl rounded-[1.75rem] border border-slate-700/70 bg-slate-900/70 p-6 shadow-xl shadow-black/10 backdrop-blur-sm sm:p-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b border-slate-700/70 pb-4">
          <h2 id="how-to-play" className="text-sm font-extrabold uppercase tracking-[0.2em] text-fuchsia-300">
          {isBuilder ? `How to build your ${projectLabel}` : 'How to Draft'}
          </h2>
          <span className="text-xs font-semibold text-slate-500">Four moves, one finished project</span>
        </div>
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
              <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-fuchsia-500/50 bg-fuchsia-950/40 text-xs font-extrabold text-fuchsia-200">
                {rule.num}
              </span>
              <div>
                <span className="text-sm font-bold text-slate-100">{rule.title}</span>
                <p className="mt-0.5 text-sm leading-6 text-slate-400">{rule.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Secondary Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onOpenFriendsModal}
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-pink-500/50 bg-pink-950/30 px-5 py-2.5 text-sm font-bold text-pink-100 transition hover:-translate-y-0.5 hover:bg-pink-900/50"
        >
          <Swords className="w-4 h-4 text-pink-400" />
          <span>1v1 Challenge</span>
        </button>

        <button
          onClick={onScrollToLeaderboard}
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-amber-400/40 bg-slate-900/80 px-5 py-2.5 text-sm font-bold text-amber-200 transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Leaderboard</span>
        </button>
      </div>
    </div>
  );
};
