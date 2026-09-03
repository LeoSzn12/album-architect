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
  DollarSign,
  Crown,
  Flame,
  Award,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { playHoverSound, playDraftCompleteFanfare } from '@/lib/audioEngine';
import { scoreToVerdict } from '@/lib/scoringEngine';
import { deriveCuratorPersona } from '@/lib/curatorPersona';
import { buildWordleShareData, formatWordleShareText } from '@/lib/wordleShare';

interface AICriticPanelProps {
  onOpenExport: () => void;
  onOpenFriendsModal?: () => void;
}

/** Map score 1–10 to a Tailwind color class */
function scoreColor(score: number): string {
  if (score >= 9.0) return 'text-emerald-400';
  if (score >= 8.0) return 'text-zinc-100';
  if (score >= 7.0) return 'text-amber-400';
  if (score >= 6.0) return 'text-zinc-400';
  return 'text-rose-400';
}

/** Color for the verdict banner */
function verdictGradient(score: number): string {
  if (score >= 9.2) return 'bg-[#15151e] border-white/[0.15]';
  if (score >= 8.5) return 'bg-[#121218] border-white/[0.12]';
  if (score >= 7.5) return 'bg-[#121216] border-white/[0.1]';
  if (score >= 6.0) return 'bg-[#111114] border-white/[0.08]';
  return 'bg-[#140e10] border-rose-500/30';
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
    opponentEvaluationResult,
    gameMode,
    draftSeed,
  } = useDraftStore();

  const [showCriticBoard, setShowCriticBoard] = useState(false);
  const [showBestPossible, setShowBestPossible] = useState(false);
  const [showTimeoutFallback, setShowTimeoutFallback] = useState(false);
  const [copiedWordle, setCopiedWordle] = useState(false);
  const hasCelebratedRef = useRef(false);

  const curatorPersona = React.useMemo(() => {
    return deriveCuratorPersona(draftedTracks);
  }, [draftedTracks]);

  const wordleData = React.useMemo(() => {
    if (!evaluationResult) return null;
    return buildWordleShareData(evaluationResult, draftedTracks, gameMode, draftSeed, curatorPersona);
  }, [evaluationResult, draftedTracks, gameMode, draftSeed, curatorPersona]);

  const handleCopyWordle = () => {
    if (!wordleData) return;
    playHoverSound(audioEnabled);
    const text = formatWordleShareText(wordleData);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedWordle(true);
      setTimeout(() => setCopiedWordle(false), 2500);
    }
  };

  // Confetti & fanfare: execute strictly ONCE per unique evaluation result
  useEffect(() => {
    if (evaluationResult && !hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      playDraftCompleteFanfare(audioEnabled);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#fa233b', '#71717a', '#fbbf24'],
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
    const projectLabel = gameMode === 'draft' ? 'Draft' : gameMode === 'ep' ? 'EP' : 'Album';
    return (
      <div className="w-full bg-[#0e0e12]/95 border border-white/[0.08] rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-2xl my-6 backdrop-blur-2xl">
        <div className="w-16 h-16 rounded-full border-4 border-white/[0.08] border-t-rose-500 animate-spin mb-4" />
        <h3 className="text-xl font-black text-white mb-1">
          Scoring Your {projectLabel}…
        </h3>
        <p className="text-xs text-zinc-400 max-w-sm mb-4">
          Calculating Slot Fit, Album Flow, Cohesion, and Impact. Then the A&R critics narrate.
        </p>

        {showTimeoutFallback && (
          <button
            onClick={() => {
              playHoverSound(audioEnabled);
              evaluateDraft();
            }}
            className="px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 text-xs font-extrabold transition flex items-center gap-2 cursor-pointer animate-fade-in active:scale-95"
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
    categoryScores,
    executiveSummary,
    budgetReport,
    activeTheme,
    achievedSynergies,
    crowdHype,
    curatorBadges,
  } = evaluationResult;

  const projectLabel = gameMode === 'draft' ? 'Draft' : gameMode === 'ep' ? 'EP' : gameMode === 'budget' ? '$15 Budget' : 'Album';
  const reviewTitle = gameMode === 'draft' ? 'TrackDraft Match Review' : `${projectLabel} Builder Review`;

  const verdict = scoreToVerdict(overallScore);
  const scoreCategoryItems = [
    { label: 'Slot Fit', weight: '35%', score: subScores.slotFit, icon: Target, color: 'text-zinc-200' },
    { label: 'Album Flow', weight: '25%', score: subScores.albumFlow, icon: Zap, color: 'text-rose-400' },
    { label: 'Cohesion', weight: '20%', score: subScores.cohesion, icon: Layers, color: 'text-zinc-300' },
    { label: 'Impact', weight: '20%', score: subScores.impact, icon: Music2, color: 'text-amber-400' },
  ];
  const transparentCategoryItems = categoryScores
    ? [
        ['Slot Fit', categoryScores.slotFit],
        ['Sequencing & Flow', categoryScores.sequencingFlow],
        ['Narrative / Concept', categoryScores.narrativeConcept],
        ['Variety & Balance', categoryScores.varietyBalance],
        ['Energy Curve', categoryScores.energyCurve],
        ['Originality / Taste', categoryScores.originalityTaste],
        ['Replay Value', categoryScores.replayValue],
      ] as const
    : [];

  return (
    <div className="w-full bg-[#0e0e12]/95 border border-white/[0.08] rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl my-6 backdrop-blur-2xl relative overflow-hidden animate-fade-in">

      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400">Final review complete</span>
          <h2 className="mt-1 text-xl font-black text-white">{reviewTitle}</h2>
          <p className="mt-1 text-xs text-zinc-400">
            {draftedTracks.length} tracks reviewed in final order. This scorecard is saved in your local history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTheme && activeTheme !== 'standard' && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-400" />
              {activeTheme}
            </span>
          )}
          <span className="self-start rounded-full border border-white/[0.1] bg-white/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-300 sm:self-center">
            {projectLabel} · {draftedTracks.length} tracks
          </span>
        </div>
      </div>

      {/* ── 1. Verdict Banner ── */}
      <div className={`p-6 rounded-3xl ${verdictGradient(overallScore)} border text-center flex flex-col items-center gap-2 shadow-xl`}>
        <Trophy className="w-8 h-8 text-amber-400" />
        <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {verdict}
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-5xl sm:text-6xl font-black ${scoreColor(overallScore)}`}>
            {overallScore.toFixed(1)}
          </span>
          <span className="text-zinc-500 text-lg font-bold">/ 10</span>
        </div>
        <span className="px-3.5 py-1 rounded-full bg-white/[0.08] border border-white/[0.12] text-xs font-black text-zinc-200 uppercase tracking-widest">
          {gradeBadge}
        </span>
        {source === 'fallback' && (
          <span className="text-[10px] text-zinc-500 font-medium mt-1">
            Scored by Deterministic Engine (no AI key)
          </span>
        )}
      </div>

      {/* ── Curator DNA / DJ Persona Spotlight Banner ── */}
      <div className="p-5 rounded-3xl bg-[#121216]/90 border border-white/[0.08] shadow-xl text-white relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.08] shadow-inner flex items-center justify-center flex-shrink-0">
            <Crown className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
                Curator DNA Persona
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-[9px] font-extrabold text-zinc-300">
                1-of-1 Sonic Profile
              </span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white mt-0.5">
              {curatorPersona.title}
            </h3>
            <p className="text-xs text-zinc-300 font-medium max-w-lg mt-0.5">
              {curatorPersona.tagline}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1.5 self-stretch md:self-auto">
          <div className="flex flex-wrap gap-1.5">
            {curatorPersona.traits.map((trait) => (
              <span key={trait} className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] font-extrabold text-zinc-200">
                {trait}
              </span>
            ))}
          </div>
          <span className="text-[10px] font-semibold text-zinc-400 italic">
            &quot;{curatorPersona.crowdReputation}&quot;
          </span>
        </div>
      </div>

      {/* ── Wordle-Style Share Card (1-Tap Viral Copy) ── */}
      {wordleData && (
        <div className="p-5 rounded-3xl bg-[#121216]/90 border border-white/[0.08] shadow-xl flex flex-col gap-3 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-rose-500">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>The Wordle Share Grid</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400">
                    VIRAL READY
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-400">
                  1-tap copy formatted for Twitter/X, Discord, and iMessage group chats.
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyWordle}
              className={`w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-full font-black text-xs transition flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 ${
                copiedWordle
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-zinc-200 text-black'
              }`}
            >
              {copiedWordle ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Share Grid</span>
                </>
              )}
            </button>
          </div>

          {/* Live Visual Grid Preview */}
          <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.06] flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-300">
                {wordleData.projectName} · {overallScore.toFixed(1)}/10 ({gradeBadge})
              </span>
              <span className="font-extrabold text-rose-400 text-[11px] tracking-wide">
                {wordleData.statusText}
              </span>
            </div>

            {/* Emoji row */}
            <div className="flex items-center gap-1 text-base select-none">
              {wordleData.slotsBreakdown.map((s, idx) => (
                <span key={idx} title={`${s.slotName}: ${s.songTitle} (${s.synergyScore}% synergy)`}>
                  {s.emojiSquare}
                </span>
              ))}
            </div>

            {/* Micro Tracklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-zinc-400 font-mono">
              {wordleData.slotsBreakdown.slice(0, 4).map((s, idx) => (
                <div key={idx} className="truncate flex items-center gap-1.5">
                  <span>{s.emojiSquare}</span>
                  <span className="text-zinc-200 truncate">{s.songTitle}</span>
                  <span className="text-zinc-500 truncate">— {s.artist}</span>
                </div>
              ))}
              {wordleData.slotsBreakdown.length > 4 && (
                <div className="text-[10px] text-zinc-500 italic flex items-center pl-1">
                  +{wordleData.slotsBreakdown.length - 4} more tracks in grid
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Curator Badges ── */}
      {curatorBadges && curatorBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-rose-500" /> Curator Badges Earned:
          </span>
          {curatorBadges.map((badge) => (
            <span
              key={badge}
              className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-black text-zinc-200 shadow-sm flex items-center gap-1"
            >
              ✨ {badge}
            </span>
          ))}
        </div>
      )}

      {/* ── $15 Budget Efficiency Breakdown ── */}
      {budgetReport && (
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Aux Budget Efficiency Report
                </span>
                <h4 className="text-base font-black text-white">
                  {budgetReport.executiveRating}
                </h4>
              </div>
            </div>
            <p className="text-xs text-zinc-300 mt-1">
              Spent ${budgetReport.totalSpent} of ${budgetReport.initialBudget} (${budgetReport.remainingBudget} leftover) • Efficiency Score: {budgetReport.efficiencyScore.toFixed(0)}/100
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-black/40 border border-emerald-500/30 text-right">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">ROI Score</span>
            <span className="text-xl font-black text-emerald-400">{budgetReport.efficiencyScore.toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* ── Aux Crowd Hype & Achieved Synergies ── */}
      {(crowdHype || (achievedSynergies && achievedSynergies.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {crowdHype && (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-500" /> Aux Crowd Heat: {crowdHype.score}% ({crowdHype.status})
              </span>
              <p className="text-xs text-zinc-300 italic">“{crowdHype.reactionQuote}”</p>
            </div>
          )}
          {achievedSynergies && achievedSynergies.length > 0 && (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Synergies Unlocked ({achievedSynergies.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {achievedSynergies.map((s) => (
                  <span key={s.id} className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-200 font-bold">
                    {s.name} (+{s.bonusPoints})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {opponentEvaluationResult && (
        <div className="rounded-2xl border border-white/[0.1] bg-[#121216]/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400">Draft Mode head-to-head</span>
            <h3 className="text-lg font-black text-white mt-1">
              {overallScore > opponentEvaluationResult.overallScore ? 'You beat the AI.' : overallScore < opponentEvaluationResult.overallScore ? 'The AI wins this round.' : 'It’s a tie.'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Same configured candidate pool • hidden pick revealed after lock</p>
          </div>
          <div className="flex items-center gap-5 text-right">
            <div><span className="block text-[10px] text-zinc-500 uppercase font-bold">You</span><span className="text-2xl font-black text-white">{overallScore.toFixed(1)}</span></div>
            <span className="text-zinc-600 font-black">vs</span>
            <div><span className="block text-[10px] text-zinc-500 uppercase font-bold">AI</span><span className="text-2xl font-black text-zinc-300">{opponentEvaluationResult.overallScore.toFixed(1)}</span></div>
          </div>
        </div>
      )}

      {/* ── 2. Score Breakdown ── */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">
          Score Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {scoreCategoryItems.map(({ label, weight, score, icon: Icon, color }) => (
            <div key={label} className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.08] flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-[11px] text-zinc-400 font-bold">{label}</span>
              </div>
              <span className={`text-2xl font-black ${color}`}>{score.toFixed(1)}</span>
              <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${(score / 10) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 font-extrabold">{weight}</span>
            </div>
          ))}
        </div>

        {/* Raw score breakdown */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-zinc-400 font-medium">
          <span>Raw: <strong className="text-zinc-200">{rawScore.toFixed(1)}</strong></span>
          {monopolyPenalty > 0 && (
            <>
              <span>−</span>
              <span className="text-rose-400 font-bold">
                {monopolyPenalty} pts (Monopoly)
              </span>
              <span>=</span>
              <span className="text-white font-bold">{overallScore.toFixed(1)}</span>
            </>
          )}
        </div>

        {categoryScores && (
          <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300">Transparent A&R Scorecard</h3>
                <p className="text-xs text-zinc-400 mt-1">Every category is scored 0–100 with evidence; penalties are shown separately.</p>
              </div>
              <span className="text-xs font-black text-white">{evaluationResult.weightedScoreBeforePenalties ?? '—'} / 100 before penalties</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {transparentCategoryItems.map(([label, item]) => (
                <div key={label} className="rounded-xl bg-black/40 border border-white/[0.06] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{label}</span>
                    <span className="text-sm font-black text-zinc-200">{item.score}</span>
                  </div>
                  <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${item.score}%` }} />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">{item.evidence[0]}</p>
                </div>
              ))}
            </div>
            {executiveSummary && <p className="text-xs text-zinc-300 mt-3 leading-relaxed">{executiveSummary}</p>}
          </div>
        )}
      </div>

      {/* ── 3. Monopoly Warning ── */}
      {monopolyReport.hasViolation && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
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
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">
            Final {projectLabel} Tracklist
          </h3>
          <div className="flex flex-col gap-2">
            {draftedTracks.map((dt, i) => (
              <button
                key={dt.song.id}
                onClick={() => openRealSongPlayer(dt.song)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.15] transition group text-left cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-white/[0.06] text-zinc-300 text-xs font-black flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500 group-hover:text-white transition">
                  {i + 1}
                </span>
                <div
                  className={`w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex-shrink-0 flex items-center justify-center`}
                >
                  <Disc className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate group-hover:text-rose-400 transition">
                    {dt.song.title}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">{dt.song.rawArtistString} • {dt.slot.name}</p>
                </div>
                <span className="text-xs font-bold text-zinc-500 group-hover:text-rose-400 transition flex-shrink-0">
                  {dt.song.energy}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Draft Efficiency & Best Possible ── */}
      {bestPossibleScore !== undefined && draftEfficiency !== undefined && (
        <div className="p-5 rounded-3xl bg-[#121216]/90 border border-white/[0.08] flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-black text-white">Draft Efficiency</h4>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-zinc-400">
                  Your score: <strong className="text-white">{overallScore.toFixed(1)}</strong>
                </span>
                <span className="text-zinc-600">vs</span>
                <span className="text-zinc-400">
                  Best possible: <strong className="text-amber-400">{bestPossibleScore.toFixed(1)}</strong>
                </span>
              </div>
            </div>
            <div className={`text-3xl font-black ${draftEfficiency >= 90 ? 'text-emerald-400' : draftEfficiency >= 75 ? 'text-zinc-100' : 'text-amber-400'}`}>
              {draftEfficiency}%
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${draftEfficiency}%` }}
            />
          </div>

          {/* Smartest / Biggest Mistake */}
          <div className="flex flex-col sm:flex-row gap-2 text-xs">
            {smartestPick && (
              <div className="flex-1 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="font-black text-emerald-400 mb-0.5">✓ Smartest Pick</p>
                <p className="text-white font-bold">{smartestPick.songTitle}</p>
                <p className="text-emerald-300/80 text-[10px]">{smartestPick.slotName}: {smartestPick.reason}</p>
              </div>
            )}
            {biggestMistake && (
              <div className="flex-1 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <p className="font-black text-rose-400 mb-0.5">✗ Biggest Mistake</p>
                <p className="text-white font-bold">{biggestMistake.playerPick}</p>
                <p className="text-rose-300/80 text-[10px]">
                  {biggestMistake.slotName}: {biggestMistake.bestAvailable} was better
                </p>
              </div>
            )}
          </div>

          {/* Toggleable best possible tracklist */}
          {bestPossibleTracklist && bestPossibleTracklist.length > 0 && (
            <button
              onClick={() => setShowBestPossible(!showBestPossible)}
              className="text-xs text-zinc-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer self-start"
            >
              {showBestPossible ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showBestPossible ? 'Hide' : 'Show'} Best Possible Album
            </button>
          )}

          {showBestPossible && bestPossibleTracklist && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-1">
              {bestPossibleTracklist.map((pick, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-black/60 border border-white/[0.08]">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    {pick.slotName}
                  </span>
                  <span className="font-extrabold text-white block mt-0.5">
                    {pick.songTitle}{' '}
                    <span className="text-zinc-400 font-normal">— {pick.artist}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 6. Actions ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-3 border-t border-white/[0.08]">
        <button
          onClick={() => {
            playHoverSound(audioEnabled);
            startNewDraft();
          }}
          className="min-h-[44px] px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 font-extrabold text-xs transition border border-white/[0.08] flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
            className="min-h-[44px] px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 font-extrabold text-xs transition border border-white/[0.08] flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Swords className="w-4 h-4 text-rose-500" />
            <span>1v1 Matchup</span>
          </button>
        )}

        <button
          onClick={() => {
            playHoverSound(audioEnabled);
            onOpenExport();
          }}
          className="min-h-[44px] flex-1 px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-black text-xs transition shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-rose-500" />
          <span>Export {projectLabel} Playlist</span>
          <ArrowRight className="w-4 h-4 text-black" />
        </button>
      </div>

      {/* ── 7. A&R Critic Board (collapsed by default) ── */}
      <div className="border border-white/[0.08] rounded-3xl overflow-hidden bg-white/[0.02]">
        <button
          onClick={() => setShowCriticBoard(!showCriticBoard)}
          className="w-full p-4 flex items-center justify-between text-left bg-white/[0.03] hover:bg-white/[0.06] transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-black text-white">A&R Critic Board Reviews</span>
            <span className="text-xs text-zinc-500">
              {source === 'gemini' ? 'AI-narrated' : 'Deterministic'}
            </span>
          </div>
          {showCriticBoard ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        {showCriticBoard && reviews && (
          <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.personaId}
                onMouseEnter={() => playHoverSound(audioEnabled)}
                className="bg-[#121216]/85 p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.15] transition flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{rev.name}</h4>
                    <span className="text-[10px] text-zinc-400">{rev.role}</span>
                  </div>
                  <span className={`text-sm font-black ${scoreColor(rev.score)}`}>
                    {rev.score.toFixed(1)}
                  </span>
                </div>

                <blockquote className="text-xs text-zinc-300 italic bg-black/40 p-3 rounded-xl border border-white/[0.06] leading-relaxed">
                  &quot;{rev.quote}&quot;
                </blockquote>

                <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center text-[10px]">
                  <span className="text-zinc-500 font-medium">Highlight:</span>
                  <span className="font-bold text-rose-400">{rev.keyHighlight}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
