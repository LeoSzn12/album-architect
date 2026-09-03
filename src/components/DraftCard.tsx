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
  TrendingUp,
  Activity,
  Layers,
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

  // Solo Monopoly calculations
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
    <article
      aria-label={`Candidate ${candidateIndex !== undefined ? candidateIndex + 1 : ''}: ${song.title} by ${song.artist}`}
      onMouseEnter={() => {
        playHoverSound(audioEnabled);
        onHoverCandidate?.(song);
      }}
      onMouseLeave={() => {
        onHoverCandidate?.(null);
      }}
      onTouchStart={() => {
        onHoverCandidate?.(song);
      }}
      className={`group relative h-full min-h-[500px] rounded-3xl p-3.5 sm:p-4 border transition-all duration-300 flex flex-col justify-between overflow-hidden backdrop-blur-2xl ${
        isPlaying
          ? 'bg-slate-900/95 border-pink-500 shadow-2xl shadow-pink-950/60 ring-2 ring-pink-500/50'
          : song.flowInsight?.isTopCuratorPick
          ? 'bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-emerald-950/30 border-emerald-500/60 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-400/50 hover:border-emerald-400'
          : hasMonopolyWarning
          ? 'bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-red-950/30 border-red-900/70 hover:border-red-500/80 shadow-lg shadow-red-950/20'
          : 'bg-[#0e121d]/85 border-white/[0.08] hover:border-purple-500/60 hover:bg-slate-900/95 hover:shadow-2xl hover:shadow-purple-950/40 hover:-translate-y-1'
      }`}
    >
      {/* Ambient Gradient Reflection Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${song.gradient} ${
          isPlaying
            ? 'opacity-25'
            : song.flowInsight?.isTopCuratorPick
            ? 'opacity-20'
            : 'opacity-10 group-hover:opacity-20'
        } transition-opacity pointer-events-none`}
      />

      {/* ZONE 1: Header Bar & Tags */}
      <div className="z-10 flex flex-col gap-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            {candidateIndex !== undefined && (
              <span
                title={`Press '${candidateIndex + 1}' on keyboard to audition`}
                className="flex h-5 w-5 items-center justify-center rounded-lg bg-white/[0.08] border border-white/[0.12] text-[10px] font-black text-slate-300 group-hover:text-white group-hover:border-purple-400/50 transition-colors"
              >
                {candidateIndex + 1}
              </span>
            )}
            <span
              title={`Card price: $${songPrice}`}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-black border flex items-center gap-1 transition-all ${
                isOverBudget
                  ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-sm'
              }`}
            >
              {songPrice === 0 ? '🆓 Waiver' : `💰 $${songPrice}`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Compare Button */}
            {onCompareToggle && (
              <button
                onClick={handleCompare}
                title={isComparing ? 'Remove from A/B Compare' : 'Add to A/B Compare'}
                className={`p-1.5 rounded-xl border text-xs transition-all cursor-pointer h-7 w-7 flex items-center justify-center ${
                  isComparing
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-bold'
                    : 'bg-slate-950/80 border-white/[0.08] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Modal Deep-dive Player */}
            <button
              onClick={handleOpenModal}
              title="Open full player & official video"
              className="p-1.5 rounded-xl border border-white/[0.08] bg-slate-950/80 text-slate-400 hover:text-white hover:border-purple-500/60 transition-colors cursor-pointer h-7 w-7 flex items-center justify-center"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Monopoly Status & Badges */}
        <div className="flex items-center justify-between gap-1 text-[10px] min-h-[22px]">
          <span className="font-extrabold uppercase tracking-wider px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] text-slate-300 rounded-md truncate max-w-[125px]">
            {song.typeTag}
          </span>

          <div className="flex items-center gap-1 overflow-hidden">
            {isNewMonopolyRisk && (
              <span
                title="Drafting another solo track for this artist will trigger a -1.5pt Monopoly Penalty!"
                className="px-1.5 py-0.5 rounded bg-red-950/90 text-red-300 border border-red-800 font-bold flex items-center gap-1 animate-pulse truncate"
              >
                <AlertTriangle className="w-3 h-3 flex-shrink-0" /> Solo Risk
              </span>
            )}

            {isExtendingMonopoly && (
              <span
                title="Artist already has multiple solo tracks! Drafting adds an additional -2.0pt penalty."
                className="px-1.5 py-0.5 rounded bg-red-950/90 text-red-300 border border-red-700 font-extrabold flex items-center gap-1 animate-pulse truncate"
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

      {/* ZONE 2: Apple Music / Spotify Cover Art & Vinyl Record */}
      <div className="h-28 my-1 flex items-center justify-center relative flex-shrink-0 z-10">
        <div className="relative w-24 h-24 sm:w-26 sm:h-26 group/art">
          {/* Animated Vinyl Disc peeking behind cover */}
          <div
            className={`absolute top-0 right-0 w-24 h-24 sm:w-26 sm:h-26 rounded-full bg-slate-950 border-2 border-slate-800 shadow-2xl transition-transform duration-500 flex items-center justify-center overflow-hidden ${
              isPlaying
                ? 'translate-x-4 animate-spin-slow'
                : 'group-hover:translate-x-2'
            }`}
          >
            <div className="w-16 h-16 rounded-full border border-slate-700/60 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border border-slate-600/60 bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-black" />
              </div>
            </div>
          </div>

          {/* Album Cover Art */}
          <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 bg-slate-950 flex items-center justify-center">
            {song.artwork ? (
              <img
                src={song.artwork}
                alt={`${song.title} artwork`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fb = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement;
                  if (fb) fb.classList.remove('hidden');
                }}
              />
            ) : null}

            {/* Artwork Fallback */}
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

            {/* Play/Pause Overlay */}
            <button
              onClick={handleSnippetToggle}
              aria-label={isPlaying ? `Pause snippet for ${song.title}` : `Play snippet for ${song.title}`}
              className="absolute inset-0 bg-black/30 hover:bg-black/15 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              {isLoading && isActive ? (
                <Loader2 className="w-7 h-7 text-white animate-spin drop-shadow" />
              ) : isPlaying ? (
                <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-950/80">
                  <Pause className="w-3.5 h-3.5 fill-current" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-slate-950 flex items-center justify-center shadow-xl shadow-black/60 transition-transform group-hover:scale-110">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              )}
            </button>

            {/* Time Stamp overlay */}
            {isPlaying && (
              <div className="absolute bottom-1 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur border border-pink-500/60 text-[8.5px] font-black text-pink-300 z-20 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-pink-400 animate-ping" />
                <span>{Math.floor(currentTime)}s</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ZONE 3: Editorial Typography */}
      <div className="my-1 flex flex-col items-center justify-center text-center px-1 z-10 flex-shrink-0">
        <h3 className="font-display text-xs sm:text-sm font-black text-white group-hover:text-purple-200 transition-colors line-clamp-1 w-full text-center">
          {song.title}
        </h3>
        <p className="text-[11px] font-semibold text-slate-300 truncate w-full text-center mt-0.5 flex items-center justify-center gap-1">
          <span>{song.artist}</span>
          {song.featuredArtists.length > 0 && (
            <span className="text-[9.5px] text-pink-300 font-medium">
              (ft. {song.featuredArtists.join(', ')})
            </span>
          )}
        </p>
        <p className="text-[10px] text-slate-400 truncate w-full text-center mt-0.5">
          {song.album} {song.year ? `(${song.year})` : ''} • {song.genre}
        </p>
      </div>

      {/* ZONE 4: Structured Data Micro-Spec Grid (Apple Fitness / Spotify Stats Aesthetic) */}
      <div className="my-1.5 grid grid-cols-2 gap-1.5 z-10 flex-shrink-0">
        {/* Cell 1: BPM & Tempo Transition */}
        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Tempo</span>
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-2.5">
                <span className="w-0.5 bg-cyan-400 rounded-full animate-eq-1" />
                <span className="w-0.5 bg-cyan-400 rounded-full animate-eq-2" />
                <span className="w-0.5 bg-cyan-400 rounded-full animate-eq-3" />
              </div>
            ) : (
              <Disc className="w-3 h-3 text-cyan-400" />
            )}
          </div>
          <div className="text-xs font-black text-white mt-0.5">{song.bpm} BPM</div>
          <span className="text-[9px] text-cyan-300/80 font-medium truncate mt-0.5">
            {song.flowInsight?.bpmTransitionLabel || 'Rhythm Anchor'}
          </span>
        </div>

        {/* Cell 2: Precision Energy Gauge */}
        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Energy</span>
            <Flame className="w-3 h-3 text-pink-400" />
          </div>
          <div className="text-xs font-black text-white mt-0.5 flex items-center justify-between">
            <span>{song.energy}%</span>
            <span className="text-[8.5px] font-semibold text-slate-400">
              {song.energy >= 85 ? 'High Peak' : song.energy >= 60 ? 'Cruising' : 'Mellow'}
            </span>
          </div>
          <div className="w-full bg-black/60 rounded-full h-1 mt-1 overflow-hidden">
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
        </div>

        {/* Cell 3: Slot Affinity & Synergy */}
        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Synergy</span>
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-xs font-black text-emerald-300 mt-0.5">
            {song.flowInsight?.synergyScore ? `${song.flowInsight.synergyScore}% Match` : 'A&R Qualified'}
          </div>
          <span className="text-[9px] text-slate-400 font-medium truncate mt-0.5">
            {song.flowInsight?.pacingLabel || 'Slot Compatible'}
          </span>
        </div>

        {/* Cell 4: Cultural Acclaim / Archetype */}
        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Identity</span>
            <Layers className="w-3 h-3 text-purple-400" />
          </div>
          <div className="text-xs font-black text-purple-300 mt-0.5 truncate">
            {song.archetypes[0]?.replace(/-/g, ' ') || 'Classic'}
          </div>
          <span className="text-[9px] text-slate-400 font-medium truncate mt-0.5">
            {song.impact}% Impact Score
          </span>
        </div>
      </div>

      {/* ZONE 5: Editorial Insight Banner */}
      <div className="h-10 my-0.5 px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-center z-10 flex-shrink-0 overflow-hidden">
        <p className="text-[9px] leading-snug text-slate-300 line-clamp-2 italic text-center w-full">
          &ldquo;{song.flowInsight?.curatorInsight || `High-affinity placement candidate for ${song.typeTag}.`}&rdquo;
        </p>
      </div>

      {/* Progress Bar for Snippet Playback */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-950 overflow-hidden z-20">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 transition-all duration-150"
          />
        </div>
      )}

      {/* ZONE 6: Action Footer */}
      <div className="pt-2.5 border-t border-white/[0.08] flex items-center gap-2 z-10 flex-shrink-0 mt-auto">
        <button
          onClick={handleSnippetToggle}
          className={`h-11 min-h-[44px] py-2 px-3.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border flex-shrink-0 active:scale-95 ${
            isPlaying
              ? 'bg-pink-600 text-white border-pink-400 shadow-md shadow-pink-950/50'
              : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-slate-200 hover:text-white'
          }`}
          title="Sample 30-second official audio"
          aria-label={isPlaying ? 'Pause 30-second sample' : 'Play 30-second sample'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current text-pink-400 ml-0.5" />
              <span>Sample</span>
            </>
          )}
        </button>

        <button
          disabled={isOverBudget}
          onClick={handleDraftClick}
          className={`h-11 min-h-[44px] flex-1 py-2 px-4 rounded-2xl font-black text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 shadow-xl cursor-pointer active:scale-95 ${
            isOverBudget
              ? 'bg-gray-800/80 border border-gray-700 text-gray-500 cursor-not-allowed'
              : hasMonopolyWarning
              ? 'bg-gradient-to-r from-red-700 to-pink-700 hover:from-red-600 hover:to-pink-600 text-white shadow-red-950/50'
              : song.flowInsight?.isTopCuratorPick
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-110 text-white shadow-emerald-950/50'
              : 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-purple-900/40'
          }`}
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {isOverBudget
              ? `Over Budget ($${songPrice})`
              : hasMonopolyWarning
              ? 'Lock In (Penalty)'
              : 'Lock In Pick'}
          </span>
        </button>
      </div>
    </article>
  );
};
