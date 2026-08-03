import type { GameMode, Song } from './draft.ts';

export type SessionStatus = 'drafting' | 'submitted' | 'abandoned';
export type SessionVisibility = 'public' | 'friends' | 'private';

export interface SessionPick {
  position: number;
  slotId: string;
  song: Song;
  selectionSource: 'recommendation' | 'search' | 'link' | 'manual';
  lockedAt: string;
}

export interface GameSessionRecord {
  id: string;
  mode: GameMode;
  trackCount: number;
  creatorAlias: string;
  brief: string;
  visibility: SessionVisibility;
  opponentType: 'ai' | 'friend';
  seed: string | null;
  status: SessionStatus;
  picks: SessionPick[];
  createdAt: string;
  updatedAt: string;
}
