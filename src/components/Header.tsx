'use client';

import React, { useState } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sliders,
  Disc3,
  Swords,
  Trophy,
  Library,
  UserRound,
  Settings2,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isCompleted = currentRoundIndex >= slots.length;
  const activeSlot = slots[currentRoundIndex];
  const formatLabel =
    gameMode === 'draft'
      ? 'Draft Mode'
      : gameMode === 'ep'
      ? 'EP Builder'
      : gameMode === 'budget'
      ? '$15 Budget'
      : 'Album Builder';
  const progressLabel = gameMode === 'draft' ? 'Round' : `${gameMode === 'ep' ? 'EP' : 'Album'} Track`;
  const completionLabel =
    gameMode === 'draft' ? 'Draft Complete' : `${gameMode === 'ep' ? 'EP' : 'Album'} Ready for Review`;
  const saveLabel = sessionId ? 'Session saved · resume ready' : 'Saved locally · resume ready';

  return (
    <>
      <header className="w-full max-w-6xl mx-auto py-2.5 px-3.5 sm:px-6 mb-4 sm:mb-6 border border-gray-800/80 bg-gray-950/85 backdrop-blur-xl sticky top-2 sm:top-3 z-40 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/40">
        {/* MOBILE TOP BAR (screens < lg) */}
        <div className="flex lg:hidden items-center justify-between gap-2 h-11 sm:h-12">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-md shadow-purple-900/30 border border-purple-300/30">
              <Disc3 className="w-4 h-4 text-white animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-[0.14em] bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-300 bg-clip-text text-transparent">
                TRACKDRAFT
              </h1>
            </div>
          </div>

          {/* Center: Current Round Pill */}
          <div className="px-2.5 py-1 rounded-full bg-purple-950/70 border border-purple-800/60 text-[11px] font-black text-purple-200 flex items-center gap-1.5 truncate max-w-[150px]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="truncate">
              {isCompleted ? 'Complete' : `R${currentRoundIndex + 1}/${slots.length}: ${activeSlot?.name}`}
            </span>
          </div>

          {/* Right: Quick Audio + Mobile Sheet Menu Toggle */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleAudio}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-900 border border-gray-800 text-gray-300 active:text-purple-300 transition-colors cursor-pointer"
              title={audioEnabled ? 'Mute Audio' : 'Enable Audio'}
              aria-label={audioEnabled ? 'Mute Sound' : 'Unmute Sound'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
            </button>

            <button
              onClick={() => {
                playHoverSound(audioEnabled);
                setIsMobileMenuOpen(true);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-950 to-pink-950 border border-purple-700/60 text-pink-300 active:scale-95 transition-all cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Open Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DESKTOP TOP BAR (screens >= lg) */}
        <div className="hidden lg:flex lg:justify-between lg:items-center gap-4">
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

          <div className="flex items-center gap-2 flex-wrap justify-end max-w-full">
            <nav aria-label="Workspace" className="flex items-center gap-2">
              <button
                onClick={onOpenSetup}
                onMouseEnter={() => playHoverSound(audioEnabled)}
                className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Open session setup"
              >
                <Settings2 className="w-3.5 h-3.5 text-cyan-300" />
                <span>Setup</span>
              </button>
              <button
                onClick={onOpenLibrary}
                onMouseEnter={() => playHoverSound(audioEnabled)}
                className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Open track library"
              >
                <Library className="w-3.5 h-3.5 text-purple-300" />
                <span>Library</span>
              </button>
              <button
                onClick={onOpenProfile}
                onMouseEnter={() => playHoverSound(audioEnabled)}
                className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Open curator profile"
              >
                <UserRound className="w-3.5 h-3.5 text-pink-300" />
                <span>Profile</span>
              </button>
            </nav>

            <span className="h-7 w-px bg-gray-800" aria-hidden="true" />

            <div aria-label="Session status" className="flex items-center gap-2">
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

            <span className="h-7 w-px bg-gray-800" aria-hidden="true" />

            <div aria-label="Session actions" className="flex items-center gap-2">
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

              {/* Sound Toggle */}
              <button
                onClick={toggleAudio}
                title={audioEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
                className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white transition cursor-pointer"
              >
                {audioEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE SETTINGS DRAWER / SHEET */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md animate-fade-in lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-full bg-gray-950 border-t border-purple-900/40 rounded-t-3xl p-5 pb-safe shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Disc3 className="w-5 h-5 text-purple-400 animate-spin-slow" />
                <h3 className="text-lg font-black text-white">TrackDraft Menu</h3>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full bg-gray-900 text-gray-400 hover:text-white"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Options Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenModeSelector();
                }}
                className="p-3.5 rounded-2xl bg-purple-950/60 border border-purple-700/60 text-left flex flex-col gap-1 active:scale-98"
              >
                <Sliders className="w-4 h-4 text-purple-300" />
                <span className="text-xs font-black text-white">{formatLabel}</span>
                <span className="text-[10px] text-purple-300">Change Mode & Era</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenFriendsModal();
                }}
                className="p-3.5 rounded-2xl bg-pink-950/60 border border-pink-700/60 text-left flex flex-col gap-1 active:scale-98"
              >
                <Swords className="w-4 h-4 text-pink-300" />
                <span className="text-xs font-black text-white">1v1 Battle</span>
                <span className="text-[10px] text-pink-300">{draftSeed ? `Seed: ${draftSeed}` : 'Challenge Friends'}</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSetup();
                }}
                className="p-3.5 rounded-2xl bg-gray-900 border border-gray-800 text-left flex flex-col gap-1 active:scale-98"
              >
                <Settings2 className="w-4 h-4 text-cyan-300" />
                <span className="text-xs font-black text-white">Setup</span>
                <span className="text-[10px] text-gray-400">Taste Preferences</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenLibrary();
                }}
                className="p-3.5 rounded-2xl bg-gray-900 border border-gray-800 text-left flex flex-col gap-1 active:scale-98"
              >
                <Library className="w-4 h-4 text-purple-300" />
                <span className="text-xs font-black text-white">Library</span>
                <span className="text-[10px] text-gray-400">Search Catalog</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenProfile();
                }}
                className="p-3.5 rounded-2xl bg-gray-900 border border-gray-800 text-left flex flex-col gap-1 active:scale-98"
              >
                <UserRound className="w-4 h-4 text-pink-300" />
                <span className="text-xs font-black text-white">Profile</span>
                <span className="text-[10px] text-gray-400">Curator Stats</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onScrollToLeaderboard();
                }}
                className="p-3.5 rounded-2xl bg-gray-900 border border-gray-800 text-left flex flex-col gap-1 active:scale-98"
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-black text-white">Leaderboard</span>
                <span className="text-[10px] text-gray-400">High Scores</span>
              </button>
            </div>

            {/* Restart Draft Danger Button */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsResetConfirmOpen(true);
              }}
              className="w-full py-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 font-extrabold text-xs flex items-center justify-center gap-2 active:scale-98 cursor-pointer mt-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart {formatLabel}</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation modal for reset */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title={`Restart ${formatLabel}?`}
        message="Are you sure you want to discard this session and start over? All drafted tracks and streak progress for this round will be lost."
        confirmText="Yes, Restart"
        cancelText="Cancel"
        onConfirm={() => {
          startNewDraft();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </>
  );
};
