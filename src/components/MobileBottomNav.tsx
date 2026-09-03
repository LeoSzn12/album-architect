'use client';

import React from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { Disc3, Flame, Music2, Swords, Trophy } from 'lucide-react';
import { playHoverSound } from '@/lib/audioEngine';

interface MobileBottomNavProps {
  onToggleTracklist: () => void;
  onOpenFriendsModal: () => void;
  onScrollToLeaderboard: () => void;
  onScrollToCrowd?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onToggleTracklist,
  onOpenFriendsModal,
  onScrollToLeaderboard,
  onScrollToCrowd,
}) => {
  const { draftedTracks, slots, crowdHype, audioEnabled } = useDraftStore();

  const handleScrollToTop = () => {
    playHoverSound(audioEnabled);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollToCrowdSection = () => {
    playHoverSound(audioEnabled);
    if (onScrollToCrowd) {
      onScrollToCrowd();
      return;
    }
    const crowdEl = document.querySelector('[aria-label="Live Crowd and Aux Hype Stage"]');
    if (crowdEl) {
      crowdEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <nav
      aria-label="Mobile Navigation Dock"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-purple-900/40 pb-safe shadow-2xl shadow-black/80"
    >
      <div className="flex items-center justify-around px-2 py-1.5 min-h-[52px]">
        {/* 1. Board / Draft */}
        <button
          onClick={handleScrollToTop}
          className="flex flex-col items-center justify-center flex-1 min-h-[44px] text-slate-300 active:text-purple-300 transition-colors cursor-pointer"
          title="Scroll to Draft Board"
        >
          <Disc3 className="w-5 h-5 text-purple-400" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider mt-0.5">
            Board
          </span>
        </button>

        {/* 2. Crowd Arena */}
        <button
          onClick={handleScrollToCrowdSection}
          className="flex flex-col items-center justify-center flex-1 min-h-[44px] text-slate-300 active:text-pink-300 transition-colors cursor-pointer"
          title="Jump to Crowd Arena & Hype"
        >
          <div className="relative">
            <Flame className="w-5 h-5 text-pink-400" />
            <span className="absolute -top-1 -right-2 px-1 rounded-full bg-pink-950 border border-pink-500/60 text-[8px] font-black text-pink-300">
              {crowdHype.score}%
            </span>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider mt-0.5">
            Crowd
          </span>
        </button>

        {/* 3. My Tracklist */}
        <button
          onClick={() => {
            playHoverSound(audioEnabled);
            onToggleTracklist();
          }}
          className="flex flex-col items-center justify-center flex-1 min-h-[44px] text-slate-300 active:text-cyan-300 transition-colors cursor-pointer relative"
          title="Open Tracklist Drawer"
        >
          <div className="relative">
            <Music2 className="w-5 h-5 text-cyan-400" />
            {draftedTracks.length > 0 && (
              <span className="absolute -top-1 -right-2 px-1 rounded-full bg-cyan-950 border border-cyan-500/60 text-[8px] font-black text-cyan-300">
                {draftedTracks.length}/{slots.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider mt-0.5">
            Tracks
          </span>
        </button>

        {/* 4. 1v1 Battle */}
        <button
          onClick={() => {
            playHoverSound(audioEnabled);
            onOpenFriendsModal();
          }}
          className="flex flex-col items-center justify-center flex-1 min-h-[44px] text-slate-300 active:text-amber-300 transition-colors cursor-pointer"
          title="Challenge a Friend"
        >
          <Swords className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider mt-0.5">
            1v1
          </span>
        </button>

        {/* 5. Leaderboard */}
        <button
          onClick={() => {
            playHoverSound(audioEnabled);
            onScrollToLeaderboard();
          }}
          className="flex flex-col items-center justify-center flex-1 min-h-[44px] text-slate-300 active:text-purple-300 transition-colors cursor-pointer"
          title="View Leaderboard"
        >
          <Trophy className="w-5 h-5 text-amber-300" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider mt-0.5">
            Ranks
          </span>
        </button>
      </div>
    </nav>
  );
};
