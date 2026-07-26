'use client';

import React, { useEffect, useState } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import {
  getYouTubeMusicUrl,
  getYouTubeVideoUrl,
  getSpotifyUrl,
  getYouTubeEmbedUrl,
  getSpotifyEmbedUrl,
} from '@/lib/musicBridge';
import { playSongPreview, stopSongPreview } from '@/lib/audioEngine';
import {
  X,
  Play,
  Square,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Music2,
  Disc,
  Flame,
  Radio,
} from 'lucide-react';

import { useModalA11y } from '@/hooks/useModalA11y';

export const RealSongPlayerModal: React.FC = () => {
  const {
    isPlayerModalOpen,
    closeRealSongPlayer,
    selectedRealSong,
    audioSourcePreference,
    setAudioSourcePreference,
    draftedTracks,
    playNextDraftedTrack,
    playPrevDraftedTrack,
    audioEnabled,
  } = useDraftStore();

  const [isSynthPlaying, setIsSynthPlaying] = useState(false);

  const { modalRef, handleBackdropClick, modalProps } = useModalA11y({
    isOpen: isPlayerModalOpen,
    onClose: () => {
      stopSongPreview();
      setIsSynthPlaying(false);
      closeRealSongPlayer();
    },
  });

  useEffect(() => {
    // Stop synth on song change or modal close
    queueMicrotask(() => setIsSynthPlaying(false));
    return () => {
      stopSongPreview();
    };
  }, [selectedRealSong?.id, isPlayerModalOpen]);

  if (!isPlayerModalOpen || !selectedRealSong) return null;

  const spotifyEmbedUrl = getSpotifyEmbedUrl(selectedRealSong); // null if no valid ID
  const ytMusicUrl      = getYouTubeMusicUrl(selectedRealSong);
  const ytVideoUrl      = getYouTubeVideoUrl(selectedRealSong);
  const spotifyUrl      = getSpotifyUrl(selectedRealSong);
  const ytEmbedUrl      = getYouTubeEmbedUrl(selectedRealSong); // null if no valid ID

  const isDraftedSequence = draftedTracks.some((t) => t.song.id === selectedRealSong.id);
  const currentTrackIndex = draftedTracks.findIndex((t) => t.song.id === selectedRealSong.id);

  const handleToggleSynth = () => {
    if (isSynthPlaying) {
      stopSongPreview();
      setIsSynthPlaying(false);
    } else {
      playSongPreview(selectedRealSong.audioSynthFreq, 6, audioEnabled);
      setIsSynthPlaying(true);
    }
  };

  const handleSourceSwitch = (pref: typeof audioSourcePreference) => {
    stopSongPreview();
    setIsSynthPlaying(false);
    setAudioSourcePreference(pref);
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        ref={modalRef}
        {...modalProps}
        className="relative w-full max-w-2xl bg-gray-900 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header Gradient Banner */}
        <div
          className={`relative p-6 bg-gradient-to-r ${selectedRealSong.gradient} text-white flex flex-col gap-1`}
        >
          <button
            onClick={() => {
              stopSongPreview();
              setIsSynthPlaying(false);
              closeRealSongPlayer();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/70 text-gray-200 hover:text-white transition-colors cursor-pointer"
            aria-label="Close player"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest bg-black/50 border border-white/20 rounded-full text-purple-200 backdrop-blur-sm">
              {selectedRealSong.typeTag}
            </span>
            {isDraftedSequence && (
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest bg-purple-950/80 border border-purple-400/40 rounded-full text-pink-300">
                Track #{currentTrackIndex + 1} in Draft
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight line-clamp-1">
            {selectedRealSong.title}
          </h2>
          <p className="text-base font-semibold text-purple-200 opacity-90 line-clamp-1">
            {selectedRealSong.rawArtistString}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-300 mt-2 font-medium">
            <span>{selectedRealSong.album} ({selectedRealSong.year})</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-cyan-300 font-bold">
              <Disc className="w-3.5 h-3.5" />
              {selectedRealSong.bpm} BPM
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-pink-300 font-bold">
              <Flame className="w-3.5 h-3.5" />
              {selectedRealSong.energy}% Energy
            </span>
          </div>
        </div>

        {/* Source Selector Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-950/90 p-2 gap-2">
          <button
            onClick={() => handleSourceSwitch('youtube')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              audioSourcePreference === 'youtube'
                ? 'bg-red-600/90 text-white shadow-lg shadow-red-950/50'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
            aria-label="Preview via YouTube"
          >
            <Music2 className="w-4 h-4" />
            <span>YouTube</span>
          </button>

          <button
            onClick={() => handleSourceSwitch('spotify')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              audioSourcePreference === 'spotify'
                ? 'bg-emerald-600/90 text-white shadow-lg shadow-emerald-950/50'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
            aria-label="Preview via Spotify"
          >
            <Radio className="w-4 h-4" />
            <span>Spotify</span>
          </button>

          <button
            onClick={() => handleSourceSwitch('synth')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              audioSourcePreference === 'synth'
                ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-950/50'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
            aria-label="Preview via Synth tone"
          >
            <Disc className="w-4 h-4" />
            <span>Synth Tone</span>
          </button>
        </div>

        {/* Active Player View Area */}
        <div className="p-6 bg-gray-900 flex flex-col items-center justify-center gap-4">
          {audioSourcePreference === 'youtube' && (
            <div className="w-full flex flex-col gap-4 items-center">
              {ytEmbedUrl ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden border border-gray-800 shadow-2xl bg-black relative">
                  <iframe
                    key={`yt-modal-${selectedRealSong.id}`}
                    src={ytEmbedUrl}
                    title={`${selectedRealSong.title} – YouTube Preview`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="w-full py-10 px-4 rounded-xl bg-gray-950 border border-gray-800 text-center flex flex-col items-center gap-3">
                  <Music2 className="w-10 h-10 text-red-400" />
                  <div>
                    <h4 className="text-sm font-extrabold text-white">No YouTube embed available</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      This track doesn&apos;t have an in-app embed yet. Open it on YouTube below.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                <a
                  href={ytMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Music2 className="w-4 h-4" />
                  <span>Open in YouTube Music</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <a
                  href={ytVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs flex items-center gap-2 transition-all border border-gray-700 cursor-pointer"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>
          )}

          {audioSourcePreference === 'spotify' && (
            <div className="w-full flex flex-col gap-4 items-center">
              {spotifyEmbedUrl ? (
                <div className="w-full h-[152px] rounded-xl overflow-hidden border border-gray-800 shadow-xl bg-black">
                  <iframe
                    key={`sp-modal-${selectedRealSong.id}`}
                    src={spotifyEmbedUrl}
                    width="100%"
                    height="152"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="border-0"
                    title={`${selectedRealSong.title} – Spotify Preview`}
                  />
                </div>
              ) : (
                <div className="w-full py-8 px-4 rounded-xl bg-gray-950 border border-gray-800 text-center flex flex-col items-center gap-3">
                  <Radio className="w-10 h-10 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-extrabold text-white">No Spotify embed available</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-md">
                      No in-app Spotify player for &quot;{selectedRealSong.title}&quot; — open in the Spotify app below.
                    </p>
                  </div>
                </div>
              )}

              <a
                href={spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                <Radio className="w-4 h-4" />
                <span>Open on Spotify</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>
          )}

          {audioSourcePreference === 'synth' && (
            <div className="w-full py-8 px-4 rounded-xl bg-purple-950/30 border border-purple-900/50 flex flex-col items-center justify-center gap-4 text-center">
              <div className="p-4 rounded-full bg-purple-900/50 border border-purple-500/50 text-purple-300">
                <Disc className={`w-10 h-10 ${isSynthPlaying ? 'animate-spin' : ''}`} />
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-white">Synthesized Frequency Tone</h4>
                <p className="text-xs text-gray-400 mt-1">
                  Base: {selectedRealSong.audioSynthFreq} Hz • Pure oscillator audio
                </p>
              </div>

              <button
                onClick={handleToggleSynth}
                className={`py-2.5 px-6 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  isSynthPlaying
                    ? 'bg-pink-600 hover:bg-pink-500 text-white animate-pulse'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/50'
                }`}
                aria-label={isSynthPlaying ? 'Stop synth tone' : 'Play synth tone'}
              >
                {isSynthPlaying ? (
                  <>
                    <Square className="w-4 h-4" />
                    <span>Stop Synth</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Play Synth</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation for Draft Sequences */}
        {isDraftedSequence && draftedTracks.length > 1 && (
          <div className="p-4 bg-gray-950 border-t border-gray-800/80 flex items-center justify-between">
            <button
              onClick={() => {
                stopSongPreview();
                setIsSynthPlaying(false);
                playPrevDraftedTrack();
              }}
              disabled={currentTrackIndex <= 0}
              className="py-1.5 px-3 rounded-lg bg-gray-900 hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none border border-gray-800 text-xs font-bold text-gray-300 flex items-center gap-1 transition-colors cursor-pointer"
              aria-label="Previous track in draft"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-bold text-gray-400">
              Track {currentTrackIndex + 1} of {draftedTracks.length}
            </span>

            <button
              onClick={() => {
                stopSongPreview();
                setIsSynthPlaying(false);
                playNextDraftedTrack();
              }}
              disabled={currentTrackIndex >= draftedTracks.length - 1}
              className="py-1.5 px-3 rounded-lg bg-gray-900 hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none border border-gray-800 text-xs font-bold text-gray-300 flex items-center gap-1 transition-colors cursor-pointer"
              aria-label="Next track in draft"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
