'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { useSnippetAudio } from '@/hooks/useSnippetAudio';
import { DraftCard } from './DraftCard';
import { CompareModal } from './CompareModal';
import {
  RefreshCw,
  Sparkles,
  Trophy,
  Undo2,
  AlertCircle,
  Swords,
  EyeOff,
  Headphones,
  ArrowRightLeft,
  Flame,
  Volume2,
  Dice5,
  X,
  Plus,
  DollarSign,
  Crown,
  Disc3,
} from 'lucide-react';
import {
  playHoverSound,
  playRerollSound,
  playDraftLockSound,
  playCrowdCheerSound,
  playCrowdGaspSound,
} from '@/lib/audioEngine';
import { eraLabel } from '@/lib/eraSequence';
import {
  enrichCandidatesWithFlowIntelligence,
  pickWildcardCandidate,
} from '@/lib/flowIntelligence';
import { CrowdStageVisualizer } from './CrowdStageVisualizer';
import { AuxHypeMeter } from './AuxHypeMeter';
import { SynergyDisplay } from './SynergyDisplay';
import type { Song } from '@/types/draft';

interface DraftBoardProps {
  onEvaluateTrigger: () => void;
}

export const DraftBoard: React.FC<DraftBoardProps> = ({ onEvaluateTrigger }) => {
  const {
    slots,
    currentRoundIndex,
    currentOptions,
    draftSong,
    draftedTracks,
    undoLastPick,
    rerollTokens,
    useRerollToken: triggerRerollToken,
    difficulty,
    draftSeed,
    audioEnabled,
    eraSequence,
    gameMode,
    lastOpponentReveal,
    challengeTheme,
    budgetRemaining,
    monopolyReport,
    activeSynergies,
    crowdHype,
  } = useDraftStore();

  const { toggleSong, isSongPlaying, stop } = useSnippetAudio();

  const [compareSelection, setCompareSelection] = useState<Song[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [hoveredCandidate, setHoveredCandidate] = useState<Song | null>(null);

  // Surprise Wildcard Spin state
  const [wildcardModalOpen, setWildcardModalOpen] = useState(false);
  const [unlockedWildcard, setUnlockedWildcard] = useState<Song | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<'carousel' | 'list'>('carousel');
  const [activeMobileCardIndex, setActiveMobileCardIndex] = useState(0);
  const carouselRef = React.useRef<HTMLDivElement>(null);

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const cardWidth = carouselRef.current.clientWidth * 0.86;
    const newIdx = Math.round(scrollLeft / (cardWidth + 14));
    setActiveMobileCardIndex(Math.min(Math.max(0, newIdx), currentOptions.length - 1));
  };

  const scrollToCandidate = (index: number) => {
    playHoverSound(audioEnabled);
    setActiveMobileCardIndex(index);
    if (!carouselRef.current) return;
    const targetChild = carouselRef.current.children[index] as HTMLElement | undefined;
    if (targetChild) {
      targetChild.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const isCompleted = currentRoundIndex >= slots.length;
  const currentSlot = slots[currentRoundIndex];
  const projectLabel = gameMode === 'draft' ? 'Draft' : gameMode === 'ep' ? 'EP' : gameMode === 'budget' ? '$15 Budget' : 'Album';
  const trackLabel = gameMode === 'draft' ? 'Round' : `${projectLabel} Track`;
  const completionLabel = gameMode === 'draft' ? 'Draft Complete' : `${projectLabel} Ready for Review`;
  const reviewActionLabel = gameMode === 'draft' ? 'Get Your Score' : `Review ${projectLabel}`;

  // Auto-assigned era for this round
  const currentEra = eraSequence[currentRoundIndex];
  const currentEraLabel = currentEra ? eraLabel(currentEra) : null;

  // Reset comparison and hover anticipation on round change
  useEffect(() => {
    setCompareSelection([]);
    setIsCompareOpen(false);
    setHoveredCandidate(null);
    setActiveMobileCardIndex(0);
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = 0;
    }
  }, [currentRoundIndex]);

  // Keyboard Shortcuts:
  // 1-5: Audition Candidate 1 to 5
  // Space: Toggle current snippet
  // C: Compare shortlisted
  // R: Reroll
  // Cmd+Z: Undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Cmd+Z / Ctrl+Z shortcut for Undo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (draftedTracks.length > 0 && !isCompleted) {
          e.preventDefault();
          playDraftLockSound(audioEnabled);
          undoLastPick();
        }
        return;
      }

      // Space: Toggle Snippet Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        const activeSong = currentOptions.find((s) => isSongPlaying(s.id)) || currentOptions[0];
        if (activeSong) {
          toggleSong(activeSong);
        }
        return;
      }

      // Keys 1 to 5: Audition candidate at index
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= currentOptions.length) {
        e.preventDefault();
        const targetSong = currentOptions[num - 1];
        if (targetSong) {
          toggleSong(targetSong);
        }
        return;
      }

      // Key 'c': Open comparison between shortlisted or first two candidates
      if (e.key.toLowerCase() === 'c' && currentOptions.length >= 2) {
        e.preventDefault();
        if (compareSelection.length < 2) {
          setCompareSelection([currentOptions[0], currentOptions[1]]);
        }
        setIsCompareOpen((prev) => !prev);
        return;
      }

      // Key 'r': Reroll
      if (e.key.toLowerCase() === 'r' && rerollTokens > 0 && !isCompleted) {
        e.preventDefault();
        playRerollSound(audioEnabled);
        triggerRerollToken();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentOptions,
    draftedTracks.length,
    isCompleted,
    undoLastPick,
    audioEnabled,
    rerollTokens,
    triggerRerollToken,
    compareSelection,
    isSongPlaying,
    toggleSong,
  ]);

  const handleReroll = () => {
    if (rerollTokens > 0) {
      stop();
      playRerollSound(audioEnabled);
      triggerRerollToken();
    }
  };

  const handleUndo = () => {
    if (draftedTracks.length > 0) {
      stop();
      playDraftLockSound(audioEnabled);
      undoLastPick();
    }
  };

  const handleDraftSong = (song: Song) => {
    const isHighSynergy = (song.flowInsight?.synergyScore ?? 0) >= 80;
    const isMonopolyClash = (monopolyReport.artistCounts[song.artist]?.solo ?? 0) >= 1;

    if (isMonopolyClash) {
      playCrowdGaspSound(audioEnabled);
    } else if (isHighSynergy) {
      playCrowdCheerSound(audioEnabled);
    }

    setHoveredCandidate(null);
    draftSong(song);
  };

  const handleCompareToggle = (song: Song) => {
    setCompareSelection((prev) => {
      const exists = prev.some((s) => s.id === song.id);
      if (exists) {
        return prev.filter((s) => s.id !== song.id);
      }
      if (prev.length >= 2) {
        return [prev[1], song];
      }
      const next = [...prev, song];
      if (next.length === 2) {
        setIsCompareOpen(true);
      }
      return next;
    });
  };

  // Dynamic Vibe calculation for the live draft session
  const currentVibe = useMemo(() => {
    if (draftedTracks.length === 0) return 'Session Opening 🚀';
    const lastTrack = draftedTracks[draftedTracks.length - 1];
    if (lastTrack.song.energy >= 88) return 'High Voltage Energy ⚡';
    if (lastTrack.song.energy <= 65) return 'Late-Night Introspection 🌙';
    if (lastTrack.song.genre === 'R&B') return 'Smooth R&B Groove ✨';
    return 'Pacing Building Nicely 🎶';
  }, [draftedTracks]);

  // Dynamic A&R Flow Intelligence enrichment for candidates in this round
  const enrichedOptions = useMemo(() => {
    if (!currentSlot || currentOptions.length === 0) return currentOptions;
    const draftedSoloArtists = draftedTracks.map((t) => t.song.artist.trim());
    return enrichCandidatesWithFlowIntelligence(
      currentOptions,
      currentSlot,
      draftedTracks,
      draftedSoloArtists
    );
  }, [currentOptions, currentSlot, draftedTracks]);

  // Surprise Wildcard / Shuffle feature handler
  const handleSurpriseShuffle = () => {
    if (isCompleted || !currentSlot) return;
    stop();
    setIsSpinning(true);
    playRerollSound(audioEnabled);
    setTimeout(() => {
      const draftedSongIds = draftedTracks.map((t) => t.song.id);
      const draftedSoloArtists = draftedTracks.map((t) => t.song.artist.trim());
      const gem = pickWildcardCandidate(currentSlot.id, draftedSongIds, draftedSoloArtists);
      if (gem) {
        setUnlockedWildcard(gem);
        setWildcardModalOpen(true);
        toggleSong(gem);
      }
      setIsSpinning(false);
    }, 450);
  };

  if (isCompleted) {
    return (
      <div className="w-full bg-gray-900/90 border border-purple-500/40 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-md relative overflow-hidden my-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-400 p-0.5 shadow-2xl shadow-purple-900/50 mb-4 animate-bounce">
          <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400 mb-1">
          {completionLabel}
        </span>
        <h2 className="font-display text-3xl font-extrabold text-white mb-2">
          {gameMode === 'draft' ? 'Tracklist Locked In!' : `${projectLabel} Tracklist Locked In`}
        </h2>
        <p className="text-sm text-gray-300 max-w-lg mb-6 leading-relaxed">
          {slots.length} tracks selected for your {gameMode === 'draft' ? 'draft' : projectLabel.toLowerCase()}. Reorder the sequence from the tracklist drawer, then submit when the build is ready for its final review.
        </p>

        {gameMode !== 'draft' && (
          <span className="mb-5 rounded-full border border-emerald-800/70 bg-emerald-950/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
            Build saved locally · ready to review
          </span>
        )}

        <button
          onClick={() => {
            stop();
            playHoverSound(audioEnabled);
            onEvaluateTrigger();
          }}
          onMouseEnter={() => playHoverSound(audioEnabled)}
          className="min-h-14 px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-extrabold rounded-2xl shadow-xl shadow-purple-900/40 text-base tracking-wide transition-colors cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
          <span>{reviewActionLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2 my-2">
      {/* Current Draft Slot Banner — Sticky & Always In View */}
      <section
        aria-labelledby="current-slot-heading"
        className="sticky top-16 z-30 bg-[#0c0e14]/95 border border-purple-900/50 rounded-2xl p-3 sm:p-3.5 backdrop-blur-xl flex flex-col gap-2 shadow-2xl shadow-purple-950/40 transition-all"
      >
        {/* Row 1: Badges, Progress, Energy Target & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[11px] font-black uppercase tracking-wider border border-purple-800 shadow-sm flex items-center gap-1.5">
              <Disc3 className="w-3 h-3 text-pink-400" />
              <span>{trackLabel} {currentSlot.roundNumber} of {slots.length}</span>
            </span>

            {/* Mini progress track */}
            <div className="w-14 h-1.5 bg-gray-800 rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${Math.round((draftedTracks.length / slots.length) * 100)}%` }}
              />
            </div>

            {/* Auto-era badge */}
            {currentEraLabel && (
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[11px] font-bold uppercase tracking-wider border border-indigo-800">
                {currentEraLabel}
              </span>
            )}

            {/* Budget Mode Counter */}
            {gameMode === 'budget' && (
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-700 flex items-center gap-1 shadow-sm">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                Budget: ${budgetRemaining}
              </span>
            )}

            {/* Challenge Gauntlet Badge */}
            {challengeTheme && challengeTheme !== 'standard' && (
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[11px] font-bold uppercase tracking-wider border border-amber-700 flex items-center gap-1 shadow-sm">
                <Crown className="w-3 h-3 text-amber-400" />
                {challengeTheme === 'year-2016'
                  ? 'Class of 2016'
                  : challengeTheme === 'era-90s'
                  ? '90s Golden Era'
                  : challengeTheme === 'era-2000s'
                  ? '2000s Bling Era'
                  : challengeTheme === 'genre-hiphop'
                  ? 'Hip-Hop Only'
                  : challengeTheme === 'genre-rnb'
                  ? 'R&B / Soul'
                  : challengeTheme}
              </span>
            )}

            {draftSeed && (
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] font-mono font-extrabold tracking-wider border border-amber-800 flex items-center gap-1">
                <Swords className="w-2.5 h-2.5 text-amber-400" /> 1v1: {draftSeed}
              </span>
            )}

            {difficulty === 'hardcore' ? (
              <span className="text-[11px] text-red-400 font-bold flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> Target: Classified
              </span>
            ) : (
              <span className="text-[11px] text-gray-400 font-medium">
                Target: <strong className="text-purple-300">{currentSlot.targetEnergy.ideal}%</strong>
              </span>
            )}
          </div>

          {/* Action Controls: Undo Pick + Reroll Token */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {draftedTracks.length > 0 && (
              <button
                onClick={handleUndo}
                onMouseEnter={() => playHoverSound(audioEnabled)}
                className="px-2.5 py-1 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Undo last draft pick (Cmd+Z / Ctrl+Z)"
              >
                <Undo2 className="w-3 h-3 text-purple-400" />
                <span>Undo</span>
              </button>
            )}

            <button
              onClick={handleReroll}
              disabled={rerollTokens <= 0}
              onMouseEnter={() => playHoverSound(audioEnabled)}
              className={`px-3 py-1 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                rerollTokens > 0
                  ? 'bg-purple-950/80 hover:bg-purple-900 border-purple-700 text-purple-200 shadow-md shadow-purple-950/40 hover:scale-105'
                  : 'bg-gray-950 border-gray-800 text-gray-600 cursor-not-allowed opacity-60'
              }`}
              title="Refresh the candidate pool for this round"
              aria-label={`Reroll candidate pool — ${rerollTokens} remaining`}
            >
              <RefreshCw className={`w-3 h-3 ${rerollTokens > 0 ? 'text-pink-400' : ''}`} />
              <span>Reroll ({rerollTokens})</span>
            </button>
          </div>
        </div>

        {/* Row 2: Prominent Category Title & Description */}
        <div className="flex items-baseline justify-between gap-3 border-t border-purple-900/30 pt-1.5">
          <div className="min-w-0">
            <h2 id="current-slot-heading" className="font-display text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-baseline gap-2 flex-wrap">
              <span>{gameMode === 'draft' ? 'Pick your' : `Select a track for your ${projectLabel.toLowerCase()}:`}</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 font-black drop-shadow-sm">
                {currentSlot.name}
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-300 mt-0.5 max-w-2xl leading-snug">
              {currentSlot.description}
            </p>
          </div>
        </div>
      </section>

      {/* Live Aux Crowd Arena & Synergies Feedback Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 items-stretch">
        <div className="lg:col-span-2">
          <CrowdStageVisualizer
            crowdHype={crowdHype}
            hoveredCandidate={hoveredCandidate}
            draftedTracks={draftedTracks}
            currentSlot={currentSlot}
            activeSynergies={activeSynergies}
          />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-2">
          <SynergyDisplay synergies={activeSynergies} />
          <AuxHypeMeter crowdHype={crowdHype} />
        </div>
      </div>

      {/* Interactive Audition & Shortcut Deck Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-purple-900/30 bg-purple-950/20 px-3 py-1.5 text-xs">
        <div className="flex items-center gap-2.5 text-purple-200">
          <Headphones className="w-4 h-4 text-pink-400 animate-pulse" />
          <span className="font-extrabold uppercase tracking-wider text-[11px]">Audition Deck:</span>
          <span className="hidden sm:inline text-slate-400 font-medium">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-300 font-mono text-[10px]">1-5</kbd> to sample • <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-300 font-mono text-[10px]">Space</kbd> pause • <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-300 font-mono text-[10px]">C</kbd> compare
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Compare Trigger Button */}
          {currentOptions.length >= 2 && (
            <button
              onClick={() => {
                if (compareSelection.length < 2) {
                  setCompareSelection([currentOptions[0], currentOptions[1]]);
                }
                setIsCompareOpen(true);
              }}
              className="py-1 px-2.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              title="Compare two candidates side-by-side"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>
                {compareSelection.length === 2 ? 'Face-Off Selected' : 'A/B Face-Off'}
              </span>
            </button>
          )}

          {/* Surprise Wildcard Shuffle Button */}
          <button
            onClick={handleSurpriseShuffle}
            disabled={isSpinning}
            title="Spin for a surprise high-synergy wildcard gem from the catalog"
            className="py-1 px-2.5 rounded-lg bg-amber-950/80 hover:bg-amber-900/90 border border-amber-800/80 text-amber-300 text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95"
          >
            <Dice5 className={`w-3.5 h-3.5 text-amber-400 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Rolling...' : 'Surprise Wildcard'}</span>
          </button>

          {/* Live Vibe Pill */}
          <span className="px-2.5 py-1 rounded-lg bg-pink-950/40 border border-pink-800/50 text-pink-300 text-[11px] font-black">
            {currentVibe}
          </span>
        </div>
      </div>

      {/* Draft mode reveals the AI choice only after the human locks a pick. */}
      {gameMode === 'draft' && lastOpponentReveal && (
        <div className="rounded-2xl border border-cyan-800/70 bg-cyan-950/30 p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-black text-cyan-300">AI pick revealed</span>
              <span className="text-[10px] text-gray-500">Round {lastOpponentReveal.roundIndex + 1}</span>
            </div>
            <p className="text-sm font-extrabold text-white truncate">
              {lastOpponentReveal.song.title} <span className="text-gray-400 font-normal">— {lastOpponentReveal.song.rawArtistString}</span>
            </p>
            <p className="text-xs text-cyan-200/80">{lastOpponentReveal.reason}</p>
          </div>
          <span className="text-xs font-black text-cyan-300 whitespace-nowrap">{lastOpponentReveal.song.energy}% energy</span>
        </div>
      )}

      {/* Five-card recommendation pool in TrackDraft mode; builders use the same safe empty state with mode-specific copy. */}
      {enrichedOptions.length === 0 ? (
        <div className="w-full bg-gray-950 border border-purple-900/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="w-8 h-8 text-amber-400 animate-pulse" />
          <h3 className="text-base font-extrabold text-white">
            No {projectLabel} candidates available
          </h3>
          <p className="text-xs text-gray-400 max-w-sm">
            The catalog doesn&apos;t have enough {currentEraLabel ?? 'matching'} songs for {currentSlot.name}. {rerollTokens > 0 ? 'Use a reroll token to try another pool.' : 'No rerolls remain, so this slot is waiting for a new session.'}
          </p>
          <button
            onClick={handleReroll}
            disabled={rerollTokens <= 0}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer mt-2"
          >
            {rerollTokens > 0 ? `Try another pool (${rerollTokens})` : 'No rerolls available'}
          </button>
        </div>
      ) : (
        <div className="w-full pb-32 sm:pb-24">
          {/* Active Slot Context Strip — Sticky anchor above candidates */}
          <div className="flex items-center justify-between px-3 py-1.5 mb-2.5 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs font-bold text-gray-300 backdrop-blur-md sticky top-14 sm:top-16 z-20 shadow-md">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
              <span className="text-[11px] uppercase tracking-wider text-purple-300 font-extrabold flex-shrink-0">
                Drafting For:
              </span>
              <span className="text-white font-black text-xs sm:text-sm tracking-tight truncate">
                {currentSlot.name}
              </span>
              <span className="text-gray-400 font-medium text-[11px] hidden sm:inline flex-shrink-0">
                ({trackLabel} {currentSlot.roundNumber} of {slots.length})
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-[11px] text-cyan-300/80 font-mono hidden md:flex items-center gap-2">
                <span>Target: {currentSlot.targetEnergy.ideal}% Energy</span>
                <span className="text-gray-600">•</span>
                <span className="text-slate-400">5 Candidate Options</span>
              </div>

              {/* Mobile View Toggle: Carousel vs Vertical List */}
              <div className="flex sm:hidden items-center bg-black/50 p-0.5 rounded-lg border border-white/[0.08]">
                <button
                  onClick={() => setMobileViewMode('carousel')}
                  className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                    mobileViewMode === 'carousel'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Swipeable Carousel View"
                >
                  Deck
                </button>
                <button
                  onClick={() => setMobileViewMode('list')}
                  className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                    mobileViewMode === 'list'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vertical List View"
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Segmented Candidate Thumb Navigator on Mobile (in carousel mode) */}
          {mobileViewMode === 'carousel' && (
            <div className="flex sm:hidden items-center justify-between gap-1 mb-2 px-0.5">
              <div className="flex items-center gap-1.5 flex-1">
                {enrichedOptions.map((song, idx) => (
                  <button
                    key={song.id}
                    onClick={() => scrollToCandidate(idx)}
                    className={`flex-1 min-h-[40px] rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center p-1 active:scale-95 cursor-pointer ${
                      activeMobileCardIndex === idx
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400 shadow-md shadow-purple-950/60'
                        : 'bg-slate-900/85 text-slate-400 border-white/[0.08] hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[9px] uppercase font-bold opacity-80 leading-none">#{idx + 1}</span>
                    <span className="text-[10px] font-extrabold truncate max-w-[50px] leading-tight mt-0.5">
                      {song.artist.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Candidates Container: Mobile horizontal snap deck OR desktop 5-column responsive grid */}
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            aria-label={`${enrichedOptions.length} candidate tracks`}
            className={`w-full ${
              mobileViewMode === 'carousel'
                ? 'flex sm:grid sm:grid-cols-2 lg:grid-cols-5 overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory gap-3.5 pb-4 scrollbar-none touch-pan-x'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-stretch'
            }`}
          >
            {enrichedOptions.map((song, idx) => (
              <div
                key={song.id}
                className={`flex flex-col h-full ${
                  mobileViewMode === 'carousel'
                    ? 'w-[86vw] max-w-[340px] flex-shrink-0 snap-center sm:w-full sm:max-w-none'
                    : 'w-full'
                }`}
              >
                <DraftCard
                  song={song}
                  candidateIndex={idx}
                  onDraft={handleDraftSong}
                  onCompareToggle={handleCompareToggle}
                  isComparing={compareSelection.some((s) => s.id === song.id)}
                  onHoverCandidate={setHoveredCandidate}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Surprise Wildcard Spin Modal */}
      {wildcardModalOpen && unlockedWildcard && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-amber-500/60 bg-gradient-to-b from-slate-900 via-slate-950 to-amber-950/40 p-6 shadow-2xl shadow-amber-950/60 text-center overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />

            <button
              onClick={() => {
                setWildcardModalOpen(false);
                setUnlockedWildcard(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-black uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Surprise Wildcard Unlocked!</span>
            </div>

            {/* Artwork & Details */}
            <div className="relative w-32 h-32 mx-auto my-2 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-500/40 bg-slate-900">
              {unlockedWildcard.artwork ? (
                <img
                  src={unlockedWildcard.artwork}
                  alt={unlockedWildcard.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${unlockedWildcard.gradient} flex items-center justify-center`}>
                  <Dice5 className="w-12 h-12 text-amber-300" />
                </div>
              )}
            </div>

            <h3 className="font-display text-xl font-black text-white mt-3 line-clamp-1">
              {unlockedWildcard.title}
            </h3>
            <p className="text-sm font-semibold text-amber-200 mt-0.5">
              {unlockedWildcard.rawArtistString}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {unlockedWildcard.album} • {unlockedWildcard.bpm} BPM • {unlockedWildcard.energy}% Energy
            </p>

            <div className="my-4 p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200/90 italic">
              "An unexpected high-affinity vault gem selected specifically to surprise and elevate your current tracklist."
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => toggleSong(unlockedWildcard)}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
              >
                <Headphones className="w-4 h-4 text-pink-400" />
                <span>{isSongPlaying(unlockedWildcard.id) ? 'Pause Sample' : 'Audition (30s)'}</span>
              </button>

              <button
                onClick={() => {
                  stop();
                  draftSong(unlockedWildcard);
                  setWildcardModalOpen(false);
                  setUnlockedWildcard(null);
                }}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-pink-600 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 cursor-pointer transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Lock In Wildcard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A/B Face-off Comparison Modal */}
      {(() => {
        const activeSongs: [Song, Song] | null =
          compareSelection.length >= 2
            ? [compareSelection[0], compareSelection[1]]
            : currentOptions.length >= 2
            ? [currentOptions[0], currentOptions[1]]
            : null;

        if (!activeSongs || !isCompareOpen) return null;

        return (
          <CompareModal
            isOpen={isCompareOpen}
            onClose={() => setIsCompareOpen(false)}
            songs={activeSongs}
            slot={currentSlot}
            onSelectSong={draftSong}
          />
        );
      })()}
    </div>
  );
};
