'use client';

import React from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { Disc3, Zap, Trophy, Swords, ChevronRight, BookOpen, Check, DollarSign, Disc } from 'lucide-react';
import { playDraftLockSound, playHoverSound } from '@/lib/audioEngine';
import { DailyDropHero } from './DailyDropHero';
import { CATEGORIES } from '@/lib/firstWeek/categories';
import type { ChallengeTheme } from '@/types/draft';

interface LandingScreenProps {
  onStart: (theme?: ChallengeTheme) => void;
  onDailyStarted: () => void;
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
  onDailyStarted,
  onOpenFriendsModal,
  onScrollToLeaderboard,
  onOpenHowToPlay,
}) => {
  const { audioEnabled, gameMode, slots, setGameMode, challengeTheme } = useDraftStore();
  const projectLabel = gameMode === 'draft' ? 'Draft' : gameMode === 'ep' ? 'EP' : gameMode === 'budget' ? '$15 Budget' : 'Album';
  const isBuilder = gameMode !== 'draft';
  const [category, setCategory] = React.useState<ChallengeTheme>(
    () => (CATEGORIES.some((item) => item.id === challengeTheme) ? challengeTheme : 'standard'),
  );
  const categoryLabel = CATEGORIES.find((item) => item.id === category)?.label ?? 'Anything goes';
  const startLabel = category === 'standard' ? 'Draft an album' : `Draft a ${categoryLabel} album`;

  const handleStart = () => {
    playDraftLockSound(audioEnabled);
    onStart(category);
  };

  return (
    <div className="w-full flex flex-col items-center gap-8 py-6 sm:py-10">
      {/* Hero Section */}
      <section aria-labelledby="landing-title" className="flex max-w-3xl flex-col items-center gap-5 text-center">
        {/* Apple Music Style Monogram Icon */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-rose-600 via-rose-700 to-zinc-950 shadow-2xl shadow-rose-950/40">
            <Disc3 className="w-10 h-10 text-white animate-spin-slow" />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-rose-400">First Week</p>
          <h1 id="landing-title" className="text-5xl font-black leading-[1.05] text-white sm:text-7xl tracking-tight">
            Draft it. Drop it.
            <br /><span className="text-rose-400">See how it sells.</span>
          </h1>
        </div>

        <p className="max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
          {isBuilder ? (
            <>Build a <span className="text-white font-bold">{slots.length}-track {projectLabel}</span> from real songs, then drop it and see your first-week number.</>
          ) : (
            <>Pick <span className="font-bold text-white">7 songs</span> against a rival who drafts from the same pool. Then drop the album and find out how many you sell in week one.</>
          )}
        </p>

        <fieldset className="mt-1 w-full text-left">
          <legend className="mb-3 w-full text-center text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Pick a category</legend>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={category === item.id}
                title={item.blurb}
                onClick={() => {
                  playHoverSound(audioEnabled);
                  setCategory(item.id);
                }}
                className={`min-h-[40px] cursor-pointer rounded-full border px-4 py-2 text-sm font-bold transition active:scale-95 ${
                  category === item.id
                    ? 'border-white bg-white text-black'
                    : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/30 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <details className="w-full">
          <summary className="cursor-pointer text-center text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 hover:text-zinc-300">
            More formats
          </summary>
        <fieldset className="mt-3 grid w-full grid-cols-2 gap-3 text-left sm:grid-cols-4">
          <legend className="sr-only">Choose your format</legend>
          {([
            { id: 'draft', name: 'Draft Battle', detail: '7 picks · vs AI', icon: Swords },
            { id: 'ep', name: 'EP Builder', detail: 'A tight, focused project', icon: Disc },
            { id: 'album', name: 'Album Builder', detail: 'Build the full story', icon: Disc3 },
            { id: 'budget', name: '$15 Budget', detail: 'Make every dollar count', icon: DollarSign },
          ] as const).map(({ id, name, detail, icon: Icon }) => (
            <button key={id} type="button" aria-pressed={gameMode === id} onClick={() => setGameMode(id)}
              className={`relative cursor-pointer rounded-2xl border p-4 transition ${gameMode === id ? 'border-rose-400/70 bg-rose-400/10 shadow-lg shadow-rose-950/20' : 'border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]'}`}>
              <Icon aria-hidden="true" className={`mb-4 h-5 w-5 ${gameMode === id ? 'text-rose-400' : 'text-zinc-400'}`} />
              {gameMode === id && <Check aria-hidden="true" className="absolute right-3 top-3 h-4 w-4 text-rose-400" />}
              <span className="block text-sm font-bold text-white">{name}</span>
              <span className="mt-1 block text-xs leading-5 text-zinc-400">{detail}</span>
            </button>
          ))}
        </fieldset>
        </details>

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
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">No account needed · Tap any song to hear a snippet</p>
      </section>

      <div className="w-full max-w-3xl"><DailyDropHero onStart={onDailyStarted} /></div>

      {/* Rules Summary */}
      <section aria-labelledby="how-to-play" className="w-full max-w-3xl rounded-3xl border border-white/[0.08] bg-[#0e0e12]/80 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
          <h2 id="how-to-play" className="text-sm font-extrabold uppercase tracking-[0.2em] text-zinc-300">
            {isBuilder ? `How to build your ${projectLabel}` : 'How First Week works'}
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
              title: isBuilder ? `Fill each ${projectLabel.toLowerCase()} position` : 'Pick a song each round',
              desc: isBuilder
                ? `${slots.length} positions guide the arc from opener to closer. Tap a cover to hear the snippet first.`
                : 'Each round has a role: opener, lead single, peak, emotional turn, risk, closer. Your rival picks first every other round.',
            },
            {
              num: '2',
              title: 'Play your rule cards',
              desc: 'Every draft deals one or two rule cards, like No Repeats or Sleeper Pick. Meet them for bonus sales.',
            },
            {
              num: '3',
              title: 'Drop the album',
              desc: 'Your album gets a first-week number and a range. Quality, big songs, your lead single and the rules all count.',
            },
            {
              num: '4',
              title: 'Outsell your friends',
              desc: "Beat your rival, climb the all-time ladder and send Today's Drop to friends. Everyone gets the same songs.",
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
