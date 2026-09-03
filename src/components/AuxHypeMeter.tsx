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

  let gaugeColor = 'from-amber-500 to-red-500';
  let badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  let Icon = Flame;

  if (score >= 85) {
    gaugeColor = 'from-orange-500 via-red-500 to-pink-500';
    badgeColor = 'bg-red-500/20 text-red-300 border-red-500/40 shadow-lg shadow-red-950/50';
    Icon = Flame;
  } else if (score >= 70) {
    gaugeColor = 'from-emerald-400 to-cyan-500';
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    Icon = Volume2;
  } else if (score >= 50) {
    gaugeColor = 'from-cyan-500 to-blue-500';
    badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    Icon = Radio;
  } else {
    gaugeColor = 'from-gray-600 to-rose-700';
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    Icon = AlertTriangle;
  }

  if (isCompact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-950/70 border border-gray-800 backdrop-blur-md">
        <Icon className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aux Hype</span>
            <span className="text-xs font-black text-white">{score}%</span>
          </div>
          <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${gaugeColor} transition-all duration-500 rounded-full`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-950/60 border border-gray-800/80 rounded-2xl p-3.5 backdrop-blur-md shadow-xl flex flex-col gap-2 relative overflow-hidden group hover:border-gray-700 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gray-900 border border-gray-800">
            <Icon className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
              Crowd & Aux Heat Meter
            </span>
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              {status}
            </h4>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-full text-xs font-black border ${badgeColor} flex items-center gap-1`}>
          <span>{score}%</span>
          <span className="text-[9px] uppercase font-bold text-gray-400">Hype</span>
        </div>
      </div>

      {/* Gauge Bar */}
      <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden p-0.5 border border-gray-800/80">
        <div
          className={`h-full bg-gradient-to-r ${gaugeColor} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Reactive crowd quote */}
      <p className="text-[11px] text-gray-400 italic flex items-center gap-1">
        <span>“{reactionQuote}”</span>
      </p>
    </div>
  );
};
