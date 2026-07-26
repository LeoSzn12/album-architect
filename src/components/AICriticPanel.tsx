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
  ChevronDown,
  ChevronUp,
  Target,
  Music2,
  Zap,
  Layers,
} from 'lucide-react';
import { playHoverSound, playDraftCompleteFanfare } from '@/lib/audioEngine';
import { scoreToVerdict } from '@/lib/scoringEngine';

interface AICriticPanelProps {
  onOpenExport: () => void;
  onOpenFriendsModal?: () => void;
}

/** Map score 1–10 to a Tailwind color class */
function scoreColor(score: number): string {
  if (score >= 9.0) return 'text-cyan-300';
  if (score >= 8.0) return 'text-purple-300';
  if (score >= 7.0) return 'text-green-300';
  if (score >= 6.0) return 'text-amber-300';
  return 'text-red-300';
}

/** Color for the verdict banner */
function verdictGradient(score: number): string {
  if (score >= 9.2) return 'from-cyan-900/60 via-purple-900/40 to-pink-900/60 border-cyan-700/60';
  if (score >= 8.5) return 'from-purple-900/60 via-pink-900/40 to-indigo-900/60 border-purple-700/60';
  if (score >= 7.5) return 'from-emerald-900/60 via-teal-900/40 to-indigo-900/60 border-emerald-700/60';
  if (score >= 6.0) return 'from-amber-900/60 via-orange-900/40 to-yellow-900/60 border-amber-700/60';
  return 'from-red-950/60 via-rose-900/40 to-red-900/60 border-red-800/60';
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

  const [showCriticBoard, setShowCriticBoard] = useState(false);
  const [showBestPossible, setShowBestPossible] = useState(false);
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

  useEffect(() => {
    if (!evaluationResult) {
      hasCelebratedRef.current = false;
    }
  }, [evaluationResult]);

  // 12-second timeout for evaluating state
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
          Scoring Your Draft…
        </h3>
        <p className="text-xs text-gray-400 max-w-sm mb-4">
          Calculating Slot Fit, Album Flow, Cohesion, and Impact. Then the A&R critics narrate.
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
            <span>Taking a while? Use Instant Score</span>
          </button>
        )}
      </div>
    );
  }

  if (!evaluationResult) return null;

  const {
    overallScore,
    rawScore,
    monopolyPenalty,
    gradeBadge,
    subScores,
    reviews,
    monopolyReport,
    bestPossibleScore,
    draftEfficiency,
    bestPossibleTracklist,
    biggestMistake,
    smartestPick,
    source,
  } = evaluationResult;

  const verdict = scoreToVerdict(overallScore);
  const scoreCategoryItems = [
    { label: 'Slot Fit', weight: '35%', score: subScores.slotFit, icon: Target, color: 'text-purple-300' },
    { label: 'Album Flow', weight: '25%', score: subScores.albumFlow, icon: Zap, color: 'text-pink-300' },
    { label: 'Cohesion', weight: '20%', score: subScores.cohesion, icon: Layers, color: 'text-cyan-300' },
    { label: 'Impact', weight: '20%', score: subScores.impact, icon: Music2, color: 'text-amber-300' },
  ];

  return (
    <div className="w-full bg-gray-900/95 border border-purple-500/40 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl my-6 backdrop-blur-md relative overflow-hidden animate-fade-in">

      {/* ── 1. Verdict Banner ── */}
      <div className={`p-6 rounded-2xl bg-gradient-to-br ${verdictGradient(overallScore)} border text-center flex flex-col items-center gap-2`}>
        <Trophy className="w-8 h-8 text-amber-400" />
        <div className="text-4xl font-black bg-gradient-to-r from-purple-300 via-pink-400 to-cyan-300 bg-clip-text text-transparent">
          {verdict}
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-5xl font-black ${scoreColor(overallScore)}`}>
            {overallScore.toFixed(1)}
          </span>
          <span className="text-gray-400 text-lg">/ 10</span>
        </div>
        <span className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/50 text-xs font-black text-purple-200 uppercase tracking-wider">
          {gradeBadge}
        </span>
        {source === 'fallback' && (
          <span className="text-[10px] text-gray-500 font-medium mt-1">
            Scored by Deterministic Engine (no AI key)
          </span>
        )}
      </div>

      {/* ── 2. Score Breakdown ── */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">
          Score Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {scoreCategoryItems.map(({ label, weight, score, icon: Icon, color }) => (
            <div key={label} className="bg-gray-950 p-3 rounded-xl border border-gray-800/80 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-[11px] text-gray-400 font-medium">{label}</span>
              </div>
              <span className={`text-xl font-black ${color}`}>{score.toFixed(1)}</span>
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-current ${color} opacity-60`}
                  style={{ width: `${(score / 10) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-600 font-bold">{weight}</span>
            </div>
          ))}
        </div>

        {/* Raw score breakdown */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-500 font-medium">
          <span>Raw: <strong className="text-gray-300">{rawScore.toFixed(1)}</strong></span>
          {monopolyPenalty > 0 && (
            <>
              <span>−</span>
              <span className="text-red-400 font-bold">
                {monopolyPenalty} pts (Monopoly)
              </span>
              <span>=</span>
              <span className="text-white font-bold">{overallScore.toFixed(1)}</span>
            </>
          )}
        </div>
      </div>

      {/* ── 3. Monopoly Warning ── */}
      {monopolyReport.hasViolation && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Monopoly penalty −{monopolyReport.totalPenaltyDeduction} pts:</strong>{' '}
            {monopolyReport.penalizedArtists.map((p) => `${p.artist} (${p.soloCount}× solo)`).join(', ')}.
            {' '}Vary your solo artists across slots to avoid this.
          </span>
        </div>
      )}

      {/* ── 4. Final Tracklist ── */}
      {draftedTracks.length > 0 && (
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">
            Your Draft
          </h3>
          <div className="flex flex-col gap-2">
            {draftedTracks.map((dt, i) => (
              <button
                key={dt.song.id}
                onClick={() => openRealSongPlayer(dt.song)}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-950 border border-gray-800 hover:border-purple-700/60 transition group text-left cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-purple-950 text-purple-300 text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${dt.song.gradient} flex-shrink-0 flex items-center justify-center`}
                >
                  <Disc className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition">
                    {dt.song.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{dt.song.rawArtistString} • {dt.slot.name}</p>
                </div>
                <span className="text-xs font-bold text-gray-600 group-hover:text-purple-400 transition flex-shrink-0">
                  {dt.song.energy}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Draft Efficiency & Best Possible ── */}
      {bestPossibleScore !== undefined && draftEfficiency !== undefined && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-pink-950/70 border border-purple-800/60 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-extrabold text-white">Draft Efficiency</h4>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-300">
                  Your score: <strong className="text-white">{overallScore.toFixed(1)}</strong>
                </span>
                <span className="text-gray-500">vs</span>
                <span className="text-gray-300">
                  Best possible: <strong className="text-amber-300">{bestPossibleScore.toFixed(1)}</strong>
                </span>
              </div>
            </div>
            <div className={`text-3xl font-black ${draftEfficiency >= 90 ? 'text-cyan-400' : draftEfficiency >= 75 ? 'text-purple-300' : 'text-amber-400'}`}>
              {draftEfficiency}%
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
              style={{ width: `${draftEfficiency}%` }}
            />
          </div>

          {/* Smartest / Biggest Mistake */}
          <div className="flex flex-col sm:flex-row gap-2 text-xs">
            {smartestPick && (
              <div className="flex-1 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60">
                <p className="font-extrabold text-emerald-300 mb-0.5">✓ Smartest Pick</p>
                <p className="text-white font-bold">{smartestPick.songTitle}</p>
                <p className="text-emerald-400/80 text-[10px]">{smartestPick.slotName}: {smartestPick.reason}</p>
              </div>
            )}
            {biggestMistake && (
              <div className="flex-1 p-2.5 rounded-xl bg-red-950/60 border border-red-800/60">
                <p className="font-extrabold text-red-300 mb-0.5">✗ Biggest Mistake</p>
                <p className="text-white font-bold">{biggestMistake.playerPick}</p>
                <p className="text-red-400/80 text-[10px]">
                  {biggestMistake.slotName}: {biggestMistake.bestAvailable} was better
                </p>
              </div>
            )}
          </div>

          {/* Toggleable best possible tracklist */}
          {bestPossibleTracklist && bestPossibleTracklist.length > 0 && (
            <button
              onClick={() => setShowBestPossible(!showBestPossible)}
              className="text-xs text-purple-300 hover:text-purple-200 font-bold flex items-center gap-1 cursor-pointer self-start"
            >
              {showBestPossible ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showBestPossible ? 'Hide' : 'Show'} Best Possible Album
            </button>
          )}

          {showBestPossible && bestPossibleTracklist && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-1">
              {bestPossibleTracklist.map((pick, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-gray-950/90 border border-purple-900/40">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                    {pick.slotName}
                  </span>
                  <span className="font-extrabold text-white block mt-0.5">
                    {pick.songTitle}{' '}
                    <span className="text-gray-400 font-normal">— {pick.artist}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 6. Actions ── */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-800/60">
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

        {onOpenFriendsModal && (
          <button
            onClick={() => {
              playHoverSound(audioEnabled);
              onOpenFriendsModal();
            }}
            className="px-4 py-2.5 rounded-xl bg-pink-950 hover:bg-pink-900 text-pink-200 font-extrabold text-xs transition border border-pink-700/60 flex items-center gap-2 cursor-pointer"
          >
            <Swords className="w-4 h-4 text-pink-400" />
            <span>1v1 Matchup</span>
          </button>
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

      {/* ── 7. A&R Critic Board (collapsed by default) ── */}
      <div className="border border-gray-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowCriticBoard(!showCriticBoard)}
          className="w-full p-4 flex items-center justify-between text-left bg-gray-950/80 hover:bg-gray-900 transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-extrabold text-white">A&R Critic Board Reviews</span>
            <span className="text-xs text-gray-500">
              {source === 'gemini' ? 'AI-narrated' : 'Deterministic'}
            </span>
          </div>
          {showCriticBoard ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showCriticBoard && reviews && (
          <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.personaId}
                onMouseEnter={() => playHoverSound(audioEnabled)}
                className="bg-gray-950 p-4 rounded-2xl border border-gray-800/90 hover:border-purple-500/50 transition flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{rev.name}</h4>
                    <span className="text-[10px] text-gray-400">{rev.role}</span>
                  </div>
                  <span className={`text-sm font-black ${scoreColor(rev.score)}`}>
                    {rev.score.toFixed(1)}
                  </span>
                </div>

                <blockquote className="text-xs text-gray-300 italic bg-gray-900/60 p-3 rounded-xl border border-gray-800/60 leading-relaxed">
                  &quot;{rev.quote}&quot;
                </blockquote>

                <div className="pt-2 border-t border-gray-800/80 flex justify-between items-center text-[10px]">
                  <span className="text-gray-500 font-medium">Highlight:</span>
                  <span className="font-bold text-pink-400">{rev.keyHighlight}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
