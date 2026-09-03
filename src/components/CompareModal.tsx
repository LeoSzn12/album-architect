'use client';

import React from 'react';
import type { Song, DraftSlot } from '@/types/draft';
import { useSnippetAudio } from '@/hooks/useSnippetAudio';
import { useDraftStore } from '@/store/useDraftStore';
import {
  X,
  Play,
  Pause,
  Disc,
  Flame,
  AlertTriangle,
  Sparkles,
  Check,
  Plus,
  ArrowRightLeft,
  Volume2,
} from 'lucide-react';
import { playDraftLockSound } from '@/lib/audioEngine';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: [Song, Song];
  slot?: DraftSlot;
  onSelectSong: (song: Song) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  songs,
  slot,
  onSelectSong,
}) => {
  const { monopolyReport, audioEnabled } = useDraftStore();
  const { isSongPlaying, toggleSong, currentTime, duration, progressPercent, stop } = useSnippetAudio();

  if (!isOpen || songs.length < 2) return null;

  const [songA, songB] = songs;
  const isPlayingA = isSongPlaying(songA.id);
  const isPlayingB = isSongPlaying(songB.id);

  const getMonopolyWarning = (song: Song) => {
    const soloCount = monopolyReport.artistCounts[song.artist]?.solo || 0;
    return soloCount >= 1;
  };

  const handlePick = (song: Song) => {
    stop();
    playDraftLockSound(audioEnabled);
    onSelectSong(song);
    onClose();
  };

  const handleSwitchAudio = () => {
    if (isPlayingA) {
      toggleSong(songB);
    } else if (isPlayingB) {
      toggleSong(songA);
    } else {
      toggleSong(songA);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#0e0e12]/95 border border-white/[0.08] backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] bg-[#09090c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white flex items-center justify-center shadow-md">
              <ArrowRightLeft className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                A/B Face-Off Audition
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Compare Candidates for {slot?.name ?? 'This Slot'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSwitchAudio}
              className="py-1.5 px-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 border border-white/[0.08] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              title="Toggle playback between Track A and Track B"
            >
              <Volume2 className="w-3.5 h-3.5 text-rose-500" />
              <span>A/B Switch</span>
            </button>

            <button
              onClick={() => {
                stop();
                onClose();
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-400 hover:text-white transition cursor-pointer"
              aria-label="Close comparison"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comparison Body: Two Columns */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-[#09090c]/80">
          {[songA, songB].map((song, idx) => {
            const isA = idx === 0;
            const isPlaying = isA ? isPlayingA : isPlayingB;
            const hasPenalty = getMonopolyWarning(song);
            const otherSong = isA ? songB : songA;
            const bpmDiff = song.bpm - otherSong.bpm;
            const energyDiff = song.energy - otherSong.energy;

            return (
              <div
                key={song.id}
                className={`relative rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                  isPlaying
                    ? 'bg-[#14141a]/95 border-rose-500/80 ring-1 ring-rose-500/40 shadow-xl shadow-rose-950/40'
                    : 'bg-[#121216]/85 border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                <div>
                  {/* Column Label */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-zinc-300 text-[10px] font-black uppercase tracking-wider">
                      Option {isA ? 'A' : 'B'}
                    </span>
                    <span className="text-xs font-semibold text-zinc-400">
                      {song.typeTag}
                    </span>
                  </div>

                  {/* Artwork & Title */}
                  <div className="flex gap-4 items-center mb-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 shadow-md bg-zinc-900 flex-shrink-0">
                      {song.artwork ? (
                        <img
                          src={song.artwork}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${song.gradient} flex items-center justify-center`}>
                          <Disc className="w-8 h-8 text-white/50" />
                        </div>
                      )}

                      <button
                        onClick={() => toggleSong(song)}
                        className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center cursor-pointer transition-colors"
                        aria-label={isPlaying ? 'Pause snippet' : 'Play snippet'}
                      >
                        {isPlaying ? (
                          <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg">
                            <Pause className="w-4 h-4 fill-current" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        )}
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-black text-white truncate">{song.title}</h3>
                      <p className="text-sm font-semibold text-zinc-300 truncate">{song.rawArtistString}</p>
                      <p className="text-xs text-zinc-400 truncate">{song.album} ({song.year})</p>

                      {isPlaying && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400 font-bold">
                          <div className="flex items-end gap-0.5 h-3">
                            <span className="w-1 bg-rose-400 rounded-full animate-pulse h-2.5" />
                            <span className="w-1 bg-rose-300 rounded-full animate-pulse h-1.5" />
                            <span className="w-1 bg-white rounded-full animate-pulse h-3" />
                          </div>
                          <span>Playing snippet ({Math.floor(currentTime)}s / 30s)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metrics Comparison Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold">Tempo</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-white font-black text-sm">{song.bpm} BPM</span>
                        <span className={`text-[10px] font-bold ${bpmDiff > 0 ? 'text-rose-400' : bpmDiff < 0 ? 'text-zinc-300' : 'text-zinc-500'}`}>
                          {bpmDiff > 0 ? `+${bpmDiff}` : bpmDiff < 0 ? `${bpmDiff}` : '='}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold">Energy</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-white font-black text-sm">{song.energy}%</span>
                        <span className={`text-[10px] font-bold ${energyDiff > 0 ? 'text-rose-400' : energyDiff < 0 ? 'text-zinc-300' : 'text-zinc-500'}`}>
                          {energyDiff > 0 ? `+${energyDiff}%` : energyDiff < 0 ? `${energyDiff}%` : '='}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Strategic Monopoly Check */}
                  <div className="mb-4">
                    {hasPenalty ? (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Artist Monopoly Risk: Solo track causes penalty points!</span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Clean Roster: No monopoly penalty risk.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pick Button */}
                <button
                  onClick={() => handlePick(song)}
                  className={`w-full py-3 rounded-full font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                    hasPenalty
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-white hover:bg-zinc-200 text-black'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Lock In Option {isA ? 'A' : 'B'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
