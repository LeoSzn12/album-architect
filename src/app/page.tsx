'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { Header } from '@/components/Header';
import { DraftTelemetryBar } from '@/components/DraftTelemetryBar';
import { DraftBoard } from '@/components/DraftBoard';
import { AICriticPanel } from '@/components/AICriticPanel';
import { LandingScreen } from '@/components/LandingScreen';
import { ModeSelectorModal } from '@/components/ModeSelectorModal';
import { TracklistDrawer } from '@/components/TracklistDrawer';
import { ExportModal } from '@/components/ExportModal';
import { RealSongPlayerModal } from '@/components/RealSongPlayerModal';
import { DockedMusicPlayer } from '@/components/DockedMusicPlayer';
import { DraftHistoryPanel } from '@/components/DraftHistoryPanel';
import { LeaderboardPanel } from '@/components/LeaderboardPanel';
import { PlayAgainstFriendsModal } from '@/components/PlayAgainstFriendsModal';
import { GameMode, DifficultyTier, EraFilter } from '@/types/draft';
import { SetupPanel, type SetupPreferences } from '@/components/SetupPanel';
import { LibraryPanel } from '@/components/LibraryPanel';
import { ProfilePanel } from '@/components/ProfilePanel';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { HowToPlayPanel } from '@/components/HowToPlayPanel';

export default function Home() {
  const {
    currentRoundIndex,
    slots,
    draftedTracks,
    evaluationResult,
    evaluateDraft,
    startNewDraft,
    resumePersistedSession,
    pastDrafts,
    playerAlias,
    setPlayerAlias,
  } = useDraftStore();

  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const [isTracklistOpen, setIsTracklistOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(
    () => draftedTracks.length > 0 || currentRoundIndex > 0 || evaluationResult !== null
  );
  const [activeSurface, setActiveSurface] = useState<'game' | 'how-to-play' | 'setup' | 'library' | 'profile'>('game');
  const [setupPreferences, setSetupPreferences] = useState<SetupPreferences>({ tasteTags: [], sourceScope: 'all' });

  const leaderboardRef = useRef<HTMLDivElement>(null);
  const isCompleted = currentRoundIndex >= slots.length;

  // Sync started state when returning mid-draft
  useEffect(() => {
    if (draftedTracks.length > 0 || currentRoundIndex > 0 || evaluationResult !== null) {
      queueMicrotask(() => setHasStarted(true));
    }
  }, [draftedTracks.length, currentRoundIndex, evaluationResult]);

  // Auto-initialize challenge seed from URL search params on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlSeed = params.get('seed')?.trim().toUpperCase();
    const urlMode = params.get('mode')?.trim().toLowerCase() as GameMode | undefined;
    const urlDiff = params.get('diff')?.trim().toLowerCase() as DifficultyTier | undefined;
    const urlEra = params.get('era')?.trim().toLowerCase() as EraFilter | undefined;

    if (urlSeed) {
      startNewDraft(
        urlMode === 'draft' || urlMode === 'ep' || urlMode === 'album' ? urlMode : undefined,
        urlEra === 'all' || urlEra === '2020s' || urlEra === '2010s' || urlEra === '2000s'
          ? urlEra
          : undefined,
        urlDiff === 'standard' || urlDiff === 'veteran' || urlDiff === 'hardcore' ? urlDiff : undefined,
        urlSeed
      );
      queueMicrotask(() => setHasStarted(true));
    }
  }, [startNewDraft]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).has('seed')) return;
    void resumePersistedSession();
  }, [resumePersistedSession]);

  const handleEvaluate = async () => {
    await evaluateDraft();
  };

  const handleScrollToLeaderboard = () => {
    leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartDraft = () => {
    // startNewDraft without args uses current mode/era/difficulty
    startNewDraft();
    setHasStarted(true);
    setActiveSurface('game');
  };

  // Show landing screen only for brand-new sessions
  const showLanding = !hasStarted;

  return (
    <div className="min-h-screen min-w-0 bg-[#050507] text-white flex flex-col justify-between selection:bg-white selection:text-black relative pb-32 sm:pb-28">
      {/* Apple Music Deep Atmospheric Lighting (High-end smoked glass vignette) */}
      <div className="fixed inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-black pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[420px] bg-gradient-to-b from-rose-500/[0.04] via-white/[0.01] to-transparent blur-3xl pointer-events-none" />

      {/* Header — always visible */}
      <Header
        activeSurface={activeSurface}
        onSelectSurface={setActiveSurface}
        onOpenModeSelector={() => { setActiveSurface('game'); setIsModeSelectorOpen(true); }}
        onToggleTracklist={() => { setActiveSurface('game'); setIsTracklistOpen(true); }}
        onOpenFriendsModal={() => { setActiveSurface('game'); setIsFriendsModalOpen(true); }}
        onScrollToLeaderboard={handleScrollToLeaderboard}
        onOpenSetup={() => setActiveSurface('setup')}
        onOpenLibrary={() => setActiveSurface('library')}
        onOpenProfile={() => setActiveSurface('profile')}
        onOpenHowToPlay={() => setActiveSurface('how-to-play')}
      />

      {/* Main Container */}
      <main className="box-border min-w-0 w-full max-w-6xl mx-auto px-4 sm:px-6 flex-grow flex flex-col gap-6 relative z-10">

        {activeSurface === 'how-to-play' ? (
          <HowToPlayPanel onBackToDraft={() => setActiveSurface('game')} />
        ) : activeSurface === 'setup' ? (
          <SetupPanel
            initialTasteTags={setupPreferences.tasteTags}
            initialSourceScope={setupPreferences.sourceScope}
            onPreferencesChange={setSetupPreferences}
            onContinue={() => setActiveSurface('library')}
            onBackToGame={() => setActiveSurface('game')}
          />
        ) : activeSurface === 'library' ? (
          <LibraryPanel
            sourceScope={setupPreferences.sourceScope}
            exportSongs={draftedTracks.map((track) => track.song)}
            onSelectSong={() => setActiveSurface('game')}
            onBackToGame={() => setActiveSurface('game')}
          />
        ) : activeSurface === 'profile' ? (
          <ProfilePanel
            displayName={playerAlias}
            stats={{
              draftsCompleted: pastDrafts.length,
              wins: pastDrafts.filter((draft) => draft.overallScore >= 8).length,
              tracksDrafted: pastDrafts.reduce((total, draft) => total + draft.trackCount, 0),
              averageScore: pastDrafts.length ? pastDrafts.reduce((total, draft) => total + draft.overallScore, 0) / pastDrafts.length : 0,
            }}
            onProfileChange={({ displayName }) => setPlayerAlias(displayName)}
            onBackToGame={() => setActiveSurface('game')}
          />
        ) : showLanding ? (
          /* ── Landing (first-time experience) ── */
          <LandingScreen
            onStart={handleStartDraft}
            onOpenFriendsModal={() => setIsFriendsModalOpen(true)}
            onScrollToLeaderboard={handleScrollToLeaderboard}
            onOpenHowToPlay={() => setActiveSurface('how-to-play')}
          />
        ) : (
          /* ── Active Draft or Results ── */
          <>
            {/* Compact Telemetry HUD with collapsible deep waveform & monopoly radar */}
            {!isCompleted && <DraftTelemetryBar />}

            {/* Main panel: critic results OR draft board */}
            {isCompleted && evaluationResult ? (
              <AICriticPanel
                onOpenExport={() => setIsExportOpen(true)}
                onOpenFriendsModal={() => setIsFriendsModalOpen(true)}
              />
            ) : (
              <DraftBoard onEvaluateTrigger={handleEvaluate} />
            )}
          </>
        )}

        {/* Leaderboard & History — always below (not in landing) */}
        {!showLanding && (
          <>
            <div ref={leaderboardRef}>
              <LeaderboardPanel />
            </div>
            <DraftHistoryPanel />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto text-center text-xs text-gray-500 py-6 border-t border-gray-800/80 mt-12 relative z-10 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>TrackDraft • Fantasy Music Game</span>
        </div>
        <div className="text-gray-400">
          Built with Next.js, Zustand & a seeded demo catalog
        </div>
      </footer>

      {/* Modals & Drawers */}
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

      {/* Mobile Bottom Navigation Dock */}
      {!showLanding && (
        <MobileBottomNav
          activeSurface={activeSurface}
          onSelectSurface={setActiveSurface}
          onToggleTracklist={() => {
            setActiveSurface('game');
            setIsTracklistOpen(true);
          }}
          onOpenFriendsModal={() => {
            setActiveSurface('game');
            setIsFriendsModalOpen(true);
          }}
          onScrollToLeaderboard={handleScrollToLeaderboard}
        />
      )}
    </div>
  );
}
