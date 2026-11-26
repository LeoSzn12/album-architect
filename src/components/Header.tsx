'use client';

import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
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
  BookOpen,
  ListMusic,
} from 'lucide-react';
import { playHoverSound } from '@/lib/audioEngine';
import { ConfirmModal } from './ConfirmModal';
import { isSoloSeed } from '@/lib/soloSeed';

export type ActiveSurfaceType = 'game' | 'how-to-play' | 'setup' | 'library' | 'profile';

interface HeaderProps {
  activeSurface?: ActiveSurfaceType;
  onSelectSurface?: (surface: ActiveSurfaceType) => void;
  onOpenModeSelector: () => void;
  onToggleTracklist: () => void;
  onOpenFriendsModal: () => void;
  onScrollToLeaderboard: () => void;
  onOpenSetup: () => void;
  onOpenLibrary: () => void;
  onOpenProfile: () => void;
  onOpenHowToPlay?: () => void;
  /** Show round progress and the tracklist button (hidden on the landing screen). */
  showProgress?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeSurface = 'game',
  onSelectSurface,
  onOpenModeSelector,
  onToggleTracklist,
  onOpenFriendsModal,
  onScrollToLeaderboard,
  onOpenSetup,
  onOpenLibrary,
  onOpenProfile,
  onOpenHowToPlay,
  showProgress = true,
}) => {
  const { gameMode, draftSeed, currentRoundIndex, slots, audioEnabled, toggleAudio, startNewDraft, draftedTracks } = useDraftStore(useShallow((s) => ({ gameMode: s.gameMode, draftSeed: s.draftSeed, currentRoundIndex: s.currentRoundIndex, slots: s.slots, audioEnabled: s.audioEnabled, toggleAudio: s.toggleAudio, startNewDraft: s.startNewDraft, draftedTracks: s.draftedTracks })));

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const versusSeed = draftSeed && !isSoloSeed(draftSeed) ? draftSeed : null;
  const isCompleted = currentRoundIndex >= slots.length;
  const formatLabel =
    gameMode === 'draft'
      ? 'Draft Mode'
      : gameMode === 'ep'
      ? 'EP Builder'
      : gameMode === 'budget'
      ? '$15 Budget'
      : 'Album Builder';
  const progressLabel = gameMode === 'draft' ? 'Round' : 'Track';

  const navButton = (label: string, surface: ActiveSurfaceType, onClick: () => void) => (
    <button
      type="button"
      onClick={() => {
        playHoverSound(audioEnabled);
        onClick();
      }}
      aria-current={activeSurface === surface ? 'page' : undefined}
      className={`min-h-[40px] px-3.5 rounded-xl text-sm font-bold transition cursor-pointer whitespace-nowrap ${
        activeSurface === surface ? 'bg-white/[0.1] text-white' : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <header className="w-full max-w-6xl mx-auto mb-4 sm:mb-6 px-3 sm:px-4 py-2 border border-white/[0.08] bg-[#121216]/95 sticky top-2 sm:top-3 z-40 rounded-2xl shadow-[0_16px_40px_-10px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between gap-2 min-h-[44px]">
          {/* Brand + progress */}
          <button
            type="button"
            onClick={() => onSelectSurface?.('game')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
            aria-label="First Week home"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 shadow-md shadow-rose-950/60 flex-shrink-0">
              <Disc3 className="w-5 h-5 text-white" aria-hidden="true" />
            </span>
            <span className="text-base sm:text-lg font-black tracking-tight text-white whitespace-nowrap">First Week</span>
          </button>

          {showProgress && (
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs font-bold text-zinc-200 whitespace-nowrap">
              {isCompleted ? 'Album finished' : `${progressLabel} ${currentRoundIndex + 1} of ${slots.length}`}
            </span>
          )}

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <nav aria-label="Primary" className="hidden lg:flex items-center gap-1 mr-1">
              {navButton('Play', 'game', () => onSelectSurface?.('game'))}
              {navButton('How to Play', 'how-to-play', () => (onOpenHowToPlay ? onOpenHowToPlay() : onSelectSurface?.('how-to-play')))}
            </nav>

            {showProgress && (
              <button
                type="button"
                onClick={() => {
                  playHoverSound(audioEnabled);
                  onToggleTracklist();
                }}
                className="hidden sm:inline-flex min-h-[40px] items-center gap-1.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-100 text-sm font-bold transition cursor-pointer"
                title="Your tracklist"
              >
                <ListMusic className="w-4 h-4 text-rose-400" aria-hidden="true" />
                <span>Tracks {draftedTracks.length}/{slots.length}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                playHoverSound(audioEnabled);
                onScrollToLeaderboard();
              }}
              className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition cursor-pointer"
              title="Your top scores"
              aria-label="View Leaderboard"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
            </button>

            <button
              type="button"
              onClick={toggleAudio}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition cursor-pointer"
              title={audioEnabled ? 'Mute sound effects' : 'Turn on sound effects'}
              aria-label={audioEnabled ? 'Mute Sound' : 'Unmute Sound'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-zinc-200" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
            </button>

            <button
              type="button"
              onClick={() => {
                playHoverSound(audioEnabled);
                setIsMobileMenuOpen(true);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white transition cursor-pointer"
              title="Menu"
              aria-label="Open Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE SETTINGS DRAWER / SHEET (Apple iOS Smoked Glass) */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-black/85 animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-[#121216]/95 border-t sm:border border-white/[0.12] rounded-t-3xl sm:rounded-3xl p-5 pb-safe shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-zinc-600 rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Disc3 className="w-5 h-5 text-rose-500 animate-spin-slow" />
                <h3 className="text-lg font-bold text-white tracking-tight">Menu</h3>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full bg-white/[0.08] text-zinc-400 hover:text-white cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category 1: Navigation & Surfaces */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 block mb-2 px-1">
                Play
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onSelectSurface) onSelectSurface('game');
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 active:scale-98 cursor-pointer transition ${
                    activeSurface === 'game'
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:bg-white/[0.08]'
                  }`}
                >
                  <Disc3 className={`w-4 h-4 ${activeSurface === 'game' ? 'text-black' : 'text-rose-400'}`} />
                  <span className="text-xs font-bold">Play</span>
                  <span className={`text-[10px] ${activeSurface === 'game' ? 'text-black/70' : 'text-zinc-500'}`}>
                    {isCompleted ? 'Your results' : `Round ${currentRoundIndex + 1} of ${slots.length}`}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onOpenHowToPlay) onOpenHowToPlay();
                    else if (onSelectSurface) onSelectSurface('how-to-play');
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 active:scale-98 cursor-pointer transition ${
                    activeSurface === 'how-to-play'
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:bg-white/[0.08]'
                  }`}
                >
                  <BookOpen className={`w-4 h-4 ${activeSurface === 'how-to-play' ? 'text-black' : 'text-zinc-400'}`} />
                  <span className="text-xs font-bold">How to Play</span>
                  <span className={`text-[10px] ${activeSurface === 'how-to-play' ? 'text-black/70' : 'text-zinc-500'}`}>Rules and tips</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenSetup();
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 active:scale-98 cursor-pointer transition ${
                    activeSurface === 'setup'
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:bg-white/[0.08]'
                  }`}
                >
                  <Settings2 className={`w-4 h-4 ${activeSurface === 'setup' ? 'text-black' : 'text-zinc-400'}`} />
                  <span className="text-xs font-bold">Setup</span>
                  <span className={`text-[10px] ${activeSurface === 'setup' ? 'text-black/70' : 'text-zinc-500'}`}>Your taste</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenLibrary();
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 active:scale-98 cursor-pointer transition ${
                    activeSurface === 'library'
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:bg-white/[0.08]'
                  }`}
                >
                  <Library className={`w-4 h-4 ${activeSurface === 'library' ? 'text-black' : 'text-zinc-400'}`} />
                  <span className="text-xs font-bold">Library</span>
                  <span className={`text-[10px] ${activeSurface === 'library' ? 'text-black/70' : 'text-zinc-500'}`}>Browse songs</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 active:scale-98 cursor-pointer transition ${
                    activeSurface === 'profile'
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:bg-white/[0.08]'
                  }`}
                >
                  <UserRound className={`w-4 h-4 ${activeSurface === 'profile' ? 'text-black' : 'text-zinc-400'}`} />
                  <span className="text-xs font-bold">Profile</span>
                  <span className={`text-[10px] ${activeSurface === 'profile' ? 'text-black/70' : 'text-zinc-500'}`}>Your stats</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onScrollToLeaderboard();
                  }}
                  className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-left flex flex-col gap-1 active:scale-98 cursor-pointer hover:bg-white/[0.08]"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Top scores</span>
                  <span className="text-[10px] text-zinc-500">On this device</span>
                </button>
              </div>
            </div>

            {/* Category 2: Mode & Multiplayer */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 block mb-2 px-1">
                Formats and friends
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenModeSelector();
                  }}
                  className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-left flex flex-col gap-1 active:scale-98 cursor-pointer hover:bg-white/[0.08]"
                >
                  <Sliders className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-bold text-white">{formatLabel}</span>
                  <span className="text-[10px] text-zinc-400">Change format</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenFriendsModal();
                  }}
                  className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-left flex flex-col gap-1 active:scale-98 cursor-pointer hover:bg-white/[0.08]"
                >
                  <Swords className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-white">Challenge a friend</span>
                  <span className="text-[10px] text-zinc-400">{versusSeed ? `Code: ${versusSeed}` : 'Same songs, beat their score'}</span>
                </button>
              </div>
            </div>

            {/* Restart Draft Danger Button */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsResetConfirmOpen(true);
              }}
              className="w-full py-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-98 cursor-pointer mt-1"
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
        message="This clears the songs you picked in this draft and starts a new one."
        confirmText="Start over"
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
