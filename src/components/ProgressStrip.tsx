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
    gameMode,
    sessionId,
  } = useDraftStore();

  const isCompleted = currentRoundIndex >= slots.length;
  const tracksDrafted = draftedTracks.length;
  const total = slots.length;
  const progressPct = total ? Math.round((tracksDrafted / total) * 100) : 0;
  const projectLabel = gameMode === 'draft' ? 'Draft' : gameMode === 'ep' ? 'EP' : 'Album';
  const progressLabel = gameMode === 'draft' ? 'Round' : `${projectLabel} Track`;

  const getAlbumAct = (trackNumber: number) => {
    if (trackNumber <= Math.min(6, total)) return { label: 'Act I', range: `1–${Math.min(6, total)}` };
    if (trackNumber <= Math.min(10, total)) return { label: 'Act II', range: `${Math.min(6, total) + 1}–${Math.min(10, total)}` };
    return { label: 'Act III', range: `${Math.min(10, total) + 1}–${total}` };
  };
  const currentAct = gameMode === 'album' && total > 0
    ? getAlbumAct(Math.min(currentRoundIndex + 1, total))
    : null;

  // Provisional grade based on latest available score
  const provisionalScore = evaluationResult?.overallScore ?? null;
  const getProvisionalGrade = (score: number | null) => {
    if (score === null) return null;
    if (score >= 9.2) return { label: 'Classic', color: 'text-emerald-400' };
    if (score >= 8.5) return { label: 'Platinum', color: 'text-zinc-200' };
    if (score >= 7.5) return { label: 'Gold', color: 'text-amber-400' };
    if (score >= 6.0) return { label: 'Mixed', color: 'text-zinc-400' };
    return { label: 'Flop risk', color: 'text-rose-400' };
  };
  const grade = getProvisionalGrade(provisionalScore);

  // Era for current round
  const currentEra = eraSequence[currentRoundIndex];
  const eraText = currentEra ? eraLabel(currentEra) : null;

  return (
    <div className="w-full bg-[#0e0e12]/90 backdrop-blur-xl border border-white/[0.08] shadow-lg rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
      {/* Track Progress */}
      <div className="flex items-center gap-2">
        <Disc3 className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 animate-spin-slow" />
        <span className="text-zinc-300">
            {progressLabel}{' '}
            <span className="font-extrabold text-white">
              {isCompleted ? total : tracksDrafted + 1}
          </span>
          {' '}of{' '}
          <span className="font-extrabold text-white">{total}</span>
        </span>
        {/* Mini progress bar */}
        <div className="w-16 h-1.5 bg-white/[0.08] rounded-full overflow-hidden hidden sm:block">
          <div
            className="h-full bg-rose-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Era badge */}
      {!isCompleted && eraText && (
        <div className="px-2 py-0.5 bg-white/[0.06] border border-white/[0.1] rounded-lg text-zinc-200 font-bold text-[10px] uppercase tracking-wider">
          {eraText}
        </div>
      )}

      {currentAct && !isCompleted && (
        <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 font-bold text-[10px] uppercase tracking-wider">
          {currentAct.label} · tracks {currentAct.range}
        </div>
      )}

      {gameMode !== 'draft' && (
        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider" title="Your current builder is saved in local browser storage">
          {sessionId ? 'Session saved' : 'Saved locally'}
        </div>
      )}

      {/* Rerolls remaining */}
      {!isCompleted && (
        <div
          className={`flex items-center gap-1 ${rerollTokens > 0 ? 'text-zinc-300' : 'text-zinc-600'}`}
          title="Reroll tokens remaining"
        >
          <RefreshCw className="w-3 h-3" />
          <span>
            <span className={`font-extrabold ${rerollTokens > 0 ? 'text-white' : 'text-zinc-600'}`}>
              {rerollTokens}
            </span>{' '}
            Reroll{rerollTokens !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Monopoly warning */}
      {monopolyReport.hasViolation && (
        <div className="flex items-center gap-1 text-rose-400 font-bold">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>−{monopolyReport.totalPenaltyDeduction} pts</span>
        </div>
      )}

      {/* Hardcore mode label */}
      {difficulty === 'hardcore' && (
        <div className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest">
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
