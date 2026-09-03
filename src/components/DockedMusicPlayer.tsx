'use client';

import React, { useEffect, useState } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { useSnippetAudio } from '@/hooks/useSnippetAudio';
import {
  getYouTubeEmbedUrl,
  getSpotifyEmbedUrl,
  getYouTubeMusicUrl,
  getSpotifyUrl,
  getAppleMusicUrl,
  getAppleMusicPreviewUrl,
  resolveBestSource,
  getAvailableSources,
} from '@/lib/musicBridge';
import { playSongPreview, stopSongPreview } from '@/lib/audioEngine';
import {
  Play,
  Pause,
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Music2,
  Radio,
  Disc,
  ExternalLink,
  Volume2,
  VolumeX,
  Minimize2,
} from 'lucide-react';

export const DockedMusicPlayer: React.FC = () => {
  const {
    selectedRealSong,
    isPlayerModalOpen,
    closeMusicPlayer,
    audioSourcePreference,
    setAudioSourcePreference,
    openRealSongPlayer,
    draftedTracks,
    currentOptions,
    audioEnabled,
  } = useDraftStore();

  const {
    song: snippetSong,
    isPlaying: isSnippetPlaying,
    currentTime,
    duration,
    progressPercent,
    volume,
    isMuted,
    toggleSong,
    seek,
    setVolume,
    toggleMute,
    stop: stopSnippet,
  } = useSnippetAudio();

  const [isSynthPlaying, setIsSynthPlaying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Active song to display: prefers currently auditioning snippet song, falls back to selectedRealSong
  const activeSong = snippetSong ?? selectedRealSong;

  useEffect(() => {
    if (!activeSong) return;
    const available = getAvailableSources(activeSong);
    if (!available.includes(audioSourcePreference)) {
      setAudioSourcePreference(resolveBestSource(activeSong, audioSourcePreference));
    }
  }, [activeSong?.id, audioSourcePreference, setAudioSourcePreference]);

  if (!activeSong || isPlayerModalOpen) return null;

  const ytEmbedUrl      = getYouTubeEmbedUrl(activeSong);
  const spotifyEmbedUrl = getSpotifyEmbedUrl(activeSong);
  const ytMusicUrl      = getYouTubeMusicUrl(activeSong);
  const spotifyUrl      = getSpotifyUrl(activeSong);
  const appleMusicUrl   = getAppleMusicUrl(activeSong);

  const isDraftedSequence = draftedTracks.some((t) => t.song.id === activeSong.id);
  const currentTrackIndex = draftedTracks.findIndex((t) => t.song.id === activeSong.id);

  // Candidate cycle helper for current round
  const currentCandidateIndex = currentOptions.findIndex((s) => s.id === activeSong.id);

  const handleNextCandidate = () => {
    if (currentOptions.length === 0) return;
    const nextIdx = (currentCandidateIndex + 1) % currentOptions.length;
    toggleSong(currentOptions[nextIdx]);
  };

  const handlePrevCandidate = () => {
    if (currentOptions.length === 0) return;
    const prevIdx = (currentCandidateIndex - 1 + currentOptions.length) % currentOptions.length;
    toggleSong(currentOptions[prevIdx]);
  };

  const handleToggleSynth = () => {
    if (isSynthPlaying) {
      stopSongPreview();
      setIsSynthPlaying(false);
    } else {
      playSongPreview(activeSong.audioSynthFreq, 8, audioEnabled);
      setIsSynthPlaying(true);
    }
  };

  const handleSourceSwitch = (pref: typeof audioSourcePreference) => {
    stopSongPreview();
    setIsSynthPlaying(false);
    setAudioSourcePreference(pref);
  };

  const handleClose = () => {
    stopSongPreview();
    stopSnippet();
    setIsSynthPlaying(false);
    closeMusicPlayer();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-4 pointer-events-none flex justify-center animate-slide-up">
      <div className="w-full max-w-4xl bg-slate-950/90 border border-white/[0.12] rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-2xl pointer-events-auto overflow-hidden flex flex-col transition-all">
        {/* Top Control Bar */}
        <div className="p-2.5 sm:p-4 flex items-center justify-between gap-3 border-b border-white/[0.08] bg-slate-950/80">
          {/* Song Info & Artwork */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-lg border border-white/10 flex-shrink-0 bg-slate-900">
              {activeSong.artwork ? (
                <img
                  src={activeSong.artwork}
                  alt={activeSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${activeSong.gradient} flex items-center justify-center`}>
                  <Disc className="w-6 h-6 text-white" />
                </div>
              )}

              {isSnippetPlaying && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-pink-400 rounded-full animate-pulse h-2.5" />
                    <span className="w-0.5 bg-cyan-400 rounded-full animate-pulse h-3.5" />
                    <span className="w-0.5 bg-pink-400 rounded-full animate-pulse h-1.5" />
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-purple-300 px-1.5 py-0.5 bg-purple-950 border border-purple-800 rounded truncate max-w-[120px]">
                  {activeSong.typeTag}
                </span>
                {isDraftedSequence ? (
                  <span className="text-[9.5px] font-bold text-pink-300 hidden sm:inline">
                    Drafted Track #{currentTrackIndex + 1}
                  </span>
                ) : currentCandidateIndex !== -1 ? (
                  <span className="text-[9.5px] font-bold text-cyan-300 hidden sm:inline">
                    Candidate #{currentCandidateIndex + 1}
                  </span>
                ) : null}
              </div>
              <h4 className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
                {activeSong.title}
              </h4>
              <p className="text-[11px] text-slate-400 truncate">
                {activeSong.rawArtistString} • {activeSong.bpm} BPM
              </p>
            </div>
          </div>

          {/* Source Selector Tabs (Desktop only) */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/[0.08] text-xs font-bold">
            <button
              onClick={() => handleSourceSwitch('apple')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                audioSourcePreference === 'apple'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Official 30s audio snippet"
            >
              <Music2 className="w-3.5 h-3.5" />
              <span>30s Snippet</span>
            </button>
            <button
              onClick={() => handleSourceSwitch('spotify')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                audioSourcePreference === 'spotify'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Spotify embed"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Spotify</span>
            </button>
            <button
              onClick={() => handleSourceSwitch('youtube')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                audioSourcePreference === 'youtube'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="YouTube link & video"
            >
              <Music2 className="w-3.5 h-3.5" />
              <span>YouTube</span>
            </button>
          </div>

          {/* Quick Playback & Cycle Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {currentOptions.length > 1 && (
              <>
                <button
                  onClick={handlePrevCandidate}
                  className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer border border-white/[0.08] flex items-center justify-center active:scale-95"
                  title="Audition previous candidate"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextCandidate}
                  className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer border border-white/[0.08] flex items-center justify-center active:scale-95"
                  title="Audition next candidate"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Snippet Play/Pause Button */}
            <button
              onClick={() => toggleSong(activeSong)}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-950/50 hover:brightness-110 cursor-pointer transition-all flex items-center justify-center active:scale-95"
              title={isSnippetPlaying ? 'Pause snippet' : 'Play 30s snippet'}
            >
              {isSnippetPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Collapse/Expand Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border border-white/[0.08] flex items-center justify-center active:scale-95"
              title={isCollapsed ? 'Expand player' : 'Collapse player'}
            >
              {isCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>

            {/* Open Full Screen Modal */}
            <button
              onClick={() => openRealSongPlayer(activeSong)}
              className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border border-white/[0.08] flex items-center justify-center active:scale-95 hidden sm:flex"
              title="Open full player modal"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Close Dock */}
            <button
              onClick={handleClose}
              className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-slate-900/90 hover:bg-red-950/80 hover:text-red-300 text-slate-400 transition cursor-pointer border border-white/[0.08] flex items-center justify-center active:scale-95"
              title="Close music player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Body: Interactive Scrubber & Controls */}
        {!isCollapsed && (
          <div className="p-3 sm:p-4 bg-slate-950/90 flex flex-col gap-3">
            {/* Scrubber & Time Display */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-slate-400 tabular-nums w-8 text-right">
                {Math.floor(currentTime)}s
              </span>
              <div className="flex-1 relative flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || 30}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums w-8">
                {Math.floor(duration || 30)}s
              </span>

              {/* Volume & Mute */}
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800">
                <button
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-white cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>

            {/* Provider External Links Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Stream full track:</span>
                <a
                  href={appleMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                >
                  <span>Apple Music</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-600">•</span>
                <a
                  href={spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                >
                  <span>Spotify</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-600">•</span>
                <a
                  href={ytMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                >
                  <span>YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Synth Fallback Option */}
              <button
                onClick={handleToggleSynth}
                className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                <Disc className="w-3 h-3" />
                <span>{isSynthPlaying ? 'Stop Synth' : 'BPM Synth Tone'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
