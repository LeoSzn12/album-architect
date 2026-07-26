'use client';

import React from 'react';
import { Song } from '@/types/draft';
import { useDraftStore } from '@/store/useDraftStore';
import { Play, Flame, Disc, AlertTriangle, Sparkles, Plus } from 'lucide-react';
import {
  playHoverSound,
  playDraftLockSound,
  stopSongPreview,
} from '@/lib/audioEngine';

interface DraftCardProps {
  song: Song;
  onDraft: (song: Song) => void;
}

export const DraftCard: React.FC<DraftCardProps> = ({ song, onDraft }) => {
  const {
    audioEnabled,
    monopolyReport,
    setActivePlayingSongId,
    openRealSongPlayer,
  } = useDraftStore();

  // Check if drafting this song triggers or extends a solo monopoly penalty
  const currentSoloCount = monopolyReport.artistCounts[song.artist]?.solo || 0;
  const isNewMonopolyRisk = currentSoloCount === 1;
  const isExtendingMonopoly = currentSoloCount >= 2;
  const hasMonopolyWarning = isNewMonopolyRisk || isExtendingMonopoly;

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopSongPreview();
    openRealSongPlayer(song);
  };

  const handleDraftClick = () => {
    stopSongPreview();
    setActivePlayingSongId(null);
    playDraftLockSound(audioEnabled);
    onDraft(song);
  };

  return (
    <div
      onMouseEnter={() => playHoverSound(audioEnabled)}
      className={`group relative rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer backdrop-blur-md ${
        hasMonopolyWarning
          ? 'bg-gradient-to-b from-gray-900 via-gray-900 to-red-950/40 border-red-900/60 hover:border-red-500 shadow-lg shadow-red-950/20'
          : 'bg-gray-900/90 border-gray-800 hover:border-purple-500/80 hover:shadow-2xl hover:shadow-purple-950/50 hover:-translate-y-1'
      }`}
    >
      {/* Background Subtle Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${song.gradient} opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none`}
      />

      {/* Top Badges Row */}
      <div className="flex justify-between items-start mb-3 z-10">
        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-purple-950/80 border border-purple-800/60 text-purple-300 rounded-md">
          {song.typeTag}
        </span>

        <div className="flex items-center gap-2">
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
              className="px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-800 text-[10px] font-bold flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-pink-400" /> Feat. Guest
            </span>
          )}
        </div>
      </div>

      {/* Main Track Info */}
      <div className="my-3 z-10">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl font-extrabold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
            {song.title}
          </h3>

          {/* Audio Preview Synth Play Button */}
          {/* Real Song Audio Player Bridge Button */}
          <button
            onClick={handlePlayToggle}
            className="p-2 rounded-xl border transition-all cursor-pointer flex-shrink-0 bg-gray-950 hover:bg-purple-900/60 border-purple-900/40 text-purple-300 hover:text-white hover:border-purple-500 shadow-md flex items-center gap-1 text-xs font-bold"
            title="Play Real Song (YouTube Music / Spotify)"
          >
            <Play className="w-4 h-4 fill-current text-pink-400" />
          </button>
        </div>

        <p className="text-sm font-semibold text-gray-300 mt-1 line-clamp-1">
          {song.rawArtistString}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {song.album} ({song.year}) • {song.genre}
        </p>
      </div>

      {/* Stats Chips & Draft Action Button */}
      <div className="mt-4 pt-3 border-t border-gray-800/80 flex flex-col gap-3 z-10">
        <div className="flex justify-between items-center text-xs">
          <span className="flex items-center gap-1 text-cyan-400 font-semibold">
            <Disc className="w-3.5 h-3.5" />
            {song.bpm} BPM
          </span>

          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-pink-400" />
            <div className="w-20 bg-gray-950 rounded-full h-2 border border-gray-800 overflow-hidden">
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

        <button
          onClick={handleDraftClick}
          className={`w-full py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
            hasMonopolyWarning
              ? 'bg-gradient-to-r from-red-700 to-pink-700 hover:from-red-600 hover:to-pink-600 text-white shadow-red-950/50'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-900/40 group-hover:scale-[1.02]'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{hasMonopolyWarning ? 'Draft Track (Penalty)' : 'Lock In Pick'}</span>
        </button>
      </div>
    </div>
  );
};
