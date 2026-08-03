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
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={modalRef}
        {...modalProps}
        className="w-full max-w-md bg-gray-950 border-l border-gray-800 h-full flex flex-col justify-between shadow-2xl p-6 overflow-y-auto"
      >
        <div>
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-400" />
              <div>
                <h2 className="text-xl font-extrabold text-white">{projectLabel} Tracklist</h2>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  {gameMode === 'draft' ? 'Live sequence' : sessionId ? 'Session saved · resume ready' : 'Autosaved locally'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-3 mb-4 flex justify-between text-xs">
            <div>
              <span className="text-gray-400 block">Progress</span>
              <span className="font-bold text-purple-300">
                {draftedTracks.length} / {slots.length} {projectLabel === 'Draft' ? 'Tracks' : `${projectLabel} Tracks`}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Avg Energy</span>
              <span className="font-bold text-pink-400">{energyMetrics.avgEnergy}%</span>
            </div>
            <div>
              <span className="text-gray-400 block">Monopoly</span>
              <span
                className={`font-bold ${
                  monopolyReport.hasViolation ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {monopolyReport.hasViolation ? `-${monopolyReport.totalPenaltyDeduction} pts` : 'Clean'}
              </span>
            </div>
          </div>

          {/* Bulk Play / Stream Links */}
          {draftedTracks.length > 0 && (
            <div className="flex flex-col gap-2 mb-4 p-3 rounded-xl bg-gray-900 border border-purple-900/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                Streaming Integration Bridge
              </span>
              <div className="flex gap-2">
                <a
                  href={ytBulkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Music2 className="w-3.5 h-3.5" />
                  <span>Play YouTube Music</span>
                </a>
                <a
                  href={spotifyBulkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Stream Spotify</span>
                </a>
              </div>
            </div>
          )}

          {draftedTracks.length > 0 && (
            <div className="mb-4 rounded-xl border border-cyan-900/50 bg-cyan-950/20 px-3 py-2 text-[11px] leading-relaxed text-cyan-200">
              Use the up/down arrows to set the final listening order. Reordering updates the sequence used by the review.
            </div>
          )}

          {/* List of Drafted Tracks */}
          {draftedTracks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-800 px-4 py-12 text-center">
              <p className="text-sm font-bold text-gray-300">No {projectLabel} tracks yet</p>
              <p className="mt-1 text-xs text-gray-500">
                Return to the {builderLabel.toLowerCase()} to choose the first position.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {draftedTracks.map((dt, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => playHoverSound(audioEnabled)}
                  onClick={() => openRealSongPlayer(dt.song)}
                  className="bg-gray-900/80 border border-gray-800/80 rounded-xl p-3 flex items-center justify-between hover:border-purple-500/50 transition group cursor-pointer"
                  title="Click to play real track in Music Bridge"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-purple-950 text-purple-300 border border-purple-800/80 text-xs font-bold flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition flex items-center gap-1.5">
                        {dt.song.title}
                        <Play className="w-3 h-3 text-pink-400 fill-current opacity-0 group-hover:opacity-100 transition" />
                      </h4>
                      <p className="text-xs text-gray-400">{dt.song.rawArtistString}</p>
                      <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
                        Position {idx + 1} · Role: {dt.slot.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-950 text-cyan-300 font-semibold border border-gray-800">
                      {dt.song.bpm} BPM
                    </span>
                    <span className="text-[10px] text-pink-400 font-bold flex items-center gap-0.5">
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
                        className="p-1 rounded bg-gray-950 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-30"
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
                        className="p-1 rounded bg-gray-950 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-30"
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

        <div className="pt-4 border-t border-gray-800 mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Back to {builderLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
