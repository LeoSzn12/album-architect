'use client';

import React from 'react';
import { EyeOff, Swords, TrendingUp } from 'lucide-react';
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {gameMode === 'draft' && rival && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-400">
              <Swords className="w-3 h-3" aria-hidden="true" /> Your rival
            </div>
            <div className="text-sm font-black text-white">{rival.name}</div>
            <div className="text-[11px] text-zinc-400">{rival.tagline}</div>
          </div>
        )}
        {cards.map((card) => (
          <div key={card.id} className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">Rule card</div>
            <div className="text-sm font-black text-white">{card.name}</div>
            <div className="text-[11px] text-zinc-300">{card.description}</div>
          </div>
        ))}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            <TrendingUp className="w-3 h-3" aria-hidden="true" /> This week
          </div>
          <div className="text-sm font-black text-white">{trend.name}</div>
          <div className="text-[11px] text-zinc-400">{trend.description}</div>
        </div>
      </div>

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
