'use client';

import React from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { Disc3, RefreshCw, AlertTriangle, Star } from 'lucide-react';
import { eraLabel } from '@/lib/eraSequence';

/**
 * Persistent compact progress strip shown above draft cards.
 * Gives the player instant awareness of: track progress, rerolls remaining,
 * monopoly status, auto-assigned era, and provisional grade bracket.
 */
export const ProgressStrip: React.FC = () => {
  const {
    slots,
    currentRoundIndex,
    draftedTracks,
    rerollTokens,
    monopolyReport,
    evaluationResult,
    eraSequence,
    difficulty,
  } = useDraftStore();

  const isCompleted = currentRoundIndex >= slots.length;
  const tracksDrafted = draftedTracks.length;
  const total = slots.length;
  const progressPct = Math.round((tracksDrafted / total) * 100);

  // Provisional grade based on latest available score
  const provisionalScore = evaluationResult?.overallScore ?? null;
  const getProvisionalGrade = (score: number | null) => {
    if (score === null) return null;
    if (score >= 9.2) return { label: 'Classic', color: 'text-cyan-400' };
    if (score >= 8.5) return { label: 'Platinum', color: 'text-purple-300' };
    if (score >= 7.5) return { label: 'Gold', color: 'text-amber-300' };
    if (score >= 6.0) return { label: 'Mixed', color: 'text-orange-400' };
    return { label: 'Flop risk', color: 'text-red-400' };
  };
  const grade = getProvisionalGrade(provisionalScore);

  // Era for current round
  const currentEra = eraSequence[currentRoundIndex];
  const eraText = currentEra ? eraLabel(currentEra) : null;

  return (
    <div className="w-full bg-gray-950/90 border border-gray-800/80 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
      {/* Track Progress */}
      <div className="flex items-center gap-2">
        <Disc3 className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
        <span className="text-gray-200">
          Track{' '}
          <span className="font-extrabold text-white">
            {isCompleted ? total : tracksDrafted + 1}
          </span>
          {' '}of{' '}
          <span className="font-extrabold text-white">{total}</span>
        </span>
        {/* Mini progress bar */}
        <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden hidden sm:block">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Era badge */}
      {!isCompleted && eraText && (
        <div className="px-2 py-0.5 bg-purple-950/80 border border-purple-800/60 rounded-lg text-purple-300 font-bold text-[10px] uppercase tracking-wider">
          {eraText}
        </div>
      )}

      {/* Rerolls remaining */}
      {!isCompleted && (
        <div
          className={`flex items-center gap-1 ${rerollTokens > 0 ? 'text-gray-300' : 'text-gray-600'}`}
          title="Reroll tokens remaining"
        >
          <RefreshCw className="w-3 h-3" />
          <span>
            <span className={`font-extrabold ${rerollTokens > 0 ? 'text-pink-400' : 'text-gray-600'}`}>
              {rerollTokens}
            </span>{' '}
            Reroll{rerollTokens !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Monopoly warning */}
      {monopolyReport.hasViolation && (
        <div className="flex items-center gap-1 text-red-400 font-bold">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>−{monopolyReport.totalPenaltyDeduction} pts</span>
        </div>
      )}

      {/* Hardcore mode label */}
      {difficulty === 'hardcore' && (
        <div className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest">
          Hardcore
        </div>
      )}

      {/* Provisional grade (only after evaluation) */}
      {grade && (
        <div className={`flex items-center gap-1 font-extrabold ${grade.color}`}>
          <Star className="w-3 h-3 fill-current" />
          <span>{grade.label}</span>
        </div>
      )}
    </div>
  );
};
