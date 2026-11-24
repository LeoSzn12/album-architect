'use client';

import React from 'react';
import { ChevronDown, EyeOff, Swords, TrendingUp } from 'lucide-react';
import { useDraftStore } from '@/store/useDraftStore';
import { RIVALS } from '@/lib/firstWeek/rivals';
import { RULE_CARDS } from '@/lib/firstWeek/ruleCards';
import { getWeeklyTrend } from '@/lib/firstWeek/weeklyTrend';

/** Rival, rule cards and this week's trend, shown above the pick pool. */
export const FirstWeekHud: React.FC = () => {
  const { gameMode, rivalId, ruleCardIds, mysteryRoundIndex, currentRoundIndex, rivalPrePick } = useDraftStore();
  const rival = RIVALS[rivalId];
  const trend = React.useMemo(() => getWeeklyTrend(), []);
  const isMysteryRound = mysteryRoundIndex === currentRoundIndex;
  const cards = ruleCardIds.map((id) => RULE_CARDS[id]).filter(Boolean);

  return (
    <section aria-label="This draft's rival and rules" className="flex flex-col gap-2">
      <details className="group rounded-xl border border-white/[0.08] bg-white/[0.03]">
        <summary className="min-h-[44px] list-none cursor-pointer px-3 py-2 flex items-center justify-between gap-2 text-sm [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
            {gameMode === 'draft' && rival && (
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Swords className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
                vs <span className="font-black text-white">{rival.name}</span>
              </span>
            )}
            {cards.map((card) => (
              <span key={card.id} className="rounded-full bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-xs font-bold text-amber-200">{card.name}</span>
            ))}
            <span className="flex items-center gap-1.5 text-zinc-400">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> {trend.name}
            </span>
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-zinc-500 flex-shrink-0">
            Rules <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
          </span>
        </summary>
        <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {gameMode === 'draft' && rival && (
            <div><div className="font-black text-white">Your rival: {rival.name}</div><div className="text-zinc-400">{rival.tagline}</div></div>
          )}
          {cards.map((card) => (
            <div key={card.id}><div className="font-black text-amber-200">{card.name}</div><div className="text-zinc-300">{card.description}</div></div>
          ))}
          <div><div className="font-black text-emerald-300">This week: {trend.name}</div><div className="text-zinc-400">{trend.description}</div></div>
        </div>
      </details>

      {gameMode === 'draft' && rivalPrePick && rival && (
        <div role="status" className="rounded-xl border border-rose-500/30 bg-rose-500/[0.08] px-3 py-2 text-xs text-zinc-200 animate-fade-in">
          <span className="font-black text-rose-300">{rival.name} picked first this round</span> and took{' '}
          <span className="font-bold text-white">{rivalPrePick.title}</span> by {rivalPrePick.artist}. {rival.pickReason(rivalPrePick)}
        </div>
      )}

      {isMysteryRound && (
        <div role="status" className="rounded-xl border border-violet-500/30 bg-violet-500/[0.08] px-3 py-2 text-xs text-zinc-200 flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-violet-300 flex-shrink-0" aria-hidden="true" />
          <span>
            <span className="font-black text-violet-200">Snippet Round.</span> Titles and covers are hidden. Play the snippets and pick by ear.
          </span>
        </div>
      )}
    </section>
  );
};
