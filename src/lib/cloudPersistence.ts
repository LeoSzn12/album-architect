import type { GameMode } from '../types/draft.ts';

/** Guest games are saved by Zustand locally; cloud writes require a signed-in user.
 * Budget is local-only until the database supports its five-track format.
 * This is a UI capability check, never a replacement for API authorization.
 */
export async function canPersistGame(mode: GameMode, request: typeof fetch = fetch): Promise<boolean> {
  if (mode === 'budget') return false;
  try {
    const response = await request('/api/auth/session', { cache: 'no-store' });
    if (!response.ok) return false;
    const identity = await response.json();
    return identity?.configured === true && identity?.authenticated === true;
  } catch {
    return false;
  }
}
