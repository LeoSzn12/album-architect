'use client';

import React, { useState } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { Volume2, VolumeX, RotateCcw, Sliders, Disc3, Swords, Trophy, Library, UserRound, Settings2 } from 'lucide-react';
import { playHoverSound } from '@/lib/audioEngine';
import { ConfirmModal } from './ConfirmModal';

interface HeaderProps {
  onOpenModeSelector: () => void;
  onToggleTracklist: () => void;
  onOpenFriendsModal: () => void;
  onScrollToLeaderboard: () => void;
  onOpenSetup: () => void;
  onOpenLibrary: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenModeSelector,
  onToggleTracklist,
  onOpenFriendsModal,
  onScrollToLeaderboard,
  onOpenSetup,
  onOpenLibrary,
  onOpenProfile,
}) => {
  const {
    gameMode,
    difficulty,
    draftSeed,
    currentRoundIndex,
    slots,
    audioEnabled,
    toggleAudio,
    startNewDraft,
    draftedTracks,
    sessionId,
  } = useDraftStore();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const isCompleted = currentRoundIndex >= slots.length;
  const activeSlot = slots[currentRoundIndex];
  const formatLabel = gameMode === 'draft' ? 'Draft Mode' : gameMode === 'ep' ? 'EP Builder' : 'Album Builder';
  const progressLabel = gameMode === 'draft' ? 'Round' : `${gameMode === 'ep' ? 'EP' : 'Album'} Track`;
  const completionLabel = gameMode === 'draft' ? 'Draft Complete' : `${gameMode === 'ep' ? 'EP' : 'Album'} Ready for Review`;
  const saveLabel = sessionId ? 'Session saved · resume ready' : 'Saved locally · resume ready';

  return (
    <>
      <header className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 py-3 px-4 sm:px-6 mb-8 border border-gray-800/80 bg-gray-950/80 backdrop-blur-md sticky top-3 z-40 rounded-2xl shadow-2xl shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-900/30 border border-purple-300/30">
            <Disc3 className="w-6 h-6 text-white animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-[0.16em] bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
              TRACKDRAFT
            </h1>
            <p className="text-[11px] text-gray-400 font-medium tracking-wide">
              Fantasy Music Curation & A&R Draft
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center lg:justify-end max-w-full">
          <nav aria-label="Workspace" className="flex items-center gap-2">
          <button onClick={onOpenSetup} onMouseEnter={() => playHoverSound(audioEnabled)} className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer" title="Open session setup">
            <Settings2 className="w-3.5 h-3.5 text-cyan-300" /><span className="hidden md:inline">Setup</span>
          </button>
          <button onClick={onOpenLibrary} onMouseEnter={() => playHoverSound(audioEnabled)} className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer" title="Open track library">
            <Library className="w-3.5 h-3.5 text-purple-300" /><span className="hidden md:inline">Library</span>
          </button>
          <button onClick={onOpenProfile} onMouseEnter={() => playHoverSound(audioEnabled)} className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer" title="Open curator profile">
            <UserRound className="w-3.5 h-3.5 text-pink-300" /><span className="hidden md:inline">Profile</span>
          </button>
          </nav>

          <span className="hidden lg:block h-7 w-px bg-gray-800" aria-hidden="true" />

          <div aria-label="Session status" className="flex items-center gap-2 flex-wrap justify-center">
          {/* Round Progress Badge */}
          <div className="px-3 py-1.5 rounded-lg bg-gray-900/90 border border-gray-800 flex items-center gap-2 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            <span className="text-gray-300">
              {isCompleted ? (
                <span className="text-emerald-400 font-bold">{completionLabel}</span>
              ) : (
                <>
                  {progressLabel} <span className="text-purple-400 font-bold">{currentRoundIndex + 1}</span> / {slots.length}:{' '}
                  <span className="text-gray-200">{activeSlot?.name}</span>
                </>
              )}
            </span>
          </div>

          {/* Game Mode Pill */}
          <button
            onClick={() => {
              playHoverSound(audioEnabled);
              onOpenModeSelector();
            }}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 text-purple-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>
              {formatLabel} ({slots.length})
              {difficulty !== 'standard' && ` • ${difficulty.toUpperCase()}`}
            </span>
          </button>

          {gameMode !== 'draft' && draftedTracks.length > 0 && !isCompleted && (
            <span className="px-3 py-1.5 rounded-lg border border-emerald-800/70 bg-emerald-950/30 text-emerald-300 text-xs font-bold" title="Return later to resume this builder">
              {saveLabel}
            </span>
          )}
          </div>

          <span className="hidden lg:block h-7 w-px bg-gray-800" aria-hidden="true" />

          <div aria-label="Session actions" className="flex items-center gap-2 flex-wrap justify-center">

          {/* Live Tracklist Counter */}
          <button
            onClick={() => {
              playHoverSound(audioEnabled);
              onToggleTracklist();
            }}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer relative"
          >
            <Disc3 className="w-3.5 h-3.5 text-pink-400" />
            <span>Tracks: {draftedTracks.length}</span>
            {draftedTracks.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full border border-gray-950" />
            )}
          </button>

          {/* 1v1 Play Against Friends Button */}
          <button
            onClick={() => {
              playHoverSound(audioEnabled);
              onOpenFriendsModal();
            }}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
              draftSeed
                ? 'bg-gradient-to-r from-amber-600 to-purple-600 text-white border-amber-400/80 animate-pulse'
                : 'bg-gradient-to-r from-pink-950/80 to-purple-950/80 hover:from-pink-900 hover:to-purple-900 border-pink-700/60 text-pink-200'
            }`}
            title="Play 1v1 Against Friends with matched seeds"
          >
            <Swords className="w-3.5 h-3.5 text-pink-400" />
            <span>{draftSeed ? `1v1: ${draftSeed}` : '1v1 Friends'}</span>
          </button>

          {/* Leaderboard Scroll Button */}
          <button
            onClick={() => {
              playHoverSound(audioEnabled);
              onScrollToLeaderboard();
            }}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-amber-300 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer"
            title="View Executive Leaderboard High Scores"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Leaderboard</span>
          </button>

          {/* Reset Draft */}
          <button
            onClick={() => {
              playHoverSound(audioEnabled);
              setIsResetConfirmOpen(true);
            }}
            title={`Restart ${formatLabel}`}
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={toggleAudio}
            title={audioEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              audioEnabled
                ? 'bg-purple-950/40 border-purple-800/80 text-purple-400 hover:bg-purple-900/60'
                : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          </div>
        </div>
      </header>

      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title={`Restart ${formatLabel} Session?`}
        message={`Your current ${formatLabel.toLowerCase()} tracklist will be reset. This action cannot be undone.`}
        confirmText={`Restart ${formatLabel}`}
        isDestructive={true}
        onConfirm={() => {
          setIsResetConfirmOpen(false);
          startNewDraft();
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </>
  );
};
