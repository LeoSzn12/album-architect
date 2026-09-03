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
    stop();
    setActivePlayingSongId(null);
    playDraftLockSound(audioEnabled);
    onDraft(song);
  };

  return (
    <div
      onMouseEnter={() => playHoverSound(audioEnabled)}
      className={`group relative min-h-[360px] rounded-2xl p-4 sm:p-5 border transition-all duration-300 flex flex-col justify-between overflow-hidden backdrop-blur-xl ${
        isPlaying
          ? 'bg-slate-900/95 border-pink-500 shadow-2xl shadow-pink-950/50 ring-2 ring-pink-500/50 -translate-y-1'
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

      {/* Top Header Row: Badges & Hotkey */}
      <div className="flex justify-between items-start mb-2 z-10 gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {candidateIndex !== undefined && (
            <span
              title={`Press '${candidateIndex + 1}' on keyboard to audition snippet`}
              className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-900/60 border border-purple-500/40 text-[10px] font-black text-purple-200"
            >
              {candidateIndex + 1}
            </span>
          )}
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 bg-purple-950/90 border border-purple-800/60 text-purple-300 rounded-md truncate max-w-[140px]">
            {song.typeTag}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {isNewMonopolyRisk && (
            <span
              title="Drafting another solo track for this artist will trigger a -1.5pt Monopoly Penalty!"
              className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-bold flex items-center gap-1 animate-pulse"
            >
              <AlertTriangle className="w-3 h-3" /> Solo Risk (-1.5)
            </span>
          )}

          {isExtendingMonopoly && (
            <span
              title="Artist already has multiple solo tracks! Drafting adds an additional -2.0pt penalty."
              className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 text-[10px] font-extrabold flex items-center gap-1 animate-pulse"
            >
              <AlertTriangle className="w-3 h-3" /> Extends Penalty (-2.0)
            </span>
          )}

          {song.featuredArtists.length > 0 && (
            <span
              title="Guest features do NOT trigger solo monopoly penalties!"
              className="px-2 py-0.5 rounded bg-pink-950/80 text-pink-300 border border-pink-800/70 text-[10px] font-bold flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-pink-400" /> Feat.
            </span>
          )}

          {/* Quick Compare Button */}
          {onCompareToggle && (
            <button
              onClick={handleCompare}
              title={isComparing ? 'Remove from A/B Compare' : 'Add to A/B Compare Face-Off'}
              className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center ${
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
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950/80 text-slate-400 hover:text-white hover:border-purple-500/60 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* A&R Spotlight Banner */}
      {song.flowInsight?.isTopCuratorPick && (
        <div className="z-10 mb-1 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse">
          <Sparkles className="w-3 h-3 text-emerald-400 fill-current" />
          <span>A&R TOP RECOMMENDATION • {song.flowInsight.synergyScore}% SYNERGY</span>
        </div>
      )}

      {/* Main Track Info with Centered Album Art & Vinyl */}
      <div className="my-1 z-10 flex flex-col items-center text-center">
        {/* Album Artwork & Spinning Vinyl Record */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 group/art my-1.5">
          {/* Vinyl Disc behind cover */}
          <div
            className={`absolute top-0 right-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-950 border-2 border-slate-800 shadow-2xl transition-transform duration-500 flex items-center justify-center overflow-hidden ${
              isPlaying
                ? 'translate-x-4 sm:translate-x-5 animate-spin-slow'
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
          <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-slate-950">
            {song.artwork ? (
              <img
                src={song.artwork}
                alt={`${song.title} album cover`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${song.gradient} flex items-center justify-center`}
              >
                <Disc className="w-10 h-10 text-white/60" />
              </div>
            )}

            {/* Quick Play/Pause Overlay over Artwork */}
            <button
              onClick={handleSnippetToggle}
              aria-label={isPlaying ? `Pause snippet for ${song.title}` : `Play snippet for ${song.title}`}
              className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              {isLoading && isActive ? (
                <Loader2 className="w-8 h-8 text-white animate-spin drop-shadow" />
              ) : isPlaying ? (
                <div className="w-9 h-9 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-950/80">
                  <Pause className="w-4 h-4 fill-current" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-950 flex items-center justify-center shadow-lg shadow-black/60 transition-transform group-hover:scale-110">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Text Details */}
        <div className="w-full px-1 mt-1">
          <h3 className="font-display text-sm sm:text-base font-black text-white group-hover:text-purple-200 transition-colors line-clamp-1">
            {song.title}
          </h3>
          <p className="text-xs font-semibold text-slate-300 truncate mt-0.5">
            {song.rawArtistString}
          </p>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {song.album} ({song.year}) • {song.genre}
          </p>

          {/* Real-time Audio Snippet Equalizer Bars */}
          {isPlaying && (
            <div className="mt-1 flex items-center justify-center gap-2">
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-1 bg-pink-400 rounded-full animate-pulse h-2.5" />
                <span className="w-1 bg-fuchsia-400 rounded-full animate-pulse h-1.5" style={{ animationDelay: '150ms' }} />
                <span className="w-1 bg-cyan-400 rounded-full animate-pulse h-3" style={{ animationDelay: '300ms' }} />
                <span className="w-1 bg-pink-400 rounded-full animate-pulse h-1" style={{ animationDelay: '75ms' }} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-pink-300 tabular-nums">
                {Math.floor(currentTime)}s / 30s
              </span>
            </div>
          )}

          {/* Dynamic A&R Flow Insight Commentary */}
          {song.flowInsight?.curatorInsight && (
            <div className="mt-1.5 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-left">
              <p className="text-[10.5px] leading-snug text-slate-300 line-clamp-2 italic">
                "{song.flowInsight.curatorInsight}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Snippet Progress Bar (only visible when playing) */}
      {isPlaying && (
        <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden my-1 z-10 border border-slate-800">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 transition-all duration-150"
          />
        </div>
      )}

      {/* Stats Chips & Draft Action Button */}
      <div className="mt-2 pt-2.5 border-t border-white/[0.08] flex flex-col gap-2.5 z-10">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-cyan-400 font-semibold text-[11px]">
              <Disc className="w-3.5 h-3.5" />
              {song.bpm} BPM
            </span>
            {song.flowInsight?.bpmTransitionLabel && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-slate-800/80 text-cyan-300/90 border border-slate-700/60 hidden sm:inline-block">
                {song.flowInsight.bpmTransitionLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-pink-400" />
            <div className="w-16 sm:w-20 bg-gray-950 rounded-full h-2 border border-gray-800 overflow-hidden">
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
            <span className="font-extrabold text-white text-[11px]">{song.energy}%</span>
          </div>
        </div>

        {/* Buttons Row: Snippet Audition + Lock In Pick (Apple / Spotify Touch Targets) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSnippetToggle}
            className={`min-h-[44px] py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border flex-shrink-0 active:scale-95 ${
              isPlaying
                ? 'bg-pink-600 text-white border-pink-400 shadow-md shadow-pink-950/50'
                : 'bg-slate-950/90 hover:bg-purple-950/60 border-slate-800 hover:border-purple-500/60 text-slate-300 hover:text-white'
            }`}
            title="Listen to 30-second audio snippet"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-pink-400" />
                <span>Sample</span>
              </>
            )}
          </button>

          <button
            onClick={handleDraftClick}
            className={`min-h-[44px] flex-1 py-2 rounded-xl font-black text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer active:scale-95 ${
              hasMonopolyWarning
                ? 'bg-gradient-to-r from-red-700 to-pink-700 hover:from-red-600 hover:to-pink-600 text-white shadow-red-950/50'
                : song.flowInsight?.isTopCuratorPick
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-110 text-white shadow-emerald-950/50'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-900/40'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{hasMonopolyWarning ? 'Draft (Penalty)' : 'Lock In Pick'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
