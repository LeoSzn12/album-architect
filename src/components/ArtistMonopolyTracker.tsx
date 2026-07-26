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
          ? 'bg-gradient-to-r from-red-950/40 via-gray-900 to-red-950/20 border-red-800/80 shadow-lg shadow-red-950/30'
          : 'bg-gray-900/80 border-gray-800 backdrop-blur-md'
      }`}
    >
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          {hasViolation ? (
            <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
            Artist Monopoly Penalty Engine
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasViolation ? (
            <span className="px-2.5 py-1 rounded-full bg-red-950 text-red-300 border border-red-800 text-[11px] font-bold flex items-center gap-1">
              <span>Monopoly Flag</span>
              <span className="text-red-400 font-extrabold">(-{totalPenaltyDeduction} pts)</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[11px] font-bold flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              <span>Clean Roster Diversity</span>
            </span>
          )}
        </div>
      </div>

      {hasViolation && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-950/60 border border-red-900/60 text-xs text-red-200 flex flex-col gap-1">
          <span className="font-bold flex items-center gap-1 text-red-300">
            <AlertTriangle className="w-3.5 h-3.5" /> Solo Monopoly Rule Exceeded!
          </span>
          <p className="text-[11px] text-red-300/80 leading-relaxed">
            Solo artist appearances are capped at 1 track without penalty. Subsequent solo tracks incur score point deductions! (Featured guest appearances are exempt).
          </p>
        </div>
      )}

      {/* Artist Roster Badges */}
      {artistEntries.length === 0 ? (
        <div className="text-[11px] text-gray-500 italic py-1">
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
                    ? 'bg-red-950 border-red-700 text-red-200 font-bold animate-pulse'
                    : data.featured > 0
                    ? 'bg-purple-950/50 border-purple-800/60 text-purple-300'
                    : 'bg-gray-950 border-gray-800 text-gray-300'
                }`}
              >
                <span>{artist}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-black/40 text-gray-400">
                  {data.solo} Solo {data.featured > 0 ? `+ ${data.featured} Feat` : ''}
                </span>
                {data.featured > 0 && (
                  <span title="Feature appearance exempt from penalty">
                    <Sparkles className="w-3 h-3 text-pink-400 inline" />
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
