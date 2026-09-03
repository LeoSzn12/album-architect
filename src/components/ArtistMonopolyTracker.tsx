'use client';

import React from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { ShieldCheck, AlertTriangle, UserCheck, Sparkles } from 'lucide-react';

export const ArtistMonopolyTracker: React.FC = () => {
  const { monopolyReport } = useDraftStore();

  const { artistCounts, totalPenaltyDeduction, hasViolation } = monopolyReport;

  const artistEntries = Object.entries(artistCounts).filter(
    ([artistName, data]) => data.total > 0 && artistName !== ''
  );

  return (
    <div
      className={`w-full rounded-2xl p-4 border transition-all ${
        hasViolation
          ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/20'
          : 'bg-[#0e0e12]/85 border border-white/[0.08] backdrop-blur-2xl'
      }`}
    >
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          {hasViolation ? (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Artist Monopoly Penalty Engine
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasViolation ? (
            <span className="px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 text-[11px] font-bold flex items-center gap-1">
              <span>Monopoly Flag</span>
              <span className="text-rose-400 font-extrabold">(-{totalPenaltyDeduction} pts)</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              <span>Clean Roster Diversity</span>
            </span>
          )}
        </div>
      </div>

      {hasViolation && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 flex flex-col gap-1">
          <span className="font-bold flex items-center gap-1 text-rose-300">
            <AlertTriangle className="w-3.5 h-3.5" /> Solo Monopoly Rule Exceeded
          </span>
          <p className="text-[11px] text-rose-300/80 leading-relaxed">
            Solo artist appearances are capped at 1 track without penalty. Subsequent solo tracks incur score point deductions! (Featured guest appearances are exempt).
          </p>
        </div>
      )}

      {/* Artist Roster Badges */}
      {artistEntries.length === 0 ? (
        <div className="text-[11px] text-zinc-500 italic py-1">
          Draft tracks to monitor solo artist limits and feature exceptions...
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
          {artistEntries.map(([artist, data]) => {
            const isPenalized = data.solo > 1;
            return (
              <div
                key={artist}
                className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 transition ${
                  isPenalized
                    ? 'bg-rose-950/80 border-rose-600 text-rose-200 font-bold'
                    : data.featured > 0
                    ? 'bg-white/[0.06] border-white/[0.1] text-zinc-200'
                    : 'bg-white/[0.03] border-white/[0.06] text-zinc-300'
                }`}
              >
                <span>{artist}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-black/40 text-zinc-400">
                  {data.solo} Solo {data.featured > 0 ? `+ ${data.featured} Feat` : ''}
                </span>
                {data.featured > 0 && (
                  <span title="Feature appearance exempt from penalty">
                    <Sparkles className="w-3 h-3 text-rose-400 inline" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
