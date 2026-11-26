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

let resultsPreloaded = false;
/** Starts downloading the results screen ahead of time (safe to call often). */
export function preloadResultsScreen() {
  if (resultsPreloaded) return;
  resultsPreloaded = true;
  void loadResults().catch(() => { resultsPreloaded = false; });
}
