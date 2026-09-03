'use client';

import React from 'react';
import { Flame, Volume2, AlertTriangle, Disc, Radio } from 'lucide-react';
import type { CrowdHypeResult } from '@/types/draft';

interface AuxHypeMeterProps {
  crowdHype: CrowdHypeResult;
  isCompact?: boolean;
}

export const AuxHypeMeter: React.FC<AuxHypeMeterProps> = ({ crowdHype, isCompact = false }) => {
  const { score, status, reactionQuote } = crowdHype;

  let gaugeColor = 'bg-amber-400';
  let badgeColor = 'bg-amber-950/60 text-amber-300 border-amber-500/30';
  let Icon = Flame;

  if (score >= 85) {
    gaugeColor = 'bg-rose-500';
    badgeColor = 'bg-rose-950/60 text-rose-300 border-rose-500/40 shadow-sm';
    Icon = Flame;
  } else if (score >= 70) {
    gaugeColor = 'bg-emerald-400';
    badgeColor = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
    Icon = Volume2;
  } else if (score >= 50) {
    gaugeColor = 'bg-zinc-400';
    badgeColor = 'bg-white/[0.06] text-zinc-300 border-white/[0.1]';
    Icon = Radio;
  } else {
    gaugeColor = 'bg-zinc-600';
    badgeColor = 'bg-zinc-900 text-zinc-400 border-zinc-700/50';
    Icon = AlertTriangle;
  }

  if (isCompact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0e0e12]/90 border border-white/[0.08] backdrop-blur-2xl">
        <Icon className="w-3.5 h-3.5 text-rose-500" />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Aux Hype</span>
            <span className="text-xs font-black text-white">{score}%</span>
          </div>
          <div className="w-16 h-1.5 bg-black/60 rounded-full overflow-hidden">
            <div
              className={`h-full ${gaugeColor} transition-all duration-500 rounded-full`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0e0e12]/85 border border-white/[0.08] rounded-2xl p-3.5 backdrop-blur-2xl shadow-xl flex flex-col gap-2 relative overflow-hidden group hover:border-white/20 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <Icon className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Crowd & Aux Heat Meter
            </span>
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              {status}
            </h4>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-full text-xs font-black border ${badgeColor} flex items-center gap-1`}>
          <span>{score}%</span>
          <span className="text-[9px] uppercase font-bold text-zinc-400">Hype</span>
        </div>
      </div>

      {/* Gauge Bar */}
      <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/[0.08]">
        <div
          className={`h-full ${gaugeColor} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Reactive crowd quote */}
      <p className="text-[11px] text-zinc-400 italic flex items-center gap-1">
        <span>&ldquo;{reactionQuote}&rdquo;</span>
      </p>
    </div>
  );
};
