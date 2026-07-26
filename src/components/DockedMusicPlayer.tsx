'use client';

import React, { useState } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import {
  getYouTubeEmbedUrl,
  getSpotifyEmbedUrl,
  getYouTubeMusicUrl,
  getSpotifyUrl,
} from '@/lib/musicBridge';
import { playSongPreview, stopSongPreview } from '@/lib/audioEngine';
import {
  Play,
  Square,
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Music2,
  Radio,
  Disc,
  ExternalLink,
  Volume2,
} from 'lucide-react';

export const DockedMusicPlayer: React.FC = () => {
  const {
    selectedRealSong,
    isPlayerModalOpen,
    closeRealSongPlayer,
    audioSourcePreference,
    setAudioSourcePreference,
    openRealSongPlayer,
    draftedTracks,
    playNextDraftedTrack,
    playPrevDraftedTrack,
    audioEnabled,
  } = useDraftStore();

  const [isSynthPlaying, setIsSynthPlaying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!selectedRealSong || isPlayerModalOpen) return null;

  const ytEmbedUrl = getYouTubeEmbedUrl(selectedRealSong);
  const spotifyEmbedUrl = getSpotifyEmbedUrl(selectedRealSong);
  const ytMusicUrl = getYouTubeMusicUrl(selectedRealSong);
  const spotifyUrl = getSpotifyUrl(selectedRealSong);

  const isDraftedSequence = draftedTracks.some(
    (t) => t.song.id === selectedRealSong.id
  );
  const currentTrackIndex = draftedTracks.findIndex(
    (t) => t.song.id === selectedRealSong.id
  );

  const handleToggleSynth = () => {
    if (isSynthPlaying) {
      stopSongPreview();
      setIsSynthPlaying(false);
    } else {
      playSongPreview(selectedRealSong.audioSynthFreq, 8, audioEnabled);
      setIsSynthPlaying(true);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-4 pointer-events-none flex justify-center animate-slide-up">
      <div className="w-full max-w-5xl bg-gray-950/95 border border-purple-500/40 rounded-2xl shadow-2xl backdrop-blur-xl pointer-events-auto overflow-hidden flex flex-col transition-all">
        {/* Top Control Bar */}
        <div className="p-3 sm:p-4 flex items-center justify-between gap-4 border-b border-gray-800/80 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950">
          {/* Song Info & Artwork */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedRealSong.gradient} p-0.5 shadow-lg flex-shrink-0 flex items-center justify-center`}
            >
              <Disc className="w-6 h-6 text-white animate-spin-slow" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 px-2 py-0.5 bg-purple-950 border border-purple-800 rounded">
                  {selectedRealSong.typeTag}
                </span>
                {isDraftedSequence && (
                  <span className="text-[10px] font-bold text-pink-300">
                    Track {currentTrackIndex + 1}/{draftedTracks.length}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-extrabold text-white truncate group-hover:text-purple-300">
                {selectedRealSong.title}
              </h4>
              <p className="text-xs text-gray-400 truncate">
                {selectedRealSong.rawArtistString} • {selectedRealSong.bpm} BPM
              </p>
            </div>
          </div>

          {/* In-App Source Switcher Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800 text-xs font-bold">
            <button
              onClick={() => setAudioSourcePreference('youtube')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                audioSourcePreference === 'youtube'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Music2 className="w-3.5 h-3.5" />
              <span>YouTube</span>
            </button>
            <button
              onClick={() => setAudioSourcePreference('spotify')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                audioSourcePreference === 'spotify'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Spotify</span>
            </button>
            <button
              onClick={() => setAudioSourcePreference('synth')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                audioSourcePreference === 'synth'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Synth</span>
            </button>
          </div>

          {/* Playback Controls & Expand Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isDraftedSequence && draftedTracks.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    stopSongPreview();
                    playPrevDraftedTrack();
                  }}
                  disabled={currentTrackIndex <= 0}
                  className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 disabled:opacity-30 cursor-pointer"
                  title="Previous Track"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    stopSongPreview();
                    playNextDraftedTrack();
                  }}
                  disabled={currentTrackIndex >= draftedTracks.length - 1}
                  className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 disabled:opacity-30 cursor-pointer"
                  title="Next Track"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 transition cursor-pointer"
              title={isCollapsed ? 'Expand Player' : 'Collapse Player'}
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => openRealSongPlayer(selectedRealSong)}
              className="p-2 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-200 transition cursor-pointer"
              title="Full Screen Player Modal"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                stopSongPreview();
                closeRealSongPlayer();
              }}
              className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition cursor-pointer"
              title="Close Audio Dock"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded Player Body (Renders directly on the website) */}
        {!isCollapsed && (
          <div className="p-3 bg-black flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-900">
            {audioSourcePreference === 'youtube' && (
              <div className="w-full flex items-center justify-between gap-4">
                <div className="w-full md:w-80 h-24 rounded-lg overflow-hidden border border-gray-800 bg-black flex-shrink-0">
                  <iframe
                    src={ytEmbedUrl}
                    title="In-App YouTube Audio Player"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
                <div className="hidden sm:flex flex-col gap-1 text-xs text-gray-400 flex-1">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Music2 className="w-4 h-4 text-red-500" />
                    In-App YouTube Audio Player Active
                  </span>
                  <p>Streaming full audio directly on Album Architect site.</p>
                  <a
                    href={ytMusicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:underline flex items-center gap-1 mt-1 font-semibold"
                  >
                    <span>Open in YouTube Music app</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {audioSourcePreference === 'spotify' && (
              <div className="w-full flex items-center justify-between gap-4">
                {spotifyEmbedUrl ? (
                  <div className="w-full md:w-96 h-[80px] rounded-lg overflow-hidden border border-gray-800 bg-black flex-shrink-0">
                    <iframe
                      src={spotifyEmbedUrl}
                      width="100%"
                      height="80"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="border-0"
                    />
                  </div>
                ) : (
                  <div className="py-2 px-4 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-300 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>In-App Spotify Bridge Active for &quot;{selectedRealSong.title}&quot;</span>
                  </div>
                )}
                <a
                  href={spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Radio className="w-4 h-4" />
                  <span>Open Spotify</span>
                </a>
              </div>
            )}

            {audioSourcePreference === 'synth' && (
              <div className="w-full flex items-center justify-between p-2 bg-purple-950/40 rounded-xl border border-purple-900/40">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleSynth}
                    className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer ${
                      isSynthPlaying
                        ? 'bg-pink-600 text-white animate-pulse'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                  >
                    {isSynthPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>{isSynthPlaying ? 'Stop Synth Tone' : 'Play Synth Tone'}</span>
                  </button>
                  <span className="text-xs text-gray-300 font-semibold">
                    {selectedRealSong.audioSynthFreq} Hz Synthetic Oscillator
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
