'use client';

import dynamic from 'next/dynamic';

// Screens and pop-ups that aren't needed for the first screen. Each one is its
// own download, fetched the first time it is shown, so the game opens faster.

const loadResults = () => import('@/components/AICriticPanel').then((m) => m.AICriticPanel);

export const AICriticPanel = dynamic(loadResults, { ssr: false });
export const HowToPlayPanel = dynamic(() => import('@/components/HowToPlayPanel').then((m) => m.HowToPlayPanel), { ssr: false });
export const SetupPanel = dynamic(() => import('@/components/SetupPanel').then((m) => m.SetupPanel), { ssr: false });
export const LibraryPanel = dynamic(() => import('@/components/LibraryPanel').then((m) => m.LibraryPanel), { ssr: false });
export const ProfilePanel = dynamic(() => import('@/components/ProfilePanel').then((m) => m.ProfilePanel), { ssr: false });
export const DraftHistoryPanel = dynamic(() => import('@/components/DraftHistoryPanel').then((m) => m.DraftHistoryPanel), { ssr: false });
export const ModeSelectorModal = dynamic(() => import('@/components/ModeSelectorModal').then((m) => m.ModeSelectorModal), { ssr: false });
export const PlayAgainstFriendsModal = dynamic(() => import('@/components/PlayAgainstFriendsModal').then((m) => m.PlayAgainstFriendsModal), { ssr: false });
export const TracklistDrawer = dynamic(() => import('@/components/TracklistDrawer').then((m) => m.TracklistDrawer), { ssr: false });
export const ExportModal = dynamic(() => import('@/components/ExportModal').then((m) => m.ExportModal), { ssr: false });
export const RealSongPlayerModal = dynamic(() => import('@/components/RealSongPlayerModal').then((m) => m.RealSongPlayerModal), { ssr: false });

type ResultsPanelComponent = Awaited<ReturnType<typeof loadResults>>;
let resultsPreloaded = false;
let loadedResultsPanel: ResultsPanelComponent | null = null;

/**
 * Starts downloading the results screen ahead of time (safe to call often).
 * `onReady` runs once it is in memory, so the page can show it directly:
 * going through the lazy wrapper again would make React hold the reveal
 * for a moment even though the code is already here.
 */
export function preloadResultsScreen(onReady?: () => void) {
  if (loadedResultsPanel) { onReady?.(); return; }
  if (resultsPreloaded) return;
  resultsPreloaded = true;
  void loadResults()
    .then((panel) => { loadedResultsPanel = panel; onReady?.(); })
    .catch(() => { resultsPreloaded = false; });
}

/** The results screen if it has already been downloaded, else null. */
export function getLoadedResultsPanel(): ResultsPanelComponent | null {
  return loadedResultsPanel;
}
