'use client';

import React, { useMemo } from 'react';
import {
  Flame,
  Volume2,
  Sparkles,
  Zap,
  Radio,
  AlertTriangle,
  Music2,
  TrendingUp,
  TrendingDown,
  Disc3,
} from 'lucide-react';
import type { CrowdHypeResult, Song, DraftSlot, DraftedTrack, SynergyBadge } from '@/types/draft';
import { computeCrowdHype } from '@/lib/synergyEngine';

interface CrowdStageVisualizerProps {
  crowdHype: CrowdHypeResult;
  hoveredCandidate: Song | null;
  draftedTracks: DraftedTrack[];
  currentSlot: DraftSlot | null;
  activeSynergies: SynergyBadge[];
}

export const CrowdStageVisualizer: React.FC<CrowdStageVisualizerProps> = ({
  crowdHype,
  hoveredCandidate,
  draftedTracks,
  currentSlot,
  activeSynergies,
}) => {
  const { score: currentScore, status, reactionQuote } = crowdHype;

  // Real-time hover anticipation calculation
  const hoverPrediction = useMemo(() => {
    if (!hoveredCandidate || !currentSlot) return null;

    const hypotheticalTracklist: DraftedTrack[] = [
      ...draftedTracks,
      {
        song: hoveredCandidate,
        slot: currentSlot,
        draftedAt: Date.now(),
      },
    ];

    const projected = computeCrowdHype(hypotheticalTracklist, activeSynergies);
    const delta = projected.score - currentScore;

    const prevSong = draftedTracks.length > 0 ? draftedTracks[draftedTracks.length - 1].song : null;
    const bpmDelta = prevSong ? Math.abs(hoveredCandidate.bpm - prevSong.bpm) : 0;
    const energyDelta = Math.abs(hoveredCandidate.energy - currentSlot.targetEnergy.ideal);

    let anticipatoryQuote = 'Crowd is tuning in...';
    if (delta >= 5) {
      anticipatoryQuote = 'Crowd is about to go crazy for this! 🔥';
    } else if (delta > 0) {
      anticipatoryQuote = 'Smooth transition, crowd approves! ✨';
    } else if (bpmDelta > 30) {
      anticipatoryQuote = `BPM shift (${bpmDelta} BPM jump) might throw off the rhythm! 👟`;
    } else if (energyDelta >= 20) {
      anticipatoryQuote = 'Energy is slightly off the slot target, crowd looks curious 🤔';
    } else if (delta < 0) {
      anticipatoryQuote = 'Crowd momentum might slow down here 📉';
    }

    return {
      projectedScore: projected.score,
      delta,
      status: projected.status,
      anticipatoryQuote,
      isPositive: delta >= 0,
    };
  }, [hoveredCandidate, currentSlot, draftedTracks, activeSynergies, currentScore]);

  // Determine stage energy tier
  const effectiveScore = hoverPrediction ? hoverPrediction.projectedScore : currentScore;
  const isHyped = effectiveScore >= 85;
  const isGroove = effectiveScore >= 70 && effectiveScore < 85;
  const isMid = effectiveScore >= 45 && effectiveScore < 70;
  const isCold = effectiveScore < 45;

  // Combo Streak (tracks with smooth BPM or high synergy)
  const streakCount = useMemo(() => {
    let count = 0;
    for (let i = draftedTracks.length - 1; i >= 0; i--) {
      const track = draftedTracks[i];
      if (Math.abs(track.song.energy - track.slot.targetEnergy.ideal) <= 12) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [draftedTracks]);

  return (
    <section
      aria-label="Live Crowd and Aux Hype Stage"
      className="relative w-full rounded-2xl border border-purple-900/40 bg-gradient-to-b from-[#0e121d]/90 via-[#0a0d14]/95 to-[#08090e] p-3 sm:p-4 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-500"
    >
      {/* Background Stage Lights & Lasers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Laser 1: Cyan */}
        <div
          className={`absolute -top-10 left-1/4 w-1.5 h-64 bg-cyan-400/40 blur-sm rounded-full transform -rotate-45 origin-top transition-opacity ${
            isHyped ? 'animate-stage-laser opacity-90' : isGroove ? 'opacity-40' : 'opacity-10'
          }`}
        />
        {/* Laser 2: Magenta / Pink */}
        <div
          className={`absolute -top-10 right-1/4 w-1.5 h-64 bg-pink-500/40 blur-sm rounded-full transform rotate-45 origin-top transition-opacity ${
            isHyped ? 'animate-stage-laser opacity-90 delay-300' : isGroove ? 'opacity-40' : 'opacity-10'
          }`}
        />

        {/* Ambient Stage Glow Wash */}
        <div
          className={`absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full blur-3xl transition-all duration-700 ${
            isHyped
              ? 'bg-gradient-to-r from-pink-600/25 via-purple-600/30 to-cyan-500/25'
              : isGroove
              ? 'bg-gradient-to-r from-purple-800/20 to-cyan-600/20'
              : isMid
              ? 'bg-amber-900/15'
              : 'bg-rose-950/20'
          }`}
        />
      </div>

      {/* TOP DECK: Hype Score, Live Status & Hover Prediction Pill */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-2">
        {/* Left: Venue & Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-xl border transition-colors ${
              isHyped
                ? 'bg-pink-950/80 border-pink-500/60 text-pink-300 shadow-md shadow-pink-950/50'
                : isGroove
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                : isMid
                ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
            }`}
          >
            {isHyped ? (
              <Flame className="w-4 h-4 animate-pulse" />
            ) : isGroove ? (
              <Volume2 className="w-4 h-4" />
            ) : isMid ? (
              <Radio className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Live Aux Crowd Arena
              </span>
              {streakCount >= 2 && (
                <span className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-[9px] font-black text-slate-950 flex items-center gap-0.5 animate-pulse">
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  {streakCount}x Streak
                </span>
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <span>{status}</span>
            </h4>
          </div>
        </div>

        {/* Right: Real-time Hype Gauge & Projected Hover Feedback */}
        <div className="flex items-center gap-2">
          {hoverPrediction && (
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border transition-all animate-fade-in ${
                hoverPrediction.isPositive
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-md shadow-emerald-950/50'
                  : 'bg-rose-950/90 text-rose-300 border-rose-500/60 shadow-md shadow-rose-950/50'
              }`}
            >
              {hoverPrediction.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>
                {hoverPrediction.delta > 0 ? `+${hoverPrediction.delta}%` : `${hoverPrediction.delta}%`}
              </span>
              <span className="text-[9px] uppercase font-bold opacity-80">Anticipation</span>
            </div>
          )}

          {/* Current Hype Badge */}
          <div
            className={`px-3 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${
              isHyped
                ? 'bg-gradient-to-r from-pink-950/90 to-purple-950/90 border-pink-500/70 text-white shadow-lg shadow-pink-950/40 ring-1 ring-pink-400/50'
                : isGroove
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200'
                : isMid
                ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            }`}
          >
            <span className="text-base sm:text-lg font-black tracking-tight">{currentScore}%</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Hype
            </span>
          </div>
        </div>
      </div>

      {/* MIDDLE DECK: Animated Crowd Stage & Reactive Silhouettes */}
      <div className="relative z-10 w-full h-20 sm:h-24 bg-black/40 rounded-xl border border-white/[0.06] overflow-hidden flex items-end justify-center px-4">
        {/* Dynamic Speech Bubble: Pops above the crowd with instant feedback */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-max max-w-[92%] sm:max-w-md animate-bubble-pop">
          <div className="relative px-3 py-1.5 rounded-2xl bg-slate-900/95 border border-purple-500/40 text-slate-200 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2">
            <span className="text-sm">
              {isHyped ? '🔥' : isGroove ? '🎧' : isMid ? '📱' : '💀'}
            </span>
            <p className="truncate italic">
              {hoverPrediction ? hoverPrediction.anticipatoryQuote : `"${reactionQuote}"`}
            </p>
            {/* Speech bubble pointer notch */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-purple-500/40 rotate-45" />
          </div>
        </div>

        {/* Crowd Silhouettes Array */}
        <div className="w-full max-w-2xl flex items-end justify-between gap-1 sm:gap-3 pb-0.5 select-none pointer-events-none">
          {/* Member 1: Head nodder */}
          <div
            className={`flex flex-col items-center origin-bottom transition-transform ${
              isHyped
                ? 'animate-crowd-bounce-fast'
                : isGroove
                ? 'animate-crowd-bounce'
                : isMid
                ? 'opacity-60'
                : 'opacity-30 translate-y-2'
            }`}
            style={{ animationDelay: '0ms' }}
          >
            <svg className="w-7 h-11 sm:w-9 sm:h-13 text-purple-400/80 fill-current drop-shadow-md" viewBox="0 0 40 60">
              {/* Head with Headphones */}
              <circle cx="20" cy="14" r="9" />
              <path d="M9 13 A11 11 0 0 1 31 13" stroke="currentColor" strokeWidth="2.5" fill="none" />
              <rect x="7" y="11" width="3" height="6" rx="1.5" />
              <rect x="30" y="11" width="3" height="6" rx="1.5" />
              {/* Torso */}
              <path d="M12 26 C12 24 28 24 28 26 L32 60 L8 60 Z" />
            </svg>
          </div>

          {/* Member 2: Mosher with hands up */}
          <div
            className={`flex flex-col items-center origin-bottom transition-transform ${
              isHyped
                ? 'animate-crowd-bounce-fast text-pink-400'
                : isGroove
                ? 'animate-crowd-bounce text-purple-300'
                : isMid
                ? 'text-slate-500'
                : 'text-slate-700 translate-y-1'
            }`}
            style={{ animationDelay: '120ms' }}
          >
            <svg className="w-8 h-14 sm:w-11 sm:h-16 fill-current drop-shadow-md" viewBox="0 0 44 64">
              {/* Hands raised */}
              <path d="M8 8 L13 22 M36 8 L31 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <circle cx="22" cy="18" r="8" />
              <path d="M14 28 C14 26 30 26 30 28 L35 64 L9 64 Z" />
            </svg>
          </div>

          {/* Member 3: Festival girl waving arms */}
          <div
            className={`flex flex-col items-center origin-bottom transition-transform ${
              isHyped
                ? 'animate-crowd-bounce-fast text-cyan-300'
                : isGroove
                ? 'animate-crowd-bounce text-cyan-400'
                : isMid
                ? 'text-slate-500'
                : 'text-slate-700'
            }`}
            style={{ animationDelay: '240ms' }}
          >
            <svg className="w-7 h-12 sm:w-10 sm:h-15 fill-current drop-shadow-md" viewBox="0 0 40 60">
              {/* Left hand up holding phone light */}
              <line x1="10" y1="6" x2="16" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              {isHyped && (
                <circle cx="9" cy="5" r="3" className="fill-cyan-300 animate-ping" />
              )}
              <circle cx="21" cy="16" r="7.5" />
              <path d="M13 27 C13 25 29 25 29 27 L33 60 L9 60 Z" />
            </svg>
          </div>

          {/* Member 4: Center DJ Deck Console */}
          <div className="flex flex-col items-center justify-end h-full px-2 z-10">
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-900 border border-purple-500/40 shadow-lg">
              <Disc3 className={`w-4 h-4 text-pink-400 ${isHyped ? 'animate-spin-slow' : ''}`} />
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-1 bg-cyan-400 rounded-full animate-eq-1" />
                <span className="w-1 bg-pink-500 rounded-full animate-eq-2" />
                <span className="w-1 bg-purple-400 rounded-full animate-eq-3" />
                <span className="w-1 bg-amber-400 rounded-full animate-eq-4" />
              </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 mt-0.5">
              AUX BOOTH
            </span>
          </div>

          {/* Member 5: Head-nodder with baseball cap */}
          <div
            className={`flex flex-col items-center origin-bottom transition-transform ${
              isHyped
                ? 'animate-crowd-bounce-fast text-amber-300'
                : isGroove
                ? 'animate-crowd-bounce text-amber-400'
                : isMid
                ? 'text-slate-500'
                : 'text-slate-700'
            }`}
            style={{ animationDelay: '80ms' }}
          >
            <svg className="w-7 h-12 sm:w-10 sm:h-14 fill-current drop-shadow-md" viewBox="0 0 40 60">
              {/* Cap visor */}
              <ellipse cx="20" cy="14" rx="8" ry="7" />
              <rect x="20" y="11" width="9" height="3" rx="1" />
              <path d="M12 25 C12 23 28 23 28 25 L32 60 L8 60 Z" />
            </svg>
          </div>

          {/* Member 6: Both hands up celebrating */}
          <div
            className={`flex flex-col items-center origin-bottom transition-transform ${
              isHyped
                ? 'animate-crowd-bounce-fast text-emerald-400'
                : isGroove
                ? 'animate-crowd-bounce text-emerald-500'
                : isMid
                ? 'text-slate-500'
                : 'text-slate-700'
            }`}
            style={{ animationDelay: '200ms' }}
          >
            <svg className="w-8 h-14 sm:w-11 sm:h-16 fill-current drop-shadow-md" viewBox="0 0 44 64">
              <path d="M6 7 L12 22 M38 7 L32 22" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
              {isHyped && (
                <>
                  <circle cx="6" cy="6" r="2.5" className="fill-amber-300 animate-pulse" />
                  <circle cx="38" cy="6" r="2.5" className="fill-cyan-300 animate-pulse" />
                </>
              )}
              <circle cx="22" cy="16" r="8" />
              <path d="M13 27 C13 25 31 25 31 27 L36 64 L8 64 Z" />
            </svg>
          </div>

          {/* Member 7: Rhythmic groove dancer */}
          <div
            className={`flex flex-col items-center origin-bottom transition-transform ${
              isHyped
                ? 'animate-crowd-bounce-fast text-indigo-400'
                : isGroove
                ? 'animate-crowd-bounce text-indigo-300'
                : isMid
                ? 'text-slate-500'
                : 'text-slate-700'
            }`}
            style={{ animationDelay: '160ms' }}
          >
            <svg className="w-7 h-11 sm:w-9 sm:h-13 fill-current drop-shadow-md" viewBox="0 0 40 60">
              <circle cx="20" cy="14" r="8" />
              <path d="M12 25 C12 23 28 23 28 25 L32 60 L8 60 Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* BOTTOM DECK: Precision Gradient Hype Meter Bar */}
      <div className="relative z-10 w-full mt-2 flex flex-col gap-1">
        <div className="w-full h-2 bg-slate-950 rounded-full p-0.5 border border-white/[0.08] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isHyped
                ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-cyan-400 shadow-md shadow-pink-500/50'
                : isGroove
                ? 'bg-gradient-to-r from-emerald-400 to-cyan-500'
                : isMid
                ? 'bg-gradient-to-r from-cyan-500 to-amber-500'
                : 'bg-gradient-to-r from-slate-600 to-rose-600'
            }`}
            style={{ width: `${currentScore}%` }}
          />
        </div>
      </div>
    </section>
  );
};
