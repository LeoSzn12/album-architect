'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { Header } from '@/components/Header';
import { OscilloscopeEnergyBar } from '@/components/OscilloscopeEnergyBar';
import { ArtistMonopolyTracker } from '@/components/ArtistMonopolyTracker';
import { DraftBoard } from '@/components/DraftBoard';
import { AICriticPanel } from '@/components/AICriticPanel';
import { ModeSelectorModal } from '@/components/ModeSelectorModal';
import { TracklistDrawer } from '@/components/TracklistDrawer';
import { ExportModal } from '@/components/ExportModal';
import { RealSongPlayerModal } from '@/components/RealSongPlayerModal';
import { DockedMusicPlayer } from '@/components/DockedMusicPlayer';
import { DraftHistoryPanel } from '@/components/DraftHistoryPanel';
import { LeaderboardPanel } from '@/components/LeaderboardPanel';
import { PlayAgainstFriendsModal } from '@/components/PlayAgainstFriendsModal';
import { GameMode, DifficultyTier, EraFilter } from '@/types/draft';

export default function Home() {
  const { currentRoundIndex, slots, evaluationResult, evaluateDraft, startNewDraft } =
    useDraftStore();

  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const [isTracklistOpen, setIsTracklistOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);

  const leaderboardRef = useRef<HTMLDivElement>(null);
  const isCompleted = currentRoundIndex >= slots.length;

  // Auto-initialize challenge seed from URL search parameters on mount.
  // Only call startNewDraft (which internally sets draftSeed); calling
  // setDraftSeed first would double-invoke startNewDraft, resetting
  // draftedTracks/evaluationResult twice and duplicating any future
  // side-effects. (Audit finding H1.)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlSeed = params.get('seed')?.trim().toUpperCase();
    const urlMode = params.get('mode')?.trim().toLowerCase() as GameMode | undefined;
    const urlDiff = params.get('diff')?.trim().toLowerCase() as DifficultyTier | undefined;
    const urlEra = params.get('era')?.trim().toLowerCase() as EraFilter | undefined;

    if (urlSeed) {
      startNewDraft(
        urlMode === 'ep' || urlMode === 'album' ? urlMode : undefined,
        urlEra === 'all' || urlEra === '2020s' || urlEra === '2010s' || urlEra === '2000s'
          ? urlEra
          : undefined,
        urlDiff === 'standard' || urlDiff === 'veteran' || urlDiff === 'hardcore' ? urlDiff : undefined,
        urlSeed
      );
    }
  }, [startNewDraft]);

  const handleEvaluate = async () => {
    await evaluateDraft();
  };

  const handleScrollToLeaderboard = () => {
    leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white relative pb-24">
      {/* Background Neon Ambient Glow Orbs */}
      <div className="fixed top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 translate-x-1/2 w-[30rem] h-[30rem] bg-pink-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-cyan-600/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Header */}
      <Header
        onOpenModeSelector={() => setIsModeSelectorOpen(true)}
        onToggleTracklist={() => setIsTracklistOpen(true)}
        onOpenFriendsModal={() => setIsFriendsModalOpen(true)}
        onScrollToLeaderboard={handleScrollToLeaderboard}
      />

      {/* Main Container */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 flex-grow flex flex-col gap-6 relative z-10">
        {/* Oscilloscope Waveform & Energy Bar */}
        <OscilloscopeEnergyBar />

        {/* Artist Monopoly Engine Status */}
        <ArtistMonopolyTracker />

        {/* Draft Stage or Critic Review Panel */}
        {isCompleted && evaluationResult ? (
          <AICriticPanel
            onOpenExport={() => setIsExportOpen(true)}
            onOpenFriendsModal={() => setIsFriendsModalOpen(true)}
          />
        ) : (
          <DraftBoard onEvaluateTrigger={handleEvaluate} />
        )}

        {/* Executive Leaderboard & Rankings */}
        <div ref={leaderboardRef}>
          <LeaderboardPanel />
        </div>

        {/* Executive Draft History / Hall of Fame */}
        <DraftHistoryPanel />
      </main>

      {/* Footer Status */}
      <footer className="w-full max-w-6xl mx-auto text-center text-xs text-gray-500 py-6 border-t border-gray-800/80 mt-12 relative z-10 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Album Architect v2.0 • Fantasy Music League & A&R Engine</span>
        </div>
        <div className="text-gray-400">
          Powered by Next.js, Tailwind CSS & Zustand
        </div>
      </footer>

      {/* Modals & Slide-over Drawer */}
      <ModeSelectorModal
        isOpen={isModeSelectorOpen}
        onClose={() => setIsModeSelectorOpen(false)}
      />

      <PlayAgainstFriendsModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
      />

      <TracklistDrawer
        isOpen={isTracklistOpen}
        onClose={() => setIsTracklistOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <RealSongPlayerModal />
      <DockedMusicPlayer />
    </div>
  );
}
