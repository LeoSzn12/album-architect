'use client';

import React, { useEffect, useState } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import {
  getYouTubeMusicUrl,
  getYouTubeVideoUrl,
  getSpotifyUrl,
  getAppleMusicUrl,
  getAppleMusicPreviewUrl,
  getYouTubeEmbedUrl,
  getSpotifyEmbedUrl,
  resolveBestSource,
  getAvailableSources,
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
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';

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

  const spotify = useSpotifyPlayer();

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

  useEffect(() => {
    // Auto-fallback: if the user's preferred source isn't available for this
    // track, silently switch to the best source that IS available.
    if (!selectedRealSong) return;
    const available = getAvailableSources(selectedRealSong);
    if (selectedRealSong && !available.includes(audioSourcePreference)) {
      setAudioSourcePreference(resolveBestSource(selectedRealSong, audioSourcePreference));
    }
  }, [selectedRealSong?.id, audioSourcePreference, setAudioSourcePreference]);

  if (!isPlayerModalOpen || !selectedRealSong) return null;

  const spotifyEmbedUrl = getSpotifyEmbedUrl(selectedRealSong); // null if no valid ID
  const ytMusicUrl      = getYouTubeMusicUrl(selectedRealSong);
  const ytVideoUrl      = getYouTubeVideoUrl(selectedRealSong);
  const spotifyUrl      = getSpotifyUrl(selectedRealSong);
  const ytEmbedUrl      = getYouTubeEmbedUrl(selectedRealSong); // null if no valid ID
  const appleMusicUrl   = getAppleMusicUrl(selectedRealSong);
  const applePreviewUrl = getAppleMusicPreviewUrl(selectedRealSong); // null if no preview

  const isDraftedSequence = draftedTracks.some((t) => t.song.id === selectedRealSong.id);
  const currentTrackIndex = draftedTracks.findIndex((t) => t.song.id === selectedRealSong.id);
  // Local snapshot so TS keeps narrowing inside nested JSX closures.
  const spState = spotify.currentState;

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

  const handlePlayFullTrack = async () => {
    spotify.connect();
    if (selectedRealSong.spotifyId) {
      // Wait a beat for the device to register, then start playback.
      await new Promise((r) => setTimeout(r, 250));
      void spotify.playTrack(selectedRealSong.spotifyId);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        ref={modalRef}
        {...modalProps}
        className="relative w-full max-w-2xl bg-[#0e0e12]/95 border border-white/[0.08] backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header Smoked Glass Banner */}
        <div className="relative p-6 bg-gradient-to-b from-[#181822] to-[#0e0e12] border-b border-white/[0.08] text-white flex flex-col gap-1">
          <button
            onClick={() => {
              stopSongPreview();
              setIsSynthPlaying(false);
              closeRealSongPlayer();
            }}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-zinc-300 hover:text-white transition cursor-pointer border border-white/[0.08]"
            aria-label="Close player"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-white/[0.06] border border-white/[0.08] rounded-full text-zinc-300">
              {selectedRealSong.typeTag}
            </span>
            {isDraftedSequence && (
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-rose-500/10 border border-rose-500/25 rounded-full text-rose-300">
                Track #{currentTrackIndex + 1} in Draft
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight line-clamp-1">
            {selectedRealSong.title}
          </h2>
          <p className="text-base font-semibold text-zinc-300 line-clamp-1">
            {selectedRealSong.rawArtistString}
          </p>

          <div className="flex items-center gap-3 text-xs text-zinc-400 mt-2 font-medium">
            <span>{selectedRealSong.album} ({selectedRealSong.year})</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-zinc-200 font-bold">
              <Disc className="w-3.5 h-3.5 text-zinc-400" />
              {selectedRealSong.bpm} BPM
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              <Flame className="w-3.5 h-3.5" />
              {selectedRealSong.energy}% Energy
            </span>
          </div>
        </div>

        {/* Source Selector Tabs */}
        <div className="flex border-b border-white/[0.08] bg-[#09090c] p-1.5 gap-1.5">
          <button
            onClick={() => handleSourceSwitch('youtube')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
              audioSourcePreference === 'youtube'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
            aria-label="Preview via YouTube"
          >
            <Music2 className="w-4 h-4 text-red-500" />
            <span>YouTube</span>
          </button>

          <button
            onClick={() => handleSourceSwitch('spotify')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
              audioSourcePreference === 'spotify'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
            aria-label="Preview via Spotify"
          >
            <Radio className="w-4 h-4 text-emerald-500" />
            <span>Spotify</span>
          </button>

          <button
            onClick={() => handleSourceSwitch('apple')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
              audioSourcePreference === 'apple'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
            aria-label="Preview via Apple Music"
          >
            <Music2 className="w-4 h-4 text-rose-500" />
            <span>Apple Music</span>
          </button>

          <button
            onClick={() => handleSourceSwitch('synth')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
              audioSourcePreference === 'synth'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
            aria-label="Preview via Synth tone"
          >
            <Disc className="w-4 h-4 text-zinc-400" />
            <span>Synth Tone</span>
          </button>
        </div>

        {/* Active Player View Area */}
        <div className="p-6 bg-[#0e0e12] flex flex-col items-center justify-center gap-4">
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
                  className="py-2.5 px-5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <Music2 className="w-4 h-4 text-red-500" />
                  <span>Open in YouTube Music</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <a
                  href={ytVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-bold text-xs flex items-center gap-2 transition-all border border-white/[0.08] cursor-pointer active:scale-95"
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
                <div className="w-full h-[152px] rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl bg-black">
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
                <div className="w-full py-8 px-4 rounded-2xl bg-black/40 border border-white/[0.08] text-center flex flex-col items-center gap-3">
                  <Radio className="w-10 h-10 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-extrabold text-white">No Spotify embed available</h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-md">
                      No in-app Spotify player for &quot;{selectedRealSong.title}&quot; — open in the Spotify app below.
                    </p>
                  </div>
                </div>
              )}

              <a
                href={spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-6 rounded-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <Radio className="w-4 h-4" />
                <span>Open on Spotify</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              {/* Full Track (Premium via Web Playback SDK) */}
              <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <Radio className={`w-5 h-5 ${spotify.isReady ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
                  <h4 className="text-sm font-extrabold text-white">Full Track Playback</h4>
                </div>
                <p className="text-[11px] text-zinc-400 text-center">
                  Premium Spotify account required — plays the full song in-browser via the Spotify Web Playback SDK.
                </p>

                {!spotify.isReady && (
                  <button
                    onClick={handlePlayFullTrack}
                    disabled={spotify.status === 'loading-token' || spotify.status === 'loading-sdk' || spotify.status === 'connecting'}
                    className="py-2.5 px-6 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    aria-label="Enable full track playback"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {spotify.status === 'loading-token' || spotify.status === 'loading-sdk' || spotify.status === 'connecting'
                        ? 'Connecting Spotify…'
                        : 'Play Full Track'}
                    </span>
                  </button>
                )}

                {spotify.error && (
                  <p className="text-[11px] text-amber-300 text-center max-w-xs">{spotify.error}</p>
                )}

                {spState && (
                  <div className="w-full flex items-center justify-between gap-2 rounded-xl bg-black/60 border border-white/[0.08] px-3.5 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white">{spState.trackName ?? 'Now Playing'}</p>
                      <p className="truncate text-[10px] text-zinc-400">{spState.artistName ?? 'Spotify'}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-400 tabular-nums">
                        {Math.floor((spState.positionMs / 1000))}s / {Math.floor((spState.durationMs / 1000))}s
                      </span>
                      <button
                        onClick={() => void (spState.paused ? spotify.resume() : spotify.pause())}
                        className="p-2 rounded-full bg-white text-black hover:bg-zinc-200 cursor-pointer transition active:scale-95"
                        aria-label={spState.paused ? 'Resume full track' : 'Pause full track'}
                      >
                        {spState.paused
                          ? <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          : <Square className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {audioSourcePreference === 'apple' && (
            <div className="w-full flex flex-col gap-4 items-center">
              {applePreviewUrl ? (
                <div className="w-full max-w-md rounded-2xl overflow-hidden border border-rose-500/20 bg-rose-500/5 p-5 flex flex-col items-center gap-4">
                  <div className="p-3.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500">
                    <Music2 className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-extrabold text-white">Apple Music Preview</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Official 30–90 second clip — free, no login needed.
                    </p>
                  </div>
                  <audio
                    key={`apple-preview-${selectedRealSong.id}`}
                    src={applePreviewUrl}
                    controls
                    autoPlay
                    className="w-full"
                    preload="metadata"
                  />
                </div>
              ) : (
                <div className="w-full py-8 px-4 rounded-2xl bg-black/40 border border-white/[0.08] text-center flex flex-col items-center gap-3">
                  <Music2 className="w-10 h-10 text-rose-500" />
                  <div>
                    <h4 className="text-sm font-extrabold text-white">No Apple Music preview available</h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-md">
                      No in-app Apple Music preview for this track — open on Apple Music below.
                    </p>
                  </div>
                </div>
              )}

              <a
                href={appleMusicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-rose-950/40 cursor-pointer active:scale-95"
              >
                <Music2 className="w-4 h-4" />
                <span>Open on Apple Music</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>
          )}

          {audioSourcePreference === 'synth' && (
            <div className="w-full py-8 px-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col items-center justify-center gap-4 text-center">
              <div className="p-4 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300">
                <Disc className={`w-10 h-10 ${isSynthPlaying ? 'animate-spin' : ''}`} />
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-white">Synthesized Frequency Tone</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Base: {selectedRealSong.audioSynthFreq} Hz • Pure oscillator audio
                </p>
              </div>

              <button
                onClick={handleToggleSynth}
                className={`py-2.5 px-6 rounded-full font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                  isSynthPlaying
                    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                    : 'bg-white hover:bg-zinc-200 text-black shadow-lg'
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
          <div className="p-4 bg-[#09090c] border-t border-white/[0.08] flex items-center justify-between">
            <button
              onClick={() => {
                stopSongPreview();
                setIsSynthPlaying(false);
                playPrevDraftedTrack();
              }}
              disabled={currentTrackIndex <= 0}
              className="py-1.5 px-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:pointer-events-none border border-white/[0.08] text-xs font-bold text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
              aria-label="Previous track in draft"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-bold text-zinc-400">
              Track {currentTrackIndex + 1} of {draftedTracks.length}
            </span>

            <button
              onClick={() => {
                stopSongPreview();
                setIsSynthPlaying(false);
                playNextDraftedTrack();
              }}
              disabled={currentTrackIndex >= draftedTracks.length - 1}
              className="py-1.5 px-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:pointer-events-none border border-white/[0.08] text-xs font-bold text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
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
