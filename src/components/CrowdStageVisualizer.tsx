'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
  Megaphone,
  Rewind,
  HandMetal,
} from 'lucide-react';
import type { CrowdHypeResult, Song, DraftSlot, DraftedTrack, SynergyBadge } from '@/types/draft';
import { computeCrowdHype } from '@/lib/synergyEngine';
import { useDraftStore } from '@/store/useDraftStore';
import {
  playAirhornSound,
  playTurntableScratchSound,
  playTurntableRewindSound,
  playCrowdCheerSound,
} from '@/lib/audioEngine';

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
  const { audioEnabled } = useDraftStore();

  const [activeFx, setActiveFx] = useState<string | null>(null);
  const [fxMessage, setFxMessage] = useState<string | null>(null);

  const triggerFx = (type: 'airhorn' | 'scratch' | 'rewind' | 'cheer') => {
    setActiveFx(type);
    if (type === 'airhorn') {
      playAirhornSound(audioEnabled);
      setFxMessage('🚨 AIRHORN BLAST! Crowd explodes! 📢🔥');
    } else if (type === 'scratch') {
      playTurntableScratchSound(audioEnabled);
      setFxMessage('💽 WICKA-WICKA! Turntable cut! 🎧');
    } else if (type === 'rewind') {
      playTurntableRewindSound(audioEnabled);
      setFxMessage('⏪ REWIND! Pull that back! 🔄');
    } else if (type === 'cheer') {
      playCrowdCheerSound(audioEnabled);
      setFxMessage('🙌 CROWD ROARING! Maximum aux energy! ✨');
    }

    setTimeout(() => {
      setActiveFx((prev) => (prev === type ? null : prev));
      setFxMessage((prev) => (prev && prev.includes(type) ? null : prev));
    }, 1500);
  };

  // Keyboard shortcut triggers for the soundboard: H (Horn), S (Scratch), P (Pull-up Rewind), A (Applause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'h') {
        e.preventDefault();
        triggerFx('airhorn');
      } else if (key === 's' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        triggerFx('scratch');
      } else if (key === 'p') {
        e.preventDefault();
        triggerFx('rewind');
      } else if (key === 'a' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        triggerFx('cheer');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioEnabled]);

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
  const isHyped = effectiveScore >= 85 || activeFx === 'airhorn' || activeFx === 'cheer';
  const isGroove = effectiveScore >= 70 && effectiveScore < 85;
  const isMid = effectiveScore >= 45 && effectiveScore < 70;
  const isCold = effectiveScore < 45;

  // Combo Streak
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
      className="relative w-full rounded-2xl border border-white/[0.08] bg-[#0e0e12]/85 p-3.5 sm:p-4 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-500"
    >
      {/* Subtle Acoustic Stage Lighting Sheen */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-[32rem] h-40 rounded-full blur-3xl transition-all duration-700 ${
            isHyped
              ? 'bg-rose-600/15'
              : isGroove
              ? 'bg-emerald-600/10'
              : isMid
              ? 'bg-amber-600/10'
              : 'bg-zinc-800/10'
          }`}
        />
      </div>

      {/* TOP DECK: Hype Score, Live Status & Hover Prediction Pill */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-2">
        {/* Left: Venue & Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl border transition-colors ${
              isHyped
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-400 shadow-md shadow-rose-950/40 animate-pulse'
                : isGroove
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : isMid
                ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
                : 'bg-zinc-900 border-zinc-700/50 text-zinc-400'
            }`}
          >
            {isHyped ? (
              <Flame className="w-4 h-4" />
            ) : isGroove ? (
              <Volume2 className="w-4 h-4" />
            ) : isMid ? (
              <Radio className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Live Aux Crowd Arena
              </span>
              {streakCount >= 2 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/[0.08] border border-white/[0.12] text-[9px] font-black text-white flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
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
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-rose-950/60 text-rose-300 border-rose-500/40 shadow-sm'
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
                ? 'bg-[#161214] border-rose-500/60 text-white shadow-lg shadow-rose-950/30'
                : isGroove
                ? 'bg-[#101614] border-emerald-500/40 text-emerald-200'
                : isMid
                ? 'bg-[#161410] border-amber-500/30 text-amber-200'
                : 'bg-zinc-900 border-white/[0.08] text-zinc-300'
            }`}
          >
            <span className="text-base sm:text-lg font-black tracking-tight">{currentScore}%</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
              Hype
            </span>
          </div>
        </div>
      </div>

      {/* MIDDLE DECK: Animated Crowd Stage & Reactive Silhouettes */}
      <div className="relative z-10 w-full h-20 sm:h-24 bg-black/50 rounded-xl border border-white/[0.06] overflow-hidden flex items-end justify-center px-4">
        {/* Dynamic Speech Bubble */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-max max-w-[94%] sm:max-w-md animate-bubble-pop">
          <div className="relative px-3 py-1.5 rounded-2xl bg-zinc-900/95 border border-white/[0.15] text-zinc-100 text-xs font-semibold shadow-2xl backdrop-blur-xl flex items-center gap-2">
            <span className="text-sm">
              {activeFx ? '⚡' : isHyped ? '🔥' : isGroove ? '🎧' : isMid ? '📱' : '💤'}
            </span>
            <p className="truncate italic font-medium">
              {fxMessage || (hoverPrediction ? hoverPrediction.anticipatoryQuote : `"${reactionQuote}"`)}
            </p>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-900 border-b border-r border-white/[0.15] rotate-45" />
          </div>
        </div>

        {/* Crowd Silhouettes Array */}
        <div className="w-full max-w-2xl flex items-end justify-between gap-1 sm:gap-3 pb-0.5 select-none pointer-events-none">
          {/* Member 1: Head nodder */}
          <div
            className={`flex flex-col items-center origin-bottom transition-transform ${
              isHyped
                ? 'animate-crowd-bounce-fast text-zinc-200'
                : isGroove
                ? 'animate-crowd-bounce text-zinc-400'
                : isMid
                ? 'opacity-60 text-zinc-600'
                : 'opacity-30 translate-y-2 text-zinc-800'
            }`}
            style={{ animationDelay: '0ms' }}
          >
            <svg className="w-7 h-11 sm:w-9 sm:h-13 fill-current drop-shadow-md" viewBox="0 0 40 60">
              <circle cx="20" cy="14" r="9" />
              <path d="M9 13 A11 11 0 0 1 31 13" stroke="currentColor" strokeWidth="2.5" fill="none" />
              <rect x="7" y="11" width="3" height="6" rx="1.5" />
              <rect x="30" y="11" width="3" height="6" rx="1.5" />
              <path d="M12 26 C12 24 28 24 28 26 L32 60 L8 60 Z" />
            </svg>
          </div>

          {/* Member 2: Mosher with hands up */}
          <div
            className={`flex flex-col items-center origin-bottom transition-transform ${
              isHyped
                ? 'animate-crowd-bounce-fast text-rose-400'
                : isGroove
                ? 'animate-crowd-bounce text-zinc-300'
                : isMid
                ? 'text-zinc-600'
                : 'text-zinc-800 translate-y-1'
            }`}
            style={{ animationDelay: '120ms' }}
          >
            <svg className="w-8 h-14 sm:w-11 sm:h-16 fill-current drop-shadow-md" viewBox="0 0 44 64">
              <path d="M8 8 L13 22 M36 8 L31 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <circle cx="22" cy="18" r="8" />
              <path d="M14 28 C14 26 30 26 30 28 L35 64 L9 64 Z" />
            </svg>
          </div>

          {/* Member 3: Festival fan waving arms */}
          <div
            className={`flex flex-col items-center origin-bottom transition-transform ${
              isHyped
                ? 'animate-crowd-bounce-fast text-white'
                : isGroove
                ? 'animate-crowd-bounce text-zinc-300'
                : isMid
                ? 'text-zinc-600'
                : 'text-zinc-800'
            }`}
            style={{ animationDelay: '240ms' }}
          >
            <svg className="w-7 h-12 sm:w-10 sm:h-15 fill-current drop-shadow-md" viewBox="0 0 40 60">
              <line x1="10" y1="6" x2="16" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              {isHyped && (
                <circle cx="9" cy="5" r="3" className="fill-rose-400 animate-ping" />
              )}
              <circle cx="21" cy="16" r="7.5" />
              <path d="M13 27 C13 25 29 25 29 27 L33 60 L9 60 Z" />
            </svg>
          </div>

          {/* Member 4: Center DJ Deck Console */}
          <div className="flex flex-col items-center justify-end h-full px-2 z-10">
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-zinc-900 border border-white/[0.12] shadow-xl">
              <Disc3 className={`w-4 h-4 text-rose-500 ${isHyped ? 'animate-spin-slow' : ''}`} />
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-1 bg-white rounded-full animate-eq-1" />
                <span className="w-1 bg-rose-500 rounded-full animate-eq-2" />
                <span className="w-1 bg-zinc-400 rounded-full animate-eq-3" />
                <span className="w-1 bg-white rounded-full animate-eq-4" />
              </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 mt-0.5">
              AUX BOOTH
            </span>
          </div>

          {/* Member 5: Head-nodder with baseball cap */}
          <div
            className={`flex flex-col items-center origin-bottom transition-transform ${
              isHyped
                ? 'animate-crowd-bounce-fast text-zinc-200'
                : isGroove
                ? 'animate-crowd-bounce text-zinc-300'
                : isMid
                ? 'text-zinc-600'
                : 'text-zinc-800'
            }`}
            style={{ animationDelay: '80ms' }}
          >
            <svg className="w-7 h-12 sm:w-10 sm:h-14 fill-current drop-shadow-md" viewBox="0 0 40 60">
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
                ? 'text-zinc-600'
                : 'text-zinc-800'
            }`}
            style={{ animationDelay: '200ms' }}
          >
            <svg className="w-8 h-14 sm:w-11 sm:h-16 fill-current drop-shadow-md" viewBox="0 0 44 64">
              <path d="M6 7 L12 22 M38 7 L32 22" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
              {isHyped && (
                <>
                  <circle cx="6" cy="6" r="2.5" className="fill-white animate-pulse" />
                  <circle cx="38" cy="6" r="2.5" className="fill-rose-400 animate-pulse" />
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
                ? 'animate-crowd-bounce-fast text-zinc-300'
                : isGroove
                ? 'animate-crowd-bounce text-zinc-400'
                : isMid
                ? 'text-zinc-600'
                : 'text-zinc-800'
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
        <div className="w-full h-2 bg-black/60 rounded-full p-0.5 border border-white/[0.08] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isHyped
                ? 'bg-rose-500 shadow-md shadow-rose-500/50'
                : isGroove
                ? 'bg-emerald-400'
                : isMid
                ? 'bg-amber-400'
                : 'bg-zinc-600'
            }`}
            style={{ width: `${currentScore}%` }}
          />
        </div>
      </div>

      {/* TACTILE DJ SOUNDBOARD STRIP */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2.5 pt-2 border-t border-white/[0.08]">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-400">DJ Soundboard:</span>
            <span className="text-[9px] text-zinc-500 font-medium hidden sm:inline">Tap or press keys</span>
          </div>
          {activeFx && (
            <span className="text-[10px] font-bold text-rose-400 animate-pulse sm:hidden">
              FX Triggered
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
          {/* Airhorn */}
          <button
            onClick={() => triggerFx('airhorn')}
            title="Fire DJ Airhorn blast (Shortcut: H)"
            aria-label="DJ Airhorn"
            className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-black border flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
              activeFx === 'airhorn'
                ? 'bg-white text-black border-white shadow-lg scale-102 font-black'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-zinc-200'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[10px] sm:text-xs leading-none">Airhorn <kbd className="hidden sm:inline text-[8.5px] text-zinc-400 font-mono">H</kbd></span>
          </button>

          {/* Scratch */}
          <button
            onClick={() => triggerFx('scratch')}
            title="Vinyl Turntable Scratch (Shortcut: S)"
            aria-label="Turntable Scratch"
            className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-black border flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
              activeFx === 'scratch'
                ? 'bg-white text-black border-white shadow-lg scale-102 font-black'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-zinc-200'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[10px] sm:text-xs leading-none">Scratch <kbd className="hidden sm:inline text-[8.5px] text-zinc-400 font-mono">S</kbd></span>
          </button>

          {/* Rewind */}
          <button
            onClick={() => triggerFx('rewind')}
            title="Tape Rewind Pull-Up (Shortcut: P)"
            aria-label="Rewind Pull-Up"
            className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-black border flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
              activeFx === 'rewind'
                ? 'bg-white text-black border-white shadow-lg scale-102 font-black'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-zinc-200'
            }`}
          >
            <Rewind className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] sm:text-xs leading-none">Rewind <kbd className="hidden sm:inline text-[8.5px] text-zinc-400 font-mono">P</kbd></span>
          </button>

          {/* Crowd Cheer */}
          <button
            onClick={() => triggerFx('cheer')}
            title="Crowd Roar / Cheer (Shortcut: A)"
            aria-label="Crowd Roar"
            className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-black border flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
              activeFx === 'cheer'
                ? 'bg-white text-black border-white shadow-lg scale-102 font-black'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-zinc-200'
            }`}
          >
            <HandMetal className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[10px] sm:text-xs leading-none">Roar <kbd className="hidden sm:inline text-[8.5px] text-zinc-400 font-mono">A</kbd></span>
          </button>
        </div>
      </div>
    </section>
  );
};
