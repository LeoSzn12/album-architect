'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Sparkles,
  Disc,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Swords,
} from 'lucide-react';
import { playHoverSound, playDraftCompleteFanfare } from '@/lib/audioEngine';

interface AICriticPanelProps {
  onOpenExport: () => void;
  onOpenFriendsModal?: () => void;
}

export const AICriticPanel: React.FC<AICriticPanelProps> = ({ onOpenExport, onOpenFriendsModal }) => {
  const {
    evaluationResult,
    isEvaluating,
    audioEnabled,
    startNewDraft,
    draftedTracks,
    openRealSongPlayer,
    evaluateDraft,
  } = useDraftStore();

  const [showOptimalDetails, setShowOptimalDetails] = useState(false);
  const [showTimeoutFallback, setShowTimeoutFallback] = useState(false);
  const hasCelebratedRef = useRef(false);

  // Confetti & fanfare: execute strictly ONCE per unique evaluation result
  useEffect(() => {
    if (evaluationResult && !hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      playDraftCompleteFanfare(audioEnabled);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#06b6d4', '#eab308'],
      });
    }
  }, [evaluationResult, audioEnabled]);

  // Reset celebration flag when starting fresh
  useEffect(() => {
    if (!evaluationResult) {
      hasCelebratedRef.current = false;
    }
  }, [evaluationResult]);

  // 15-second timeout for evaluating state
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isEvaluating) {
      timer = setTimeout(() => {
        setShowTimeoutFallback(true);
      }, 12000);
    }
    return () => {
      clearTimeout(timer);
      setShowTimeoutFallback(false);
    };
  }, [isEvaluating]);

  if (isEvaluating) {
    return (
      <div className="w-full bg-gray-900/90 border border-purple-500/40 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-2xl my-6 backdrop-blur-md">
        <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin mb-4" />
        <h3 className="text-xl font-extrabold text-white mb-1">
          Summoning AI Critic Board...
        </h3>
        <p className="text-xs text-gray-400 max-w-sm mb-4">
          Marcus, Chloe, and Julian are analyzing your sequencing, monopoly penalties, and energy pacing.
        </p>

        {showTimeoutFallback && (
          <button
            onClick={() => {
              playHoverSound(audioEnabled);
              evaluateDraft();
            }}
            className="px-4 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-purple-700 text-purple-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer animate-fade-in"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Taking a while? Use Instant Local Critic</span>
          </button>
        )}
      </div>
    );
  }

  if (!evaluationResult) return null;

  const {
    overallScore,
    gradeBadge,
    subScores,
    reviews,
    monopolyReport,
    optimalScore,
    optimalPicks,
  } = evaluationResult;

  return (
    <div className="w-full bg-gray-900/95 border border-purple-500/40 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl my-6 backdrop-blur-md relative overflow-hidden animate-fade-in">
      {/* Top Banner Grade Score */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-800 gap-4">
        <div>
          <span className="text-xs font-extrabold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" /> A&R Board Final Evaluation
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <h2 className="text-4xl font-black text-white bg-gradient-to-r from-purple-300 via-pink-400 to-cyan-300 bg-clip-text text-transparent">
              {overallScore.toFixed(1)} <span className="text-2xl text-gray-500 font-normal">/ 10</span>
            </h2>
            <span className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/50 text-xs font-black text-purple-200 uppercase tracking-wider">
              {gradeBadge}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              playHoverSound(audioEnabled);
              startNewDraft();
            }}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Draft Again</span>
          </button>

          {draftedTracks.length > 0 && (
            <>
              <button
                onClick={() => {
                  playHoverSound(audioEnabled);
                  openRealSongPlayer(draftedTracks[0].song);
                }}
                className="px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-extrabold text-xs transition border border-purple-500/40 flex items-center gap-2 cursor-pointer"
              >
                <Disc className="w-4 h-4 text-pink-400" />
                <span>Listen Album in App</span>
              </button>

              {onOpenFriendsModal && (
                <button
                  onClick={() => {
                    playHoverSound(audioEnabled);
                    onOpenFriendsModal();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-pink-950 hover:bg-pink-900 text-pink-200 font-extrabold text-xs transition border border-pink-700/60 flex items-center gap-2 cursor-pointer"
                >
                  <Swords className="w-4 h-4 text-pink-400" />
                  <span>1v1 Matchup Card</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={() => {
              playHoverSound(audioEnabled);
              onOpenExport();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:opacity-95 text-white font-extrabold text-xs transition shadow-lg shadow-purple-900/40 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Export Playlist</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* A&R Hindsight Score & Optimal Track Breakdown */}
      {optimalScore && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-pink-950/70 border border-purple-800/60 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  A&R Hindsight Score Analysis
                </h4>
                <p className="text-xs text-purple-200">
                  Your Score: <strong className="text-white">{overallScore.toFixed(1)}</strong> • Theoretical Optimal Benchmark: <strong className="text-amber-300">{optimalScore.toFixed(1)} / 10</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowOptimalDetails(!showOptimalDetails)}
              className="px-3 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 font-bold text-xs border border-purple-700 transition cursor-pointer self-start sm:self-auto"
            >
              {showOptimalDetails ? 'Hide Optimal Benchmark' : 'View Optimal Benchmark'}
            </button>
          </div>

          {showOptimalDetails && optimalPicks && (
            <div className="mt-2 pt-3 border-t border-purple-900/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {optimalPicks.map((pick, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-gray-950/90 border border-purple-900/40">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                    Slot {idx + 1}: {pick.slotName}
                  </span>
                  <span className="font-extrabold text-white block mt-0.5">
                    {pick.bestSongTitle} — <span className="text-gray-300 font-normal">{pick.bestArtist}</span>
                  </span>
                  <span className="text-[10px] text-gray-400 italic block mt-1">
                    {pick.reason}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Penalty / Pacing Notice if any */}
      {monopolyReport.hasViolation && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>
            Monopoly Penalty Deducted:{' '}
            <strong className="text-red-300">-{monopolyReport.totalPenaltyDeduction} Points</strong> due to excess solo tracks for {monopolyReport.penalizedArtists.map(p => p.artist).join(', ')}.
          </span>
        </div>
      )}

      {/* Sub-scores Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80">
          <span className="text-[11px] text-gray-400 block font-medium">Flow & Pacing</span>
          <span className="text-lg font-bold text-purple-300">{subScores.pacing.toFixed(1)} / 10</span>
        </div>
        <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80">
          <span className="text-[11px] text-gray-400 block font-medium">Artist Synergy</span>
          <span className="text-lg font-bold text-pink-300">{subScores.synergy.toFixed(1)} / 10</span>
        </div>
        <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80">
          <span className="text-[11px] text-gray-400 block font-medium">Album Cohesion</span>
          <span className="text-lg font-bold text-cyan-300">{subScores.cohesion.toFixed(1)} / 10</span>
        </div>
        <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80">
          <span className="text-[11px] text-gray-400 block font-medium">Star Power</span>
          <span className="text-lg font-bold text-amber-300">{subScores.starPower.toFixed(1)} / 10</span>
        </div>
      </div>

      {/* Critic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviews.map((rev) => (
          <div
            key={rev.personaId}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className="bg-gray-950 p-5 rounded-2xl border border-gray-800/90 hover:border-purple-500/50 transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-white group-hover:text-purple-300 transition">
                    {rev.name}
                  </h4>
                  <span className="text-[10px] text-gray-400 block">{rev.role}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 text-xs font-bold">
                  {rev.score.toFixed(1)} / 10
                </span>
              </div>

              <blockquote className="text-xs text-gray-300 italic bg-gray-900/60 p-3 rounded-xl border border-gray-800/60 mb-3 leading-relaxed">
                &quot;{rev.quote}&quot;
              </blockquote>

              <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                {rev.detailedAnalysis}
              </p>
            </div>

            <div className="pt-2 border-t border-gray-800/80 flex justify-between items-center text-[10px]">
              <span className="text-gray-400 font-medium">Key Highlight:</span>
              <span className="font-bold text-pink-400">{rev.keyHighlight}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
