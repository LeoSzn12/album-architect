'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { useSnippetAudio } from '@/hooks/useSnippetAudio';
import { DraftCard } from './DraftCard';
import { getCategoryLabel } from '@/lib/firstWeek/categories';
import { CompareModal } from './CompareModal';
import {
  RefreshCw,
  Sparkles,
  Trophy,
  Undo2,
  AlertCircle,
  Swords,
  Headphones,
  ArrowRightLeft,
  Flame,
  Dice5,
  X,
  Plus,
  DollarSign,
  Crown,
  ChevronDown,
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
import { FirstWeekHud } from './FirstWeekHud';
import { DraftTelemetryBar } from './DraftTelemetryBar';
import { RIVALS } from '@/lib/firstWeek/rivals';
import type { Song } from '@/types/draft';
import { isSoloSeed } from '@/lib/soloSeed';

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
    rivalId,
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
  const isCompleted = currentRoundIndex >= slots.length;
  const currentSlot = slots[currentRoundIndex];
  const projectLabel = gameMode === 'draft' ? 'Draft' : gameMode === 'ep' ? 'EP' : gameMode === 'budget' ? '$15 Budget' : 'Album';
  const trackLabel = gameMode === 'draft' ? 'Round' : `${projectLabel} Track`;

  // Auto-assigned era for this round
  const currentEra = eraSequence[currentRoundIndex];
  const currentEraLabel = currentEra ? eraLabel(currentEra) : null;

  // Adjust selection before rendering a new round; no stale comparison frame.
  const [selectionRound, setSelectionRound] = useState(currentRoundIndex);
  if (selectionRound !== currentRoundIndex) {
    setSelectionRound(currentRoundIndex);
    setCompareSelection([]);
    setIsCompareOpen(false);
    setHoveredCandidate(null);
  }

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
        <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/[0.12] shadow-2xl mb-4 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-amber-400" aria-hidden="true" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
          All {slots.length} songs picked
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
          Your {gameMode === 'draft' ? 'album' : projectLabel.toLowerCase()} is ready
        </h2>
        <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
          Want a different order? Open Tracks first. Otherwise, release it and see how week one goes.
        </p>
        <button
          onClick={() => {
            stop();
            playHoverSound(audioEnabled);
            onEvaluateTrigger();
          }}
          onMouseEnter={() => playHoverSound(audioEnabled)}
          className="min-h-14 px-8 py-4 bg-white hover:bg-zinc-200 text-black font-black rounded-full shadow-2xl text-base transition active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" aria-hidden="true" />
          <span>Release it</span>
        </button>
      </div>
    );
  }

  const pickedCount = draftedTracks.length;

  return (
    <div className="w-full flex flex-col gap-4 my-4">
      {/* Round header: where you are, what to pick, and the two round tools */}
      <section
        aria-labelledby="current-slot-heading"
        className="relative bg-[#111117]/90 border border-white/[0.08] rounded-3xl p-4 sm:p-5 backdrop-blur-2xl flex flex-col gap-3 shadow-2xl"
      >
        <div className="flex gap-1" aria-hidden="true">
          {slots.map((slot, i) => (
            <span
              key={slot.id}
              className={`h-1.5 flex-1 rounded-full ${
                i < pickedCount ? 'bg-rose-500' : i === currentRoundIndex ? 'bg-white' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-400">
              {trackLabel} {currentSlot.roundNumber} of {slots.length}
              {currentEraLabel ? ` · ${currentEraLabel}` : ''}
              {difficulty === 'hardcore' ? ' · Energy target hidden' : ` · Aim for ${currentSlot.targetEnergy.ideal}% energy`}
            </p>
            <h2 id="current-slot-heading" className="mt-1 text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pick your {currentSlot.name.toLowerCase()}
            </h2>
            <p className="mt-1 text-sm text-zinc-400 max-w-2xl leading-snug">{currentSlot.description}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {pickedCount > 0 && (
              <button
                onClick={handleUndo}
                onMouseEnter={() => playHoverSound(audioEnabled)}
                className="min-h-[44px] px-3.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.1] text-zinc-200 font-bold text-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Undo your last pick (Cmd+Z / Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" aria-hidden="true" />
                <span>Undo</span>
              </button>
            )}
            <button
              onClick={handleReroll}
              disabled={rerollTokens <= 0}
              onMouseEnter={() => playHoverSound(audioEnabled)}
              className={`min-h-[44px] px-3.5 rounded-xl border font-bold text-sm flex items-center gap-1.5 transition active:scale-95 ${
                rerollTokens > 0
                  ? 'bg-white/[0.08] hover:bg-white/[0.14] border-white/[0.12] text-white cursor-pointer'
                  : 'bg-black/30 border-white/[0.04] text-zinc-600 cursor-not-allowed'
              }`}
              title="Swap these five songs for new ones"
              aria-label={`New songs. ${rerollTokens} left`}
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>New songs ({rerollTokens})</span>
            </button>
          </div>
        </div>

        {(gameMode === 'budget' || (challengeTheme && challengeTheme !== 'standard') || (draftSeed && !isSoloSeed(draftSeed))) && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            {gameMode === 'budget' && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <DollarSign className="w-3 h-3" aria-hidden="true" /> ${budgetRemaining} left
              </span>
            )}
            {challengeTheme && challengeTheme !== 'standard' && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Crown className="w-3 h-3" aria-hidden="true" /> {getCategoryLabel(challengeTheme) ?? challengeTheme}
              </span>
            )}
            {draftSeed && !isSoloSeed(draftSeed) && (
              <span className="px-2.5 py-1 rounded-full bg-white/[0.04] text-zinc-300 border border-white/[0.08] flex items-center gap-1 font-mono">
                <Swords className="w-3 h-3" aria-hidden="true" /> {draftSeed}
              </span>
            )}
          </div>
        )}
      </section>

      {/* The rival's last pick, shown after you lock yours */}
      {gameMode === 'draft' && lastOpponentReveal && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#121216]/90 px-4 py-3 flex items-center gap-3 animate-fade-in">
          <Swords className="w-4 h-4 text-rose-400 flex-shrink-0" aria-hidden="true" />
          <p className="min-w-0 text-sm text-zinc-300">
            <span className="font-black text-white">{RIVALS[rivalId]?.name ?? 'Your rival'}</span> took{' '}
            <span className="font-bold text-white">{lastOpponentReveal.song.title}</span>
            <span className="text-zinc-500"> by {lastOpponentReveal.song.rawArtistString}</span>
          </p>
        </div>
      )}

      <FirstWeekHud />

      {enrichedOptions.length === 0 ? (
        <div className="w-full bg-[#0e0e12]/90 border border-white/[0.08] rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="w-8 h-8 text-amber-400" aria-hidden="true" />
          <h3 className="text-base font-extrabold text-white">No songs fit this spot</h3>
          <p className="text-sm text-zinc-400 max-w-sm">
            There aren&apos;t enough {currentEraLabel ?? 'matching'} songs for {currentSlot.name}. {rerollTokens > 0 ? 'Try a new set of songs.' : 'You are out of new-song swaps, so start a new draft.'}
          </p>
          <button
            onClick={handleReroll}
            disabled={rerollTokens <= 0}
            className="min-h-[44px] px-5 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-extrabold text-sm transition active:scale-95 cursor-pointer mt-2"
          >
            {rerollTokens > 0 ? `New songs (${rerollTokens})` : 'No swaps left'}
          </button>
        </div>
      ) : (
        <section aria-label={`${enrichedOptions.length} songs to choose from`} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-stretch">
            {enrichedOptions.map((song, idx) => (
              <DraftCard
                key={song.id}
                song={song}
                candidateIndex={idx}
                onDraft={handleDraftSong}
                onCompareToggle={handleCompareToggle}
                isComparing={compareSelection.some((s) => s.id === song.id)}
                onHoverCandidate={setHoveredCandidate}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {currentOptions.length >= 2 && (
                <button
                  onClick={() => {
                    if (compareSelection.length < 2) {
                      setCompareSelection([currentOptions[0], currentOptions[1]]);
                    }
                    setIsCompareOpen(true);
                  }}
                  className="min-h-[44px] px-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-200 text-sm font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                  title="Compare two songs side by side"
                >
                  <ArrowRightLeft className="w-4 h-4" aria-hidden="true" />
                  <span>{compareSelection.length === 2 ? 'Compare picked two' : 'Compare two'}</span>
                </button>
              )}
              <button
                onClick={handleSurpriseShuffle}
                disabled={isSpinning}
                title="Get one surprise song that fits this spot"
                className="min-h-[44px] px-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 text-sm font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <Dice5 className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>{isSpinning ? 'Rolling...' : 'Surprise song'}</span>
              </button>
            </div>
            <p className="hidden lg:block text-xs text-zinc-500">
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-zinc-300 font-mono">1-5</kbd> listen ·{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-zinc-300 font-mono">Space</kbd> pause ·{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-zinc-300 font-mono">C</kbd> compare
            </p>
          </div>
        </section>
      )}

      {/* Everything else lives one tap away */}
      <details id="crowd-stats" className="group rounded-2xl border border-white/[0.08] bg-[#0e0e12]/80 backdrop-blur-xl">
        <summary className="min-h-[48px] list-none cursor-pointer px-4 py-3 flex items-center justify-between gap-3 text-sm font-bold text-zinc-200 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" aria-hidden="true" />
            Crowd and album stats
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-zinc-300">Hype {crowdHype.score}%</span>
          </span>
          <ChevronDown className="w-4 h-4 text-zinc-400 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="px-3 pb-3 flex flex-col gap-3">
          <DraftTelemetryBar />
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
        </div>
      </details>

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
              <span>Surprise song</span>
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
              A song you might not have thought of that fits this spot well.
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => toggleSong(unlockedWildcard)}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
              >
                <Headphones className="w-4 h-4 text-rose-500" />
                <span>{isSongPlaying(unlockedWildcard.id) ? 'Pause' : 'Listen'}</span>
              </button>

              <button
                onClick={() => {
                  stop();
                  draftSong(unlockedWildcard);
                  setWildcardModalOpen(false);
                  setUnlockedWildcard(null);
                }}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer transition active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Pick it</span>
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
