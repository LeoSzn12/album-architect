'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDraftStore } from '@/store/useDraftStore';
import { Header } from '@/components/Header';
import { DraftBoard } from '@/components/DraftBoard';
import { LandingScreen } from '@/components/LandingScreen';
import { DockedMusicPlayer } from '@/components/DockedMusicPlayer';
import { LeaderboardPanel } from '@/components/LeaderboardPanel';
import { parseChallengeInvite } from '@/lib/challengeInvite';
import { saveChallengeTarget, type ChallengeTarget } from '@/lib/firstWeek/weekOneChallenge';
import { formatUnits } from '@/lib/firstWeek/ladder';
import type { SetupPreferences } from '@/components/SetupPanel';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import type { ChallengeTheme } from '@/types/draft';
import {
  AICriticPanel,
  DraftHistoryPanel,
  ExportModal,
  HowToPlayPanel,
  LibraryPanel,
  ModeSelectorModal,
  PlayAgainstFriendsModal,
  ProfilePanel,
  RealSongPlayerModal,
  SetupPanel,
  TracklistDrawer,
  getLoadedResultsPanel,
  preloadResultsScreen,
} from '@/components/lazyPanels';

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
    draftSeed,
    setPlayerAlias,
    isPlayerModalOpen,
  } = useDraftStore(useShallow((s) => ({
    currentRoundIndex: s.currentRoundIndex,
    slots: s.slots,
    draftedTracks: s.draftedTracks,
    evaluationResult: s.evaluationResult,
    evaluateDraft: s.evaluateDraft,
    startNewDraft: s.startNewDraft,
    resumePersistedSession: s.resumePersistedSession,
    pastDrafts: s.pastDrafts,
    playerAlias: s.playerAlias,
    draftSeed: s.draftSeed,
    setPlayerAlias: s.setPlayerAlias,
    isPlayerModalOpen: s.isPlayerModalOpen,
  })));

  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const [isTracklistOpen, setIsTracklistOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(
    () => draftedTracks.length > 0 || currentRoundIndex > 0 || evaluationResult !== null
  );
  const [activeSurface, setActiveSurface] = useState<'game' | 'how-to-play' | 'setup' | 'library' | 'profile'>('game');
  const [setupPreferences, setSetupPreferences] = useState<SetupPreferences>({ tasteTags: [], sourceScope: 'all' });

  const [friendTarget, setFriendTarget] = useState<ChallengeTarget | null>(null);
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
    const invite = parseChallengeInvite(window.location.href);
    if (invite) {
      const saved = useDraftStore.getState();
      const canResume = saved.draftSeed === invite.seed && saved.gameMode === invite.mode
        && saved.difficulty === invite.difficulty && saved.selectedEra === invite.era
        && saved.challengeTheme === invite.theme && saved.draftedTracks.length > 0;
      if (!canResume) startNewDraft(invite.mode, invite.era, invite.difficulty, invite.seed, invite.theme);
      const target = invite.toBeat ? { seed: invite.seed, units: invite.toBeat } : null;
      if (target) saveChallengeTarget(target);
      queueMicrotask(() => {
        setHasStarted(true);
        setFriendTarget(target);
      });
    }
  }, [startNewDraft]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (parseChallengeInvite(window.location.href)) return;
    void resumePersistedSession();
  }, [resumePersistedSession]);

  // Fetch the results screen's code while the last picks are being made, so it
  // shows instantly when the album is released.
  const [loadedResults, setLoadedResults] = useState<{ Panel: NonNullable<ReturnType<typeof getLoadedResultsPanel>> } | null>(null);
  useEffect(() => {
    if (currentRoundIndex >= Math.max(0, slots.length - 2)) {
      preloadResultsScreen(() => {
        const Panel = getLoadedResultsPanel();
        if (Panel) setLoadedResults({ Panel });
      });
    }
  }, [currentRoundIndex, slots.length]);
  const ResultsPanel = loadedResults?.Panel ?? AICriticPanel;

  const handleEvaluate = async () => {
    await evaluateDraft();
  };

  const [leaderboardRequested, setLeaderboardRequested] = useState(0);

  const handleScrollToLeaderboard = () => {
    setActiveSurface('game');
    setLeaderboardRequested((request) => request + 1);
  };

  useEffect(() => {
    if (!leaderboardRequested) return;
    leaderboardRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    leaderboardRef.current?.focus({ preventScroll: true });
  }, [leaderboardRequested]);

  const handleStartDraft = (theme?: ChallengeTheme) => {
    // A category start is a fresh solo draft; otherwise keep the current settings.
    if (theme) startNewDraft(undefined, undefined, undefined, null, theme);
    else startNewDraft();
    setHasStarted(true);
    setActiveSurface('game');
  };

  // Show landing screen only for brand-new sessions
  const showLanding = !hasStarted;

  return (
    <div className="min-h-screen min-w-0 bg-[#08080c] text-white flex flex-col justify-between selection:bg-white selection:text-black relative pb-32 sm:pb-28 overflow-x-hidden">
      {/* Ambient backdrop. Painted gradients, not blurred shapes: same glow,
          but phones don't have to re-blur the whole screen while scrolling. */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(120,119,198,0.18), rgba(255,255,255,0))',
            'radial-gradient(circle at 195px 147px, rgba(225,29,72,0.13) 0, rgba(225,29,72,0.07) 275px, rgba(225,29,72,0) 540px)',
            'radial-gradient(circle at calc(100% - 220px) 172px, rgba(79,70,229,0.13) 0, rgba(79,70,229,0.07) 300px, rgba(79,70,229,0) 580px)',
            'radial-gradient(ellipse 480px 330px at 50% 480px, rgba(245,158,11,0.07), rgba(245,158,11,0))',
            'linear-gradient(to top, #000 0, rgba(8,8,12,0.8) 200px, rgba(8,8,12,0) 400px)',
          ].join(', '),
        }}
      />

      {/* Header — always visible */}
      <Header
        showProgress={!showLanding}
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
            onDailyStarted={() => { setHasStarted(true); setActiveSurface('game'); }}
            onOpenFriendsModal={() => setIsFriendsModalOpen(true)}
            onScrollToLeaderboard={handleScrollToLeaderboard}
            onOpenHowToPlay={() => setActiveSurface('how-to-play')}
          />
        ) : (
          /* ── Active Draft or Results ── */
          <>
            {!isCompleted && friendTarget && draftSeed === friendTarget.seed && (
              <div role="status" className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm font-bold text-amber-200">
                A friend sold {formatUnits(friendTarget.units)} in week one with this song pool. Beat it.
              </div>
            )}

            {/* Main panel: critic results OR draft board */}
            {isCompleted && evaluationResult ? (
              <ResultsPanel
                onOpenExport={() => setIsExportOpen(true)}
                onOpenFriendsModal={() => setIsFriendsModalOpen(true)}
              />
            ) : (
              <DraftBoard onEvaluateTrigger={handleEvaluate} />
            )}
          </>
        )}

        {/* Scores and history: on the landing and results screens, kept out of the way mid-draft */}
        {activeSurface === 'game' && (showLanding || isCompleted || leaderboardRequested > 0) && (
          <>
            <div ref={leaderboardRef} tabIndex={-1} aria-label="Leaderboard" className="scroll-mt-28 rounded-3xl">
              <LeaderboardPanel key={leaderboardRequested} defaultOpen={leaderboardRequested > 0} />
            </div>
            {!showLanding && isCompleted && <DraftHistoryPanel />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto text-center text-xs text-gray-500 py-6 border-t border-gray-800/80 mt-12 relative z-10 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>First Week • Draft it. Drop it. Outsell your friends.</span>
        </div>
        <div className="text-gray-400">
          Trust your ears. Build something worth replaying.
        </div>
      </footer>

      {/* Modals & Drawers */}
      {isModeSelectorOpen && <ModeSelectorModal
        isOpen={isModeSelectorOpen}
        onClose={() => setIsModeSelectorOpen(false)}
      />}

      {isFriendsModalOpen && <PlayAgainstFriendsModal
        onStarted={() => { setHasStarted(true); setActiveSurface('game'); }}
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
      />}

      {isTracklistOpen && <TracklistDrawer
        isOpen={isTracklistOpen}
        onClose={() => setIsTracklistOpen(false)}
      />}

      {isExportOpen && <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />}

      {isPlayerModalOpen && <RealSongPlayerModal />}
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
