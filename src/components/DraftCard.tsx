'use client';

import React from 'react';
import { Song } from '@/types/draft';
import { useDraftStore } from '@/store/useDraftStore';
import { useSnippetAudio } from '@/hooks/useSnippetAudio';
import { Play, Pause, Flame, Disc, AlertTriangle, Sparkles, Plus, Maximize2, GitCompare, Loader2 } from 'lucide-react';
import {
  playHoverSound,
  playDraftLockSound,
} from '@/lib/audioEngine';
import { getSongBudgetPrice } from '@/lib/budgetEngine';

interface DraftCardProps {
  song: Song;
  candidateIndex?: number;
  onDraft: (song: Song) => void;
  onCompareToggle?: (song: Song) => void;
  isComparing?: boolean;
  onHoverCandidate?: (song: Song | null) => void;
}

export const DraftCard: React.FC<DraftCardProps> = ({
  song,
  candidateIndex,
  onDraft,
  onCompareToggle,
  isComparing = false,
  onHoverCandidate,
}) => {
  const {
    audioEnabled,
    monopolyReport,
    setActivePlayingSongId,
    openRealSongPlayer,
    gameMode,
    budgetRemaining,
    mysteryRoundIndex,
    currentRoundIndex,
  } = useDraftStore();
  // Snippet Round: titles, artists and covers stay hidden until the pick.
  const isMystery = mysteryRoundIndex !== null && mysteryRoundIndex === currentRoundIndex;
  const mysteryName = `Mystery track ${candidateIndex !== undefined ? candidateIndex + 1 : ''}`.trim();
  const displayTitle = isMystery ? mysteryName : song.title;

  const {
    isSongPlaying,
    isSongActive,
    toggleSong,
    currentTime,
    progressPercent,
    isLoading,
    stop,
  } = useSnippetAudio();

  const isPlaying = isSongPlaying(song.id);
  const isActive = isSongActive(song.id);

  const songPrice = getSongBudgetPrice(song);
  const isOverBudget = gameMode === 'budget' && songPrice > budgetRemaining;

  // Solo Monopoly calculations
  const currentSoloCount = monopolyReport.artistCounts[song.artist]?.solo || 0;
  const isNewMonopolyRisk = !isMystery && currentSoloCount === 1;
  const isExtendingMonopoly = !isMystery && currentSoloCount >= 2;
  const hasMonopolyWarning = isNewMonopolyRisk || isExtendingMonopoly;

  const handleSnippetToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSong(song);
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    stop();
    openRealSongPlayer(song);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCompareToggle?.(song);
  };

  const handleDraftClick = () => {
    if (isOverBudget) return;
    stop();
    setActivePlayingSongId(null);
    playDraftLockSound(audioEnabled);
    onDraft(song);
  };

  const synergy = song.flowInsight?.synergyScore;
  const isBestFit = !isMystery && Boolean(song.flowInsight?.isTopCuratorPick);
  const insight = isMystery ? 'Play the snippet and pick by ear.' : song.flowInsight?.curatorInsight;

  return (
    <article
      aria-label={isMystery ? mysteryName : `Candidate ${candidateIndex !== undefined ? candidateIndex + 1 : ''}: ${song.title} by ${song.artist}`}
      onMouseEnter={() => {
        playHoverSound(audioEnabled);
        onHoverCandidate?.(song);
      }}
      onMouseLeave={() => onHoverCandidate?.(null)}
      onTouchStart={() => onHoverCandidate?.(song)}
      className={`group relative h-full rounded-2xl border p-3 flex flex-col gap-3 overflow-hidden transition-colors duration-200 ${
        isPlaying
          ? 'bg-[#1a1622] border-rose-500/80 ring-1 ring-rose-500/40'
          : isBestFit
          ? 'bg-[#121a1a] border-emerald-500/40 hover:border-emerald-400/70'
          : hasMonopolyWarning
          ? 'bg-[#1a1215] border-rose-900/70 hover:border-rose-500/60'
          : 'bg-[#141419] border-white/[0.08] hover:border-white/25 hover:bg-[#18181f]'
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${song.gradient} opacity-[0.12] pointer-events-none`} aria-hidden="true" />

      {/* Cover + text: side by side on phones, stacked in the desktop grid */}
      <div className="relative flex gap-3 lg:flex-col">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-full lg:h-auto lg:aspect-square flex-shrink-0 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shadow-lg shadow-black/50">
          {song.artwork && !isMystery ? (
            <img
              src={song.artwork}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
                const fb = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement;
                if (fb) fb.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-full h-full bg-gradient-to-br ${song.gradient} items-center justify-center ${song.artwork && !isMystery ? 'hidden' : 'flex'}`}>
            {isMystery ? <span className="text-3xl font-black text-white/80">?</span> : <Disc className="w-8 h-8 text-white/60" aria-hidden="true" />}
          </div>

          <button
            type="button"
            onClick={handleSnippetToggle}
            aria-label={isPlaying ? `Pause snippet for ${displayTitle}` : `Play snippet for ${displayTitle}`}
            className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/10 transition-colors cursor-pointer"
          >
            <span className={`flex items-center justify-center rounded-full shadow-xl w-10 h-10 lg:w-12 lg:h-12 transition-transform group-hover:scale-105 ${isPlaying ? 'bg-rose-500 text-white' : 'bg-white text-black'}`}>
              {isLoading && isActive ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" aria-hidden="true" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" aria-hidden="true" />
              )}
            </span>
          </button>

          {isPlaying && (
            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-black text-rose-300">
              {Math.floor(currentTime)}s
            </span>
          )}

          {isBestFit && (
            <span className="hidden lg:flex absolute top-2 left-2 items-center gap-1 rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-black text-black shadow">
              <Sparkles className="w-3 h-3" aria-hidden="true" /> Best fit
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base font-black text-white leading-tight line-clamp-2">{displayTitle}</h3>
              <p className="text-sm text-zinc-300 truncate">
                {isMystery ? 'Artist hidden' : song.artist}
                {!isMystery && song.featuredArtists.length > 0 && (
                  <span className="text-zinc-500"> ft. {song.featuredArtists.join(', ')}</span>
                )}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {isMystery ? song.genre : <>{song.year ? `${song.year} · ` : ''}{song.genre}</>}
              </p>
            </div>
            {candidateIndex !== undefined && (
              <span className="hidden lg:flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[11px] font-bold text-zinc-400" title={`Press ${candidateIndex + 1} to hear it`}>
                {candidateIndex + 1}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-bold">
            {gameMode === 'budget' && (
              <span className={`rounded-full px-2 py-0.5 ${isOverBudget ? 'bg-rose-500/15 text-rose-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                {songPrice === 0 ? 'Free' : `$${songPrice}`}
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-zinc-200" title="Energy">
              <Flame className="w-3 h-3 text-rose-400" aria-hidden="true" /> {song.energy}%
            </span>
            {!isMystery && synergy ? (
              <span className={`rounded-full px-2 py-0.5 ${synergy >= 85 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/[0.06] text-zinc-200'}`} title="How well it fits this spot">
                {synergy}% fit
              </span>
            ) : null}
            {isBestFit && (
              <span className="lg:hidden rounded-full bg-emerald-400 px-2 py-0.5 text-black">Best fit</span>
            )}
            {hasMonopolyWarning && (
              <span className="flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-300" title="You already have a song by this artist. Another costs points.">
                <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Same artist
              </span>
            )}
          </div>
        </div>
      </div>

      {insight && (
        <p className="relative hidden sm:block text-xs leading-5 text-zinc-400 line-clamp-2">{insight}</p>
      )}

      {/* Actions */}
      <div className="relative mt-auto flex items-center gap-2">
        {onCompareToggle && !isMystery && (
          <button
            type="button"
            onClick={handleCompare}
            aria-pressed={isComparing}
            title={isComparing ? 'Remove from compare' : 'Compare with another song'}
            aria-label={isComparing ? 'Remove from compare' : 'Compare'}
            className={`h-12 w-12 lg:h-11 lg:w-11 flex-shrink-0 rounded-xl border flex items-center justify-center transition cursor-pointer ${
              isComparing ? 'bg-white text-black border-white' : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
            }`}
          >
            <GitCompare className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        {!isMystery && (
          <button
            type="button"
            onClick={handleOpenModal}
            title="Open the full song player"
            aria-label="Open the full song player"
            className="hidden lg:flex h-11 w-11 flex-shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-white items-center justify-center transition cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          disabled={isOverBudget}
          onClick={handleDraftClick}
          className={`h-12 lg:h-11 min-h-[44px] flex-1 rounded-xl px-3 text-base lg:text-sm font-black flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
            isOverBudget
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : hasMonopolyWarning
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : isBestFit
              ? 'bg-emerald-400 hover:bg-emerald-300 text-black'
              : 'bg-white hover:bg-zinc-200 text-black'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
          <span className="truncate">{isOverBudget ? `Over budget ($${songPrice})` : 'Pick'}</span>
        </button>
      </div>

      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60" aria-hidden="true">
          <div style={{ width: `${progressPercent}%` }} className="h-full bg-rose-500 transition-all duration-150" />
        </div>
      )}
    </article>
  );
};
