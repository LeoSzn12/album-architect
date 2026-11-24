'use client';

import React from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { Disc3, Flame, Music2, Swords, Trophy } from 'lucide-react';
import { playHoverSound } from '@/lib/audioEngine';

interface MobileBottomNavProps {
  activeSurface?: string;
  onSelectSurface?: (surface: 'game' | 'how-to-play' | 'setup' | 'library' | 'profile') => void;
  onToggleTracklist: () => void;
  onOpenFriendsModal: () => void;
  onScrollToLeaderboard: () => void;
  onScrollToCrowd?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeSurface = 'game',
  onSelectSurface,
  onToggleTracklist,
  onOpenFriendsModal,
  onScrollToLeaderboard,
  onScrollToCrowd,
}) => {
  const { draftedTracks, slots, crowdHype, audioEnabled } = useDraftStore();

  const handleBoardClick = () => {
    playHoverSound(audioEnabled);
    if (activeSurface !== 'game' && onSelectSurface) {
      onSelectSurface('game');
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollToCrowdSection = () => {
    playHoverSound(audioEnabled);
    if (activeSurface !== 'game' && onSelectSurface) {
      onSelectSurface('game');
    }
    if (onScrollToCrowd) {
      onScrollToCrowd();
      return;
    }
    // The draft board may only just be mounting after a screen switch, so wait a beat.
    const openStats = (triesLeft: number) => {
      const statsEl = document.getElementById('crowd-stats') as HTMLDetailsElement | null;
      if (statsEl) {
        statsEl.open = true;
        statsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (triesLeft > 0) {
        window.setTimeout(() => openStats(triesLeft - 1), 50);
      }
    };
    openStats(10);
  };

  return (
    <nav
      aria-label="Mobile Navigation Dock"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0e]/95 backdrop-blur-2xl border-t border-white/[0.08] pb-safe shadow-2xl shadow-black/90"
    >
      <div className="flex items-center justify-around px-2 py-1 min-h-[52px]">
        {/* 1. Board / Draft */}
        <button
          onClick={handleBoardClick}
          className={`flex flex-col items-center justify-center flex-1 min-h-[44px] transition-colors cursor-pointer ${
            activeSurface === 'game' ? 'text-white font-black' : 'text-zinc-400 active:text-white'
          }`}
          title="Return to Draft Board"
        >
          <Disc3 className={`w-5 h-5 ${activeSurface === 'game' ? 'text-rose-500 animate-spin-slow' : 'text-zinc-400'}`} />
          <span className="text-[11px] mt-0.5">
            Draft
          </span>
        </button>

        {/* 2. Crowd Arena */}
        <button
          onClick={handleScrollToCrowdSection}
          className="flex flex-col items-center justify-center flex-1 min-h-[44px] text-zinc-300 active:text-white transition-colors cursor-pointer"
          title="Jump to Crowd Arena & Hype"
        >
          <div className="relative">
            <Flame className="w-5 h-5 text-rose-500" />
            <span className="absolute -top-1 -right-2 px-1 rounded-full bg-rose-950 border border-rose-500/60 text-[8px] font-black text-rose-300">
              {crowdHype.score}%
            </span>
          </div>
          <span className="text-[11px] font-bold mt-0.5">
            Crowd
          </span>
        </button>

        {/* 3. My Tracklist */}
        <button
          onClick={() => {
            playHoverSound(audioEnabled);
            onToggleTracklist();
          }}
          className="flex flex-col items-center justify-center flex-1 min-h-[44px] text-zinc-300 active:text-white transition-colors cursor-pointer relative"
          title="Open Tracklist Drawer"
        >
          <div className="relative">
            <Music2 className="w-5 h-5 text-zinc-300" />
            {draftedTracks.length > 0 && (
              <span className="absolute -top-1 -right-2 px-1 rounded-full bg-white text-black text-[8px] font-black">
                {draftedTracks.length}/{slots.length}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold mt-0.5">
            Tracks
          </span>
        </button>

        {/* 4. 1v1 Battle */}
        <button
          onClick={() => {
            playHoverSound(audioEnabled);
            onOpenFriendsModal();
          }}
          className="flex flex-col items-center justify-center flex-1 min-h-[44px] text-zinc-300 active:text-white transition-colors cursor-pointer"
          title="Challenge a Friend"
        >
          <Swords className="w-5 h-5 text-zinc-400" />
          <span className="text-[11px] font-bold mt-0.5">
            Friend
          </span>
        </button>

        {/* 5. Leaderboard */}
        <button
          onClick={() => {
            playHoverSound(audioEnabled);
            onScrollToLeaderboard();
          }}
          className="flex flex-col items-center justify-center flex-1 min-h-[44px] text-zinc-300 active:text-white transition-colors cursor-pointer"
          title="View Leaderboard"
        >
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="text-[11px] font-bold mt-0.5">
            Scores
          </span>
        </button>
      </div>
    </nav>
  );
};
