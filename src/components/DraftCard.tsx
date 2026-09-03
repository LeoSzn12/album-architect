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
      className={`group relative h-full min-h-[500px] rounded-2xl p-3.5 sm:p-4 border transition-all duration-300 flex flex-col justify-between overflow-hidden backdrop-blur-2xl ${
        isPlaying
          ? 'bg-[#16161c]/95 border-rose-500 shadow-2xl shadow-rose-950/50 ring-1 ring-rose-500/40'
          : song.flowInsight?.isTopCuratorPick
          ? 'bg-[#12141a]/95 border-emerald-500/60 shadow-xl shadow-emerald-950/20 ring-1 ring-emerald-400/40 hover:border-emerald-400'
          : hasMonopolyWarning
          ? 'bg-[#161214]/95 border-rose-900/70 hover:border-rose-500/80 shadow-lg shadow-rose-950/20'
          : 'bg-[#121216]/85 border-white/[0.08] hover:border-white/20 hover:bg-[#181820]/95 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-1'
      }`}
    >
      {/* Subtle Specular Top Sheen */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      {/* Ambient Artwork Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${song.gradient} ${
          isPlaying
            ? 'opacity-20'
            : song.flowInsight?.isTopCuratorPick
            ? 'opacity-15'
            : 'opacity-5 group-hover:opacity-10'
        } transition-opacity pointer-events-none`}
      />

      {/* ZONE 1: Header Bar & Tags */}
      <div className="z-10 flex flex-col gap-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            {candidateIndex !== undefined && (
              <span
                title={`Press '${candidateIndex + 1}' on keyboard to audition`}
                className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.08] border border-white/[0.12] text-[10px] font-bold text-zinc-300 group-hover:text-white group-hover:border-white/30 transition-colors"
              >
                {candidateIndex + 1}
              </span>
            )}
            <span
              title={`Card price: $${songPrice}`}
              className={`px-2 py-0.5 rounded-md text-[10px] font-black border flex items-center gap-1 transition-all ${
                isOverBudget
                  ? 'bg-rose-950/80 text-rose-300 border-rose-600 animate-pulse'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 shadow-sm'
              }`}
            >
              {songPrice === 0 ? 'Free Pick' : `$${songPrice}`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Compare Button */}
            {onCompareToggle && (
              <button
                onClick={handleCompare}
                title={isComparing ? 'Remove from A/B Compare' : 'Add to A/B Compare'}
                className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer h-7 w-7 flex items-center justify-center ${
                  isComparing
                    ? 'bg-white text-black border-white shadow-md font-bold'
                    : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Modal Deep-dive Player */}
            <button
              onClick={handleOpenModal}
              title="Open full player & official video"
              className="p-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-white hover:border-white/20 transition-colors cursor-pointer h-7 w-7 flex items-center justify-center"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Monopoly Status & Badges */}
        <div className="flex items-center justify-between gap-1 text-[10px] min-h-[22px]">
          <span className="font-bold uppercase tracking-wider px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] text-zinc-300 rounded-md truncate max-w-[125px]">
            {song.typeTag}
          </span>

          <div className="flex items-center gap-1 overflow-hidden">
            {isNewMonopolyRisk && (
              <span
                title="Drafting another solo track for this artist will trigger a -1.5pt Monopoly Penalty!"
                className="px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-800 font-bold flex items-center gap-1 animate-pulse truncate"
              >
                <AlertTriangle className="w-3 h-3 flex-shrink-0" /> Solo Risk
              </span>
            )}

            {isExtendingMonopoly && (
              <span
                title="Artist already has multiple solo tracks! Drafting adds an additional -2.0pt penalty."
                className="px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-700 font-extrabold flex items-center gap-1 animate-pulse truncate"
              >
                <AlertTriangle className="w-3 h-3 flex-shrink-0" /> Monopoly
              </span>
            )}

            {!hasMonopolyWarning && song.featuredArtists.length > 0 && (
              <span
                title="Guest features do NOT trigger solo monopoly penalties!"
                className="px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.08] font-bold flex items-center gap-0.5"
              >
                <Sparkles className="w-3 h-3 text-rose-400 flex-shrink-0" /> Feat.
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
            className={`absolute top-0 right-0 w-24 h-24 sm:w-26 sm:h-26 rounded-full bg-[#0a0a0c] border border-zinc-800 shadow-2xl transition-transform duration-500 flex items-center justify-center overflow-hidden ${
              isPlaying
                ? 'translate-x-4 animate-spin-slow'
                : 'group-hover:translate-x-2'
            }`}
          >
            <div className="w-16 h-16 rounded-full border border-zinc-800 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border border-zinc-700 bg-rose-600 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-black" />
              </div>
            </div>
          </div>

          {/* Album Cover Art */}
          <div className="relative z-10 w-full h-full rounded-xl overflow-hidden shadow-2xl shadow-black/90 border border-white/10 bg-zinc-950 flex items-center justify-center">
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
                <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-950/80">
                  <Pause className="w-3.5 h-3.5 fill-current" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white hover:bg-zinc-100 text-black flex items-center justify-center shadow-xl shadow-black/80 transition-transform group-hover:scale-110">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              )}
            </button>

            {/* Time Stamp overlay */}
            {isPlaying && (
              <div className="absolute bottom-1 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur border border-rose-500/60 text-[8.5px] font-black text-rose-300 z-20 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-rose-400 animate-ping" />
                <span>{Math.floor(currentTime)}s</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ZONE 3: Editorial Typography */}
      <div className="my-1 flex flex-col items-center justify-center text-center px-1 z-10 flex-shrink-0">
        <h3 className="text-xs sm:text-sm font-extrabold text-white group-hover:text-zinc-200 transition-colors line-clamp-1 w-full text-center tracking-tight">
          {song.title}
        </h3>
        <p className="text-[11px] font-medium text-zinc-300 truncate w-full text-center mt-0.5 flex items-center justify-center gap-1">
          <span>{song.artist}</span>
          {song.featuredArtists.length > 0 && (
            <span className="text-[9.5px] text-zinc-400 font-normal">
              (ft. {song.featuredArtists.join(', ')})
            </span>
          )}
        </p>
        <p className="text-[10px] text-zinc-400 truncate w-full text-center mt-0.5">
          {song.album} {song.year ? `(${song.year})` : ''} • {song.genre}
        </p>
      </div>

      {/* ZONE 4: Structured Data Micro-Spec Grid (Apple / Spotify Stats Aesthetic) */}
      <div className="my-1.5 grid grid-cols-2 gap-1.5 z-10 flex-shrink-0">
        {/* Cell 1: BPM & Tempo Transition */}
        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Tempo</span>
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-2.5">
                <span className="w-0.5 bg-rose-500 rounded-full animate-eq-1" />
                <span className="w-0.5 bg-rose-500 rounded-full animate-eq-2" />
                <span className="w-0.5 bg-rose-500 rounded-full animate-eq-3" />
              </div>
            ) : (
              <Disc className="w-3 h-3 text-zinc-400" />
            )}
          </div>
          <div className="text-xs font-extrabold text-white mt-0.5">{song.bpm} BPM</div>
          <span className="text-[9px] text-zinc-400 font-medium truncate mt-0.5">
            {song.flowInsight?.bpmTransitionLabel || 'Rhythm Anchor'}
          </span>
        </div>

        {/* Cell 2: Precision Energy Gauge */}
        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Energy</span>
            <Flame className="w-3 h-3 text-rose-400" />
          </div>
          <div className="text-xs font-extrabold text-white mt-0.5 flex items-center justify-between">
            <span>{song.energy}%</span>
            <span className="text-[8.5px] font-medium text-zinc-400">
              {song.energy >= 85 ? 'High Peak' : song.energy >= 60 ? 'Cruising' : 'Mellow'}
            </span>
          </div>
          <div className="w-full bg-black/60 rounded-full h-1 mt-1 overflow-hidden">
            <div
              style={{ width: `${song.energy}%` }}
              className={`h-full rounded-full ${
                song.energy >= 85
                  ? 'bg-rose-500'
                  : song.energy >= 60
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
          </div>
        </div>

        {/* Cell 3: Slot Affinity & Synergy */}
        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Synergy</span>
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-xs font-extrabold text-emerald-400 mt-0.5">
            {song.flowInsight?.synergyScore ? `${song.flowInsight.synergyScore}% Match` : 'A&R Qualified'}
          </div>
          <span className="text-[9px] text-zinc-400 font-medium truncate mt-0.5">
            {song.flowInsight?.pacingLabel || 'Slot Compatible'}
          </span>
        </div>

        {/* Cell 4: Cultural Acclaim / Archetype */}
        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Identity</span>
            <Layers className="w-3 h-3 text-zinc-300" />
          </div>
          <div className="text-xs font-extrabold text-white mt-0.5 truncate">
            {song.archetypes[0]?.replace(/-/g, ' ') || 'Classic'}
          </div>
          <span className="text-[9px] text-zinc-400 font-medium truncate mt-0.5">
            {song.impact}% Impact Score
          </span>
        </div>
      </div>

      {/* ZONE 5: Editorial Insight Banner */}
      <div className="h-10 my-0.5 px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-center z-10 flex-shrink-0 overflow-hidden">
        <p className="text-[9.5px] leading-snug text-zinc-300 line-clamp-2 italic text-center w-full">
          &ldquo;{song.flowInsight?.curatorInsight || `High-affinity placement candidate for ${song.typeTag}.`}&rdquo;
        </p>
      </div>

      {/* Progress Bar for Snippet Playback */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 overflow-hidden z-20">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-rose-500 transition-all duration-150"
          />
        </div>
      )}

      {/* ZONE 6: Action Footer */}
      <div className="pt-2.5 border-t border-white/[0.08] flex items-center gap-2 z-10 flex-shrink-0 mt-auto">
        <button
          onClick={handleSnippetToggle}
          className={`h-11 min-h-[44px] py-2 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border flex-shrink-0 active:scale-95 ${
            isPlaying
              ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/50'
              : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-zinc-200 hover:text-white'
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
              <Play className="w-4 h-4 fill-current text-white ml-0.5" />
              <span>Sample</span>
            </>
          )}
        </button>

        <button
          disabled={isOverBudget}
          onClick={handleDraftClick}
          className={`h-11 min-h-[44px] flex-1 py-2 px-4 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            isOverBudget
              ? 'bg-zinc-800/80 border border-zinc-700 text-zinc-500 cursor-not-allowed'
              : hasMonopolyWarning
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
              : song.flowInsight?.isTopCuratorPick
              ? 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-lg shadow-emerald-950/40'
              : 'bg-white hover:bg-zinc-200 text-black shadow-xl hover:shadow-white/10'
          }`}
        >
          <Plus className="w-4 h-4 flex-shrink-0 stroke-[2.5]" />
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
