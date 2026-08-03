import type { GameMode } from '../types/draft.ts';
import type { GameSessionRecord, SessionPick, SessionVisibility } from '../types/session.ts';

/**
 * Prototype repository boundary. It deliberately keeps the web demo usable
 * without Postgres; production can replace this module with Prisma/Neon
 * without changing the API contract.
 */
const sessions = new Map<string, GameSessionRecord>();

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createSession(input: {
  mode: GameMode;
  trackCount: number;
  creatorAlias?: string;
  brief?: string;
  visibility?: SessionVisibility;
  opponentType?: 'ai' | 'friend';
  seed?: string | null;
}): GameSessionRecord {
  const now = new Date().toISOString();
  const record: GameSessionRecord = {
    id: createId('session'),
    mode: input.mode,
    trackCount: input.trackCount,
    creatorAlias: (input.creatorAlias ?? 'Executive Architect').trim().slice(0, 40) || 'Executive Architect',
    brief: (input.brief ?? 'Build the strongest project under the current brief.').trim().slice(0, 240),
    visibility: input.visibility ?? 'private',
    opponentType: input.opponentType ?? 'ai',
    seed: input.seed ?? null,
    status: 'drafting',
    picks: [],
    createdAt: now,
    updatedAt: now,
  };
  sessions.set(record.id, record);
  return record;
}

export function getSession(id: string) {
  return sessions.get(id) ?? null;
}

export function saveSessionPick(id: string, pick: SessionPick) {
  const session = sessions.get(id);
  if (!session || session.status !== 'drafting') return null;
  const nextPicks = session.picks.filter((existing) => existing.position !== pick.position);
  nextPicks.push(pick);
  nextPicks.sort((a, b) => a.position - b.position);
  const updated = { ...session, picks: nextPicks, updatedAt: new Date().toISOString() };
  sessions.set(id, updated);
  return updated;
}

export function submitSession(id: string) {
  const session = sessions.get(id);
  if (!session || session.picks.length !== session.trackCount) return null;
  const updated = { ...session, status: 'submitted' as const, updatedAt: new Date().toISOString() };
  sessions.set(id, updated);
  return updated;
}

export function clearSessionsForTests() {
  sessions.clear();
}
