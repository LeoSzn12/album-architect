'use client';

import React from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { Disc3, Zap, Trophy, Swords, ChevronRight, Check, DollarSign, Disc } from 'lucide-react';
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

  const steps = [
    {
      title: isBuilder ? `Fill each ${projectLabel.toLowerCase()} spot` : 'Pick a song each round',
      desc: isBuilder
        ? `${slots.length} spots, opener to closer. Tap a cover to hear it first.`
        : 'Opener, lead single, peak, closer. Your rival drafts from the same pool.',
    },
    { title: 'Play your rule cards', desc: 'Meet one or two rules, like Sleeper Pick, for bonus sales.' },
    { title: 'Drop the album', desc: 'See your week-one sales and an album score out of 10.' },
    { title: 'Challenge friends', desc: 'Send a link. They get the same songs and your number to beat.' },
  ];

  return (
    <div className="w-full flex flex-col items-center gap-10 py-4 sm:py-10">
      {/* Hero */}
      <section aria-labelledby="landing-title" className="flex w-full max-w-3xl flex-col items-center gap-5 text-center">
        <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-rose-600 via-rose-700 to-zinc-950 shadow-2xl shadow-rose-950/40">
          <Disc3 className="w-8 h-8 text-white animate-spin-slow" aria-hidden="true" />
        </div>

        <h1 id="landing-title" className="text-4xl font-black leading-[1.05] text-white sm:text-6xl tracking-tight">
          Draft it. Drop it.
          <br /><span className="text-rose-400">See how it sells.</span>
        </h1>

        <p className="max-w-md text-base leading-7 text-zinc-300 sm:text-lg">
          {isBuilder ? (
            <>Build a {slots.length}-track {projectLabel} from real songs, then see your first-week number.</>
          ) : (
            <>Pick 7 real songs against a rival. Drop the album. See how many you sell in week one.</>
          )}
        </p>

        <button
          type="button"
          onClick={handleStart}
          className="flex w-full max-w-sm min-h-14 cursor-pointer items-center justify-center gap-3 rounded-full bg-white hover:bg-zinc-200 px-8 py-4 text-lg font-black text-black shadow-2xl shadow-white/5 transition-all active:scale-98"
        >
          <Zap className="w-5 h-5 text-rose-500 fill-rose-500" aria-hidden="true" />
          <span>{startLabel}</span>
          <ChevronRight className="w-5 h-5 opacity-60" aria-hidden="true" />
        </button>
        <p className="-mt-2 text-xs font-medium text-zinc-500">Free · No account · Tap any cover to hear the song</p>

        <fieldset className="w-full">
          <legend className="mb-2.5 w-full text-center text-sm font-bold text-zinc-300">Choose a category</legend>
          <div className="-mx-4 px-4 flex gap-2 overflow-x-auto scrollbar-none pb-1 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center sm:overflow-visible">
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
                className={`min-h-[44px] flex-shrink-0 cursor-pointer rounded-full border px-4 text-sm font-bold whitespace-nowrap transition active:scale-95 ${
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
          <summary className="mx-auto w-fit cursor-pointer list-none rounded-full px-3 py-2 text-sm font-bold text-zinc-400 hover:text-white">
            More formats: EP, album, $15 budget
          </summary>
          <fieldset className="mt-3 grid w-full grid-cols-2 gap-3 text-left sm:grid-cols-4">
            <legend className="sr-only">Choose your format</legend>
            {([
              { id: 'draft', name: 'Draft Battle', detail: '7 picks vs a rival', icon: Swords },
              { id: 'ep', name: 'EP Builder', detail: 'A tight, focused project', icon: Disc },
              { id: 'album', name: 'Album Builder', detail: 'Build the full story', icon: Disc3 },
              { id: 'budget', name: '$15 Budget', detail: 'Make every dollar count', icon: DollarSign },
            ] as const).map(({ id, name, detail, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={gameMode === id} onClick={() => setGameMode(id)}
                className={`relative cursor-pointer rounded-2xl border p-4 transition ${gameMode === id ? 'border-rose-400/70 bg-rose-400/10 shadow-lg shadow-rose-950/20' : 'border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]'}`}>
                <Icon aria-hidden="true" className={`mb-3 h-5 w-5 ${gameMode === id ? 'text-rose-400' : 'text-zinc-400'}`} />
                {gameMode === id && <Check aria-hidden="true" className="absolute right-3 top-3 h-4 w-4 text-rose-400" />}
                <span className="block text-sm font-bold text-white">{name}</span>
                <span className="mt-1 block text-xs leading-5 text-zinc-400">{detail}</span>
              </button>
            ))}
          </fieldset>
        </details>
      </section>

      <div className="w-full max-w-3xl"><DailyDropHero onStart={onDailyStarted} /></div>

      {/* How it works */}
      <section aria-labelledby="how-it-works" className="w-full max-w-5xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="how-it-works" className="text-lg font-black text-white">How it works</h2>
          {onOpenHowToPlay && (
            <button
              type="button"
              onClick={() => {
                playHoverSound(audioEnabled);
                onOpenHowToPlay();
              }}
              className="min-h-[44px] px-2 text-sm font-bold text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Full rules</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/15 text-sm font-black text-rose-300">
                {index + 1}
              </span>
              <h3 className="mt-3 text-base font-bold text-white">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-zinc-400">{step.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Secondary actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onOpenFriendsModal}
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-5 py-2.5 text-sm font-bold text-zinc-200 hover:text-white transition active:scale-95"
        >
          <Swords className="w-4 h-4 text-rose-400" aria-hidden="true" />
          <span>Play a friend&apos;s code</span>
        </button>
        <button
          type="button"
          onClick={onScrollToLeaderboard}
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-5 py-2.5 text-sm font-bold text-zinc-200 hover:text-white transition active:scale-95"
        >
          <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span>Your top scores</span>
        </button>
      </div>
    </div>
  );
};
