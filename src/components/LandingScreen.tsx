'use client';

import React from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { Disc3, Zap, Trophy, Swords, ChevronRight, BookOpen } from 'lucide-react';
import { playDraftLockSound, playHoverSound } from '@/lib/audioEngine';
import { DailyDropHero } from './DailyDropHero';

interface LandingScreenProps {
  onStart: () => void;
  onOpenFriendsModal: () => void;
  onScrollToLeaderboard: () => void;
  onOpenHowToPlay?: () => void;
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
  onOpenHowToPlay,
}) => {
  const { audioEnabled, gameMode, slots } = useDraftStore();
  const projectLabel = gameMode === 'draft' ? 'Draft' : gameMode === 'ep' ? 'EP' : gameMode === 'budget' ? '$15 Budget' : 'Album';
  const isBuilder = gameMode !== 'draft';
  const startLabel = gameMode === 'draft' ? 'Start Draft' : `Start ${projectLabel} Builder`;

  const handleStart = () => {
    playDraftLockSound(audioEnabled);
    onStart();
  };

  return (
    <div className="w-full flex flex-col items-center gap-10 px-4 py-10 sm:py-14">
      {/* The Daily Drop Hero Banner */}
      <div className="w-full max-w-3xl">
        <DailyDropHero onStart={onStart} />
      </div>

      {/* Hero Section */}
      <section aria-labelledby="landing-title" className="flex max-w-3xl flex-col items-center gap-5 text-center">
        {/* Apple Music Style Monogram Icon */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-rose-600 via-rose-700 to-zinc-950 shadow-2xl shadow-rose-950/40">
            <Disc3 className="w-10 h-10 text-white animate-spin-slow" />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-zinc-400">A&R playground for people with opinions</p>
          <h1 id="landing-title" className="text-5xl font-black leading-tight text-white sm:text-7xl tracking-tight">
            TRACKDRAFT
          </h1>
          <p className="mt-3 text-xl font-bold tracking-tight text-zinc-200">
            {isBuilder ? `${projectLabel} Builder` : 'Curate the project. Defend the sequence.'}
          </p>
        </div>

        <p className="max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
          {isBuilder ? (
            <>Build a <span className="text-white font-bold">{slots.length}-track {projectLabel}</span> across curated positions. Review the arc, reorder the final sequence, and submit when the project is ready.</>
          ) : (
            <>Draft <span className="font-bold text-white">7 tracks</span> from a constrained pool. Make the safe pick, find the left turn, and see whether your sequence beats the AI.</>
          )}
        </p>

        {/* Primary & Secondary Hero CTAs */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleStart}
            className="flex min-h-14 cursor-pointer items-center gap-3 rounded-full bg-white hover:bg-zinc-200 px-8 py-4 text-base sm:text-lg font-black text-black shadow-2xl transition-all hover:scale-102 active:scale-98"
          >
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>{startLabel}</span>
            <ChevronRight className="w-5 h-5 opacity-70" />
          </button>

          {onOpenHowToPlay && (
            <button
              onClick={() => {
                playHoverSound(audioEnabled);
                onOpenHowToPlay();
              }}
              className="flex min-h-14 cursor-pointer items-center gap-2.5 rounded-full border border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.12] px-6 py-4 text-base font-bold text-white transition active:scale-95 shadow-lg"
            >
              <BookOpen className="w-5 h-5 text-zinc-300" />
              <span>How to Play</span>
            </button>
          )}
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">No account or streaming login required</p>
      </section>

      {/* Rules Summary */}
      <section aria-labelledby="how-to-play" className="w-full max-w-3xl rounded-3xl border border-white/[0.08] bg-[#0e0e12]/80 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
          <h2 id="how-to-play" className="text-sm font-extrabold uppercase tracking-[0.2em] text-zinc-300">
            {isBuilder ? `How to build your ${projectLabel}` : 'How to Draft'}
          </h2>
          {onOpenHowToPlay && (
            <button
              onClick={() => {
                playHoverSound(audioEnabled);
                onOpenHowToPlay();
              }}
              className="text-xs font-bold text-white hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Full Rulebook & Strategies</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <ol className="flex flex-col gap-3.5">
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
              <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.06] text-xs font-black text-white">
                {rule.num}
              </span>
              <div>
                <span className="text-sm font-bold text-white">{rule.title}</span>
                <p className="mt-0.5 text-sm leading-6 text-zinc-400">{rule.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Secondary Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onOpenHowToPlay && (
          <button
            onClick={() => {
              playHoverSound(audioEnabled);
              onOpenHowToPlay();
            }}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-5 py-2.5 text-sm font-bold text-zinc-300 hover:text-white transition active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-zinc-400" />
            <span>How to Play</span>
          </button>
        )}

        <button
          onClick={onOpenFriendsModal}
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-5 py-2.5 text-sm font-bold text-zinc-300 hover:text-white transition active:scale-95"
        >
          <Swords className="w-4 h-4 text-zinc-400" />
          <span>1v1 Challenge</span>
        </button>

        <button
          onClick={onScrollToLeaderboard}
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-5 py-2.5 text-sm font-bold text-zinc-300 hover:text-white transition active:scale-95"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Leaderboard</span>
        </button>
      </div>
    </div>
  );
};
