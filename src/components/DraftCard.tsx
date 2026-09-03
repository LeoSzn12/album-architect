'use client';

import React from 'react';
import { Song } from '@/types/draft';
import { useDraftStore } from '@/store/useDraftStore';
import { useSnippetAudio } from '@/hooks/useSnippetAudio';
import {
  Play,
  Pause,
  Flame,
  Disc,
  AlertTriangle,
  Sparkles,
  Plus,
  Maximize2,
  GitCompare,
  Loader2,
} from 'lucide-react';
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
}

export const DraftCard: React.FC<DraftCardProps> = ({
  song,
  candidateIndex,
  onDraft,
  onCompareToggle,
  isComparing = false,
}) => {
  const {
    audioEnabled,
    monopolyReport,
    setActivePlayingSongId,
    openRealSongPlayer,
    gameMode,
    budgetRemaining,
  } = useDraftStore();

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

  // Check if drafting this song triggers or extends a solo monopoly penalty
  const currentSoloCount = monopolyReport.artistCounts[song.artist]?.solo || 0;
  const isNewMonopolyRisk = currentSoloCount === 1;
  const isExtendingMonopoly = currentSoloCount >= 2;
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

  return (
    <div
      onMouseEnter={() => playHoverSound(audioEnabled)}
      className={`group relative h-full min-h-[490px] rounded-2xl p-3.5 sm:p-4 border transition-all duration-300 flex flex-col justify-between overflow-hidden backdrop-blur-xl ${
        isPlaying
          ? 'bg-slate-900/95 border-pink-500 shadow-2xl shadow-pink-950/50 ring-2 ring-pink-500/50'
          : song.flowInsight?.isTopCuratorPick
          ? 'bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-emerald-950/30 border-emerald-500/70 shadow-2xl shadow-emerald-950/30 ring-1 ring-emerald-400/60 hover:border-emerald-400'
          : hasMonopolyWarning
          ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-red-950/40 border-red-900/70 hover:border-red-500 shadow-lg shadow-red-950/20'
          : 'bg-slate-900/80 border-white/[0.08] hover:border-purple-500/60 hover:bg-slate-800/80 hover:shadow-2xl hover:shadow-purple-950/40 hover:-translate-y-0.5'
      }`}
    >
      {/* Subtle Background Radial Ambient Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${song.gradient} ${
          isPlaying ? 'opacity-30' : song.flowInsight?.isTopCuratorPick ? 'opacity-20' : 'opacity-10 group-hover:opacity-20'
        } transition-opacity pointer-events-none`}
      />

      {/* ZONE 1: Header Bar & Badges (Strict Fixed Height) */}
      <div className="z-10 flex flex-col gap-1.5 flex-shrink-0">
        {/* Row 1: Key Shortcut, Price & Action Icons */}
        <div className="h-7 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            {candidateIndex !== undefined && (
              <span
                title={`Press '${candidateIndex + 1}' on keyboard to audition snippet`}
                className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-900/60 border border-purple-500/40 text-[10px] font-black text-purple-200"
              >
                {candidateIndex + 1}
              </span>
            )}
            <span
              title={`Card cost: $${songPrice} (${songPrice === 5 ? 'Megastar' : songPrice === 4 ? 'Heavy Hitter' : songPrice === 3 ? 'Fan Favorite' : songPrice === 2 ? 'Quality Cut' : 'Sleeper Value'})`}
              className={`px-2 py-0.5 rounded text-[10px] font-black border flex items-center gap-0.5 ${
                isOverBudget
                  ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-sm'
              }`}
            >
              {songPrice === 0 ? '🆓 $0 Waiver' : `💰 $${songPrice}`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Compare Button */}
            {onCompareToggle && (
              <button
                onClick={handleCompare}
                title={isComparing ? 'Remove from A/B Compare' : 'Add to A/B Compare Face-Off'}
                className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer h-7 w-7 flex items-center justify-center ${
                  isComparing
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-bold'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Modal deep-dive button */}
            <button
              onClick={handleOpenModal}
              title="Open full player & official video"
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950/80 text-slate-400 hover:text-white hover:border-purple-500/60 transition-colors cursor-pointer h-7 w-7 flex items-center justify-center"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Tag & Penalty Status */}
        <div className="h-6 flex items-center justify-between gap-1 text-[10px]">
          <span className="font-bold uppercase tracking-wider px-2 py-0.5 bg-purple-950/90 border border-purple-800/60 text-purple-300 rounded-md truncate max-w-[130px]">
            {song.typeTag}
          </span>

          <div className="flex items-center gap-1 overflow-hidden">
            {isNewMonopolyRisk && (
              <span
                title="Drafting another solo track for this artist will trigger a -1.5pt Monopoly Penalty!"
                className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold flex items-center gap-1 animate-pulse truncate"
              >
                <AlertTriangle className="w-3 h-3 flex-shrink-0" /> Solo Risk
              </span>
            )}

            {isExtendingMonopoly && (
              <span
                title="Artist already has multiple solo tracks! Drafting adds an additional -2.0pt penalty."
                className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-extrabold flex items-center gap-1 animate-pulse truncate"
              >
                <AlertTriangle className="w-3 h-3 flex-shrink-0" /> Monopoly
              </span>
            )}

            {!hasMonopolyWarning && song.featuredArtists.length > 0 && (
              <span
                title="Guest features do NOT trigger solo monopoly penalties!"
                className="px-1.5 py-0.5 rounded bg-pink-950/80 text-pink-300 border border-pink-800/70 font-bold flex items-center gap-0.5"
              >
                <Sparkles className="w-3 h-3 text-pink-400 flex-shrink-0" /> Feat.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ZONE 2: Dedicated A&R Spotlight Slot (Constant Fixed Height for Perfect Grid Alignment) */}
      <div className="h-6 my-1 flex items-center justify-center z-10 flex-shrink-0">
        {song.flowInsight?.isTopCuratorPick ? (
          <div className="w-full flex items-center justify-center gap-1.5 py-0.5 px-2 rounded-lg bg-emerald-950/90 border border-emerald-500/70 text-emerald-300 text-[9.5px] font-black uppercase tracking-wider shadow-sm animate-pulse">
            <Sparkles className="w-3 h-3 text-emerald-400 fill-current flex-shrink-0" />
            <span className="truncate">A&R TOP RECOMMENDATION • {song.flowInsight.synergyScore}%</span>
          </div>
        ) : song.flowInsight?.synergyScore && song.flowInsight.synergyScore >= 80 ? (
          <div className="flex items-center gap-1 text-[9.5px] text-slate-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
            <span>{song.flowInsight.synergyScore}% Synergy Rating</span>
          </div>
        ) : (
          <div className="h-6" aria-hidden="true" />
        )}
      </div>

      {/* ZONE 3: Artwork & Vinyl Record (Constant Fixed Height) */}
      <div className="h-28 my-1 flex items-center justify-center relative flex-shrink-0 z-10">
        {/* Album Artwork & Spinning Vinyl Record Container */}
        <div className="relative w-24 h-24 sm:w-26 sm:h-26 group/art">
          {/* Vinyl Disc behind cover */}
          <div
            className={`absolute top-0 right-0 w-24 h-24 sm:w-26 sm:h-26 rounded-full bg-slate-950 border-2 border-slate-800 shadow-2xl transition-transform duration-500 flex items-center justify-center overflow-hidden ${
              isPlaying
                ? 'translate-x-4 animate-spin-slow'
                : 'group-hover:translate-x-2.5'
            }`}
          >
            {/* Vinyl grooves */}
            <div className="w-16 h-16 rounded-full border border-slate-700/60 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border border-slate-600/60 bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-black" />
              </div>
            </div>
          </div>

          {/* Album Cover Art */}
          <div className="relative z-10 w-full h-full rounded-xl overflow-hidden shadow-xl border border-white/10 bg-slate-950 flex items-center justify-center">
            {song.artwork ? (
              <img
                src={song.artwork}
                alt={`${song.title} album cover`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fb = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement;
                  if (fb) fb.classList.remove('hidden');
                }}
              />
            ) : null}

            {/* Robust Fallback for Missing / Broken Artwork */}
            <div
              className={`w-full h-full bg-gradient-to-br ${song.gradient} flex flex-col items-center justify-center text-center p-2 ${
                song.artwork ? 'hidden' : 'flex'
              }`}
            >
              <Disc className="w-8 h-8 text-white/60 mb-0.5" />
              <span className="text-[9px] font-black text-white/90 truncate max-w-full px-1">
                {song.title}
              </span>
            </div>

            {/* Quick Play/Pause Overlay over Artwork */}
            <button
              onClick={handleSnippetToggle}
              aria-label={isPlaying ? `Pause snippet for ${song.title}` : `Play snippet for ${song.title}`}
              className="absolute inset-0 bg-black/35 hover:bg-black/15 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              {isLoading && isActive ? (
                <Loader2 className="w-7 h-7 text-white animate-spin drop-shadow" />
              ) : isPlaying ? (
                <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-950/80">
                  <Pause className="w-3.5 h-3.5 fill-current" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-slate-950 flex items-center justify-center shadow-lg shadow-black/60 transition-transform group-hover:scale-110">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              )}
            </button>

            {/* Playing Badge Overlay (Zero Layout Shift) */}
            {isPlaying && (
              <div className="absolute bottom-1 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur border border-pink-500/60 text-[8.5px] font-black text-pink-300 z-20 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-pink-400 animate-ping" />
                <span>{Math.floor(currentTime)}s</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ZONE 4: Text Details (Strict Fixed Heights) */}
      <div className="h-[52px] my-1 flex flex-col items-center justify-center text-center px-1 z-10 flex-shrink-0 overflow-hidden">
        <h3 className="font-display text-xs sm:text-sm font-black text-white group-hover:text-purple-200 transition-colors line-clamp-1 w-full text-center">
          {song.title}
        </h3>
        <p className="text-[11px] font-semibold text-slate-300 truncate w-full text-center mt-0.5">
          {song.rawArtistString}
        </p>
        <p className="text-[10px] text-slate-400 truncate w-full text-center mt-0.5">
          {song.album} ({song.year}) • {song.genre}
        </p>
      </div>

      {/* ZONE 5: Dynamic Curator Insight Box (Constant Fixed Height) */}
      <div className="h-11 my-1 px-2 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-center z-10 flex-shrink-0 overflow-hidden">
        <p className="text-[9.5px] leading-snug text-slate-300 line-clamp-2 italic text-center w-full">
          &ldquo;{song.flowInsight?.curatorInsight || `High-affinity placement candidate for ${song.typeTag}.`}&rdquo;
        </p>
      </div>

      {/* ZONE 6: Audio Playback Progress Indicator (Absolute to Prevent Height Shift) */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-950 overflow-hidden z-20">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 transition-all duration-150"
          />
        </div>
      )}

      {/* ZONE 7: Bottom Stats & Action Buttons (Strict Alignment) */}
      <div className="pt-2 border-t border-white/[0.08] flex flex-col gap-2 z-10 flex-shrink-0 mt-auto">
        <div className="h-5 flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-cyan-400 font-semibold text-[10.5px]">
              <Disc className="w-3.5 h-3.5" />
              {song.bpm} BPM
            </span>
            {song.flowInsight?.bpmTransitionLabel && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800/80 text-cyan-300/90 border border-slate-700/60 hidden sm:inline-block">
                {song.flowInsight.bpmTransitionLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-pink-400" />
            <div className="w-14 sm:w-16 bg-gray-950 rounded-full h-1.5 border border-gray-800 overflow-hidden">
              <div
                style={{ width: `${song.energy}%` }}
                className={`h-full rounded-full ${
                  song.energy >= 85
                    ? 'bg-gradient-to-r from-pink-500 to-red-500'
                    : song.energy >= 60
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                }`}
              />
            </div>
            <span className="font-extrabold text-white text-[10px]">{song.energy}%</span>
          </div>
        </div>

        {/* Buttons Row: Snippet Audition + Lock In Pick */}
        <div className="h-10 flex items-center gap-1.5">
          <button
            onClick={handleSnippetToggle}
            className={`h-9 py-1 px-2.5 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer border flex-shrink-0 active:scale-95 ${
              isPlaying
                ? 'bg-pink-600 text-white border-pink-400 shadow-md shadow-pink-950/50'
                : 'bg-slate-950/90 hover:bg-purple-950/60 border-slate-800 hover:border-purple-500/60 text-slate-300 hover:text-white'
            }`}
            title="Listen to 30-second audio snippet"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current text-pink-400" />
                <span>Sample</span>
              </>
            )}
          </button>

          <button
            disabled={isOverBudget}
            onClick={handleDraftClick}
            className={`h-9 flex-1 py-1 px-2 rounded-xl font-black text-[11px] tracking-wide uppercase transition-all flex items-center justify-center gap-1 shadow-lg cursor-pointer active:scale-95 ${
              isOverBudget
                ? 'bg-gray-800/80 border border-gray-700 text-gray-500 cursor-not-allowed'
                : hasMonopolyWarning
                ? 'bg-gradient-to-r from-red-700 to-pink-700 hover:from-red-600 hover:to-pink-600 text-white shadow-red-950/50'
                : song.flowInsight?.isTopCuratorPick
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-110 text-white shadow-emerald-950/50'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-900/40'
            }`}
          >
            <Plus className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {isOverBudget
                ? `Over Budget ($${songPrice})`
                : hasMonopolyWarning
                ? 'Draft (Penalty)'
                : 'Lock In Pick'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
