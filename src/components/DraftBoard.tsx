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
      <div className="w-full bg-[#0e0e12]/90 border border-white/[0.08] rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-2xl relative overflow-hidden my-6">
        <div className="w-20 h-20 rounded-2xl bg-white/[0.06] border border-white/[0.12] p-1 shadow-2xl mb-4 animate-bounce flex items-center justify-center">
          <Trophy className="w-10 h-10 text-amber-400" />
        </div>

        <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-1">
          {completionLabel}
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
          {gameMode === 'draft' ? 'Tracklist Locked In' : `${projectLabel} Tracklist Locked In`}
        </h2>
        <p className="text-sm text-zinc-400 max-w-lg mb-6 leading-relaxed">
          {slots.length} tracks selected for your {gameMode === 'draft' ? 'draft' : projectLabel.toLowerCase()}. Reorder the sequence from the tracklist drawer, then submit when the build is ready for its final review.
        </p>

        {gameMode !== 'draft' && (
          <span className="mb-5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
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
          className="min-h-14 px-8 py-4 bg-white hover:bg-zinc-200 text-black font-black rounded-full shadow-2xl text-base tracking-wide transition active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span>{reviewActionLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2.5 my-2">
      {/* Current Draft Slot Banner — Sticky & Always In View */}
      <section
        aria-labelledby="current-slot-heading"
        className="sticky top-16 z-30 bg-[#0e0e12]/95 border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 backdrop-blur-2xl flex flex-col gap-2.5 shadow-2xl shadow-black/80 transition-all"
      >
        {/* Row 1: Badges, Progress, Energy Target & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white text-[11px] font-black uppercase tracking-wider border border-white/[0.08] shadow-sm flex items-center gap-1.5">
              <Disc3 className="w-3 h-3 text-rose-500" />
              <span>{trackLabel} {currentSlot.roundNumber} of {slots.length}</span>
            </span>

            {/* Mini progress track */}
            <div className="w-14 h-1.5 bg-zinc-800 rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full bg-rose-500 rounded-full transition-all"
                style={{ width: `${Math.round((draftedTracks.length / slots.length) * 100)}%` }}
              />
            </div>

            {/* Auto-era badge */}
            {currentEraLabel && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/[0.04] text-zinc-300 text-[11px] font-bold uppercase tracking-wider border border-white/[0.08]">
                {currentEraLabel}
              </span>
            )}

            {/* Budget Mode Counter */}
            {gameMode === 'budget' && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                Budget: ${budgetRemaining}
              </span>
            )}

            {/* Challenge Gauntlet Badge */}
            {challengeTheme && challengeTheme !== 'standard' && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 text-[11px] font-bold uppercase tracking-wider border border-amber-500/30 flex items-center gap-1 shadow-sm">
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
              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-300 text-[10px] font-mono font-bold tracking-wider border border-white/[0.08] flex items-center gap-1">
                <Swords className="w-2.5 h-2.5 text-zinc-400" /> 1v1: {draftSeed}
              </span>
            )}

            {difficulty === 'hardcore' ? (
              <span className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> Target: Classified
              </span>
            ) : (
              <span className="text-[11px] text-zinc-400 font-medium">
                Target: <strong className="text-white font-bold">{currentSlot.targetEnergy.ideal}%</strong>
              </span>
            )}
          </div>

          {/* Action Controls: Undo Pick + Reroll Token */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {draftedTracks.length > 0 && (
              <button
                onClick={handleUndo}
                onMouseEnter={() => playHoverSound(audioEnabled)}
                className="px-2.5 py-1 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Undo last draft pick (Cmd+Z / Ctrl+Z)"
              >
                <Undo2 className="w-3 h-3 text-zinc-400" />
                <span>Undo</span>
              </button>
            )}

            <button
              onClick={handleReroll}
              disabled={rerollTokens <= 0}
              onMouseEnter={() => playHoverSound(audioEnabled)}
              className={`px-3 py-1 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                rerollTokens > 0
                  ? 'bg-white/[0.08] hover:bg-white/[0.14] border-white/[0.12] text-white shadow-sm'
                  : 'bg-black/30 border-white/[0.04] text-zinc-600 cursor-not-allowed opacity-50'
              }`}
              title="Refresh the candidate pool for this round"
              aria-label={`Reroll candidate pool — ${rerollTokens} remaining`}
            >
              <RefreshCw className={`w-3 h-3 ${rerollTokens > 0 ? 'text-zinc-300' : ''}`} />
              <span>Reroll ({rerollTokens})</span>
            </button>
          </div>
        </div>

        {/* Row 2: Prominent Category Title & Description */}
        <div className="flex items-baseline justify-between gap-3 border-t border-white/[0.06] pt-2">
          <div className="min-w-0">
            <h2 id="current-slot-heading" className="text-lg sm:text-xl font-black text-white tracking-tight flex items-baseline gap-2 flex-wrap">
              <span>{gameMode === 'draft' ? 'Pick your' : `Select a track for your ${projectLabel.toLowerCase()}:`}</span>
              <span className="text-white font-black">
                {currentSlot.name}
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 max-w-2xl leading-snug">
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
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl px-3 py-1.5 text-xs">
        <div className="flex items-center gap-2.5 text-zinc-300">
          <Headphones className="w-4 h-4 text-rose-500" />
          <span className="font-extrabold uppercase tracking-wider text-[11px] text-white">Audition Deck:</span>
          <span className="hidden sm:inline text-zinc-400 font-medium">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] text-zinc-200 font-mono text-[10px]">1-5</kbd> to sample • <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] text-zinc-200 font-mono text-[10px]">Space</kbd> pause • <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] text-zinc-200 font-mono text-[10px]">C</kbd> compare
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
              className="py-1 px-2.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 hover:text-white text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
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
            className="py-1 px-2.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
          >
            <Dice5 className={`w-3.5 h-3.5 text-amber-400 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Rolling...' : 'Surprise Wildcard'}</span>
          </button>

          {/* Live Vibe Pill */}
          <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-zinc-300 text-[11px] font-bold">
            {currentVibe}
          </span>
        </div>
      </div>

      {/* Draft mode reveals the AI choice only after the human locks a pick. */}
      {gameMode === 'draft' && lastOpponentReveal && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#121216]/90 p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in backdrop-blur-2xl">
          <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center flex-shrink-0">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-black text-rose-400">AI pick revealed</span>
              <span className="text-[10px] text-zinc-500">Round {lastOpponentReveal.roundIndex + 1}</span>
            </div>
            <p className="text-sm font-extrabold text-white truncate">
              {lastOpponentReveal.song.title} <span className="text-zinc-400 font-normal">— {lastOpponentReveal.song.rawArtistString}</span>
            </p>
            <p className="text-xs text-zinc-300">{lastOpponentReveal.reason}</p>
          </div>
          <span className="text-xs font-black text-zinc-300 whitespace-nowrap">{lastOpponentReveal.song.energy}% energy</span>
        </div>
      )}

      {/* Five-card recommendation pool in TrackDraft mode */}
      {enrichedOptions.length === 0 ? (
        <div className="w-full bg-[#0e0e12]/90 border border-white/[0.08] rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="w-8 h-8 text-amber-400 animate-pulse" />
          <h3 className="text-base font-extrabold text-white">
            No {projectLabel} candidates available
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            The catalog doesn&apos;t have enough {currentEraLabel ?? 'matching'} songs for {currentSlot.name}. {rerollTokens > 0 ? 'Use a reroll token to try another pool.' : 'No rerolls remain, so this slot is waiting for a new session.'}
          </p>
          <button
            onClick={handleReroll}
            disabled={rerollTokens <= 0}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-extrabold text-xs transition active:scale-95 cursor-pointer mt-2"
          >
            {rerollTokens > 0 ? `Try another pool (${rerollTokens})` : 'No rerolls available'}
          </button>
        </div>
      ) : (
        <div className="w-full pb-32 sm:pb-24">
          {/* Active Slot Context Strip — Sticky anchor above candidates */}
          <div className="flex items-center justify-between px-3.5 py-2 mb-2.5 rounded-xl bg-[#0e0e12]/95 border border-white/[0.08] text-xs font-bold text-zinc-300 backdrop-blur-2xl sticky top-14 sm:top-16 z-20 shadow-lg">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-extrabold flex-shrink-0">
                Drafting For:
              </span>
              <span className="text-white font-black text-xs sm:text-sm tracking-tight truncate">
                {currentSlot.name}
              </span>
              <span className="text-zinc-500 font-medium text-[11px] hidden sm:inline flex-shrink-0">
                ({trackLabel} {currentSlot.roundNumber} of {slots.length})
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-[11px] text-zinc-400 font-mono hidden md:flex items-center gap-2">
                <span>Target: <strong className="text-white">{currentSlot.targetEnergy.ideal}%</strong> Energy</span>
                <span className="text-zinc-600">•</span>
                <span>5 Candidate Options</span>
              </div>

              {/* Mobile View Toggle: Carousel vs Vertical List */}
              <div className="flex sm:hidden items-center bg-black/60 p-0.5 rounded-lg border border-white/[0.08]">
                <button
                  onClick={() => setMobileViewMode('carousel')}
                  className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                    mobileViewMode === 'carousel'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Swipeable Carousel View"
                >
                  Deck
                </button>
                <button
                  onClick={() => setMobileViewMode('list')}
                  className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                    mobileViewMode === 'list'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
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
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-[#121216]/85 text-zinc-400 border-white/[0.08] hover:bg-zinc-900'
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#121216]/95 p-6 shadow-2xl shadow-black/80 text-center overflow-hidden backdrop-blur-2xl">
            <button
              onClick={() => {
                setWildcardModalOpen(false);
                setUnlockedWildcard(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-white text-xs font-extrabold uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Surprise Wildcard Unlocked</span>
            </div>

            {/* Artwork & Details */}
            <div className="relative w-32 h-32 mx-auto my-2 rounded-2xl overflow-hidden shadow-2xl border border-white/[0.12] bg-zinc-950">
              {unlockedWildcard.artwork ? (
                <img
                  src={unlockedWildcard.artwork}
                  alt={unlockedWildcard.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${unlockedWildcard.gradient} flex items-center justify-center`}>
                  <Dice5 className="w-12 h-12 text-white/60" />
                </div>
              )}
            </div>

            <h3 className="text-xl font-black text-white mt-3 line-clamp-1">
              {unlockedWildcard.title}
            </h3>
            <p className="text-sm font-semibold text-zinc-300 mt-0.5">
              {unlockedWildcard.rawArtistString}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {unlockedWildcard.album} • {unlockedWildcard.bpm} BPM • {unlockedWildcard.energy}% Energy
            </p>

            <div className="my-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-300 italic">
              &ldquo;An unexpected high-affinity vault gem selected specifically to surprise and elevate your current tracklist.&rdquo;
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => toggleSong(unlockedWildcard)}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
              >
                <Headphones className="w-4 h-4 text-rose-500" />
                <span>{isSongPlaying(unlockedWildcard.id) ? 'Pause Sample' : 'Audition (30s)'}</span>
              </button>

              <button
                onClick={() => {
                  stop();
                  draftSong(unlockedWildcard);
                  setWildcardModalOpen(false);
                  setUnlockedWildcard(null);
                }}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl cursor-pointer transition active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
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
