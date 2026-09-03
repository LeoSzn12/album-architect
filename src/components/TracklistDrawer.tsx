'use client';

import React from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { X, Music, Flame, Play, Radio, Music2, ArrowUp, ArrowDown } from 'lucide-react';
import { playHoverSound } from '@/lib/audioEngine';
import { generateBulkPlaylistUrl } from '@/lib/musicBridge';

import { useModalA11y } from '@/hooks/useModalA11y';

interface TracklistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TracklistDrawer: React.FC<TracklistDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    draftedTracks,
    slots,
    energyMetrics,
    monopolyReport,
    audioEnabled,
    openRealSongPlayer,
    reorderDraftedTracks,
    gameMode,
    sessionId,
  } = useDraftStore();

  const { modalRef, handleBackdropClick, modalProps } = useModalA11y({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const draftedSongs = draftedTracks.map((t) => t.song);
  const projectLabel = gameMode === 'draft' ? 'Draft' : gameMode === 'ep' ? 'EP' : 'Album';
  const builderLabel = gameMode === 'draft' ? 'Draft Stage' : `${projectLabel} Builder`;
  const ytBulkUrl = generateBulkPlaylistUrl(draftedSongs, 'youtube');
  const spotifyBulkUrl = generateBulkPlaylistUrl(draftedSongs, 'spotify');

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        ref={modalRef}
        {...modalProps}
        className="w-full max-w-md bg-[#0d0d11]/95 backdrop-blur-2xl border-l border-white/[0.08] h-full flex flex-col justify-between shadow-2xl p-5 sm:p-6 pb-safe overflow-y-auto"
      >
        <div>
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Music className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">{projectLabel} Tracklist</h2>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {gameMode === 'draft' ? 'Live sequence' : sessionId ? 'Session saved · resume ready' : 'Autosaved locally'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-400 hover:text-white transition cursor-pointer"
              aria-label="Close tracklist drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 mb-4 flex justify-between text-xs">
            <div>
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold block">Progress</span>
              <span className="font-extrabold text-white">
                {draftedTracks.length} / {slots.length} {projectLabel === 'Draft' ? 'Tracks' : `${projectLabel} Tracks`}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold block">Avg Energy</span>
              <span className="font-extrabold text-rose-400">{energyMetrics.avgEnergy}%</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold block">Monopoly</span>
              <span
                className={`font-extrabold ${
                  monopolyReport.hasViolation ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {monopolyReport.hasViolation ? `-${monopolyReport.totalPenaltyDeduction} pts` : 'Clean'}
              </span>
            </div>
          </div>

          {/* Bulk Play / Stream Links */}
          {draftedTracks.length > 0 && (
            <div className="flex flex-col gap-2 mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                Streaming Integration Bridge
              </span>
              <div className="flex gap-2">
                <a
                  href={ytBulkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-200 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Music2 className="w-3.5 h-3.5 text-red-400" />
                  <span>YouTube Music</span>
                </a>
                <a
                  href={spotifyBulkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-200 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Spotify</span>
                </a>
              </div>
            </div>
          )}

          {draftedTracks.length > 0 && (
            <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[11px] leading-relaxed text-zinc-400">
              Use the up/down arrows to set the final listening order. Reordering updates the sequence used by the review.
            </div>
          )}

          {/* List of Drafted Tracks */}
          {draftedTracks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.1] px-4 py-12 text-center">
              <p className="text-sm font-bold text-zinc-300">No {projectLabel} tracks yet</p>
              <p className="mt-1 text-xs text-zinc-500">
                Return to the {builderLabel.toLowerCase()} to choose the first position.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {draftedTracks.map((dt, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => playHoverSound(audioEnabled)}
                  onClick={() => openRealSongPlayer(dt.song)}
                  className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.15] rounded-xl p-3 flex items-center justify-between transition group cursor-pointer"
                  title="Click to play real track in Music Bridge"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="w-6 h-6 rounded-lg bg-white/[0.06] text-zinc-300 border border-white/[0.08] text-xs font-black flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-500 transition">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition flex items-center gap-1.5 truncate">
                        <span className="truncate">{dt.song.title}</span>
                        <Play className="w-3 h-3 text-rose-500 fill-current opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
                      </h4>
                      <p className="text-xs text-zinc-400 truncate">{dt.song.rawArtistString}</p>
                      <span className="text-[10px] text-zinc-500 font-semibold block mt-0.5">
                        Pos {idx + 1} · {dt.slot.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300 font-bold border border-white/[0.08]">
                      {dt.song.bpm} BPM
                    </span>
                    <span className="text-[10px] text-rose-400 font-bold flex items-center gap-0.5">
                      <Flame className="w-3 h-3 inline" /> {dt.song.energy}%
                    </span>
                    <div className="flex gap-1 mt-1">
                      <button
                        aria-label={`Move ${dt.song.title} up`}
                        title={`Move ${dt.song.title} to position ${idx}`}
                        disabled={idx === 0}
                        onClick={(event) => {
                          event.stopPropagation();
                          reorderDraftedTracks(idx, idx - 1);
                        }}
                        className="p-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-zinc-400 hover:text-white disabled:opacity-30 transition"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        aria-label={`Move ${dt.song.title} down`}
                        title={`Move ${dt.song.title} to position ${idx + 2}`}
                        disabled={idx === draftedTracks.length - 1}
                        onClick={(event) => {
                          event.stopPropagation();
                          reorderDraftedTracks(idx, idx + 1);
                        }}
                        className="p-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-zinc-400 hover:text-white disabled:opacity-30 transition"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-white/[0.08] mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-extrabold rounded-full text-xs shadow-lg transition active:scale-95 cursor-pointer"
          >
            Back to {builderLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
