/**
 * "Beat my week one" challenges. The link carries the draft seed (so a friend
 * drafts from the same song pool) and the sender's week-one units. Everything
 * lives in the link and on the friend's device: no sign-in, no server.
 */
const STORAGE_KEY = 'first-week:challenge-target';
const MAX_UNITS = 50_000_000;

export interface ChallengeTarget {
  seed: string;
  units: number;
}

export function parseUnitsToBeat(value: string | null | undefined): number | undefined {
  if (!value || !/^\d{1,9}$/.test(value)) return undefined;
  const units = Number(value);
  return units > 0 && units <= MAX_UNITS ? units : undefined;
}

export function saveChallengeTarget(target: ChallengeTarget): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(target));
  } catch {
    // Storage can be blocked; the challenge still plays, just without the target.
  }
}

export function readChallengeTarget(seed: string | null | undefined): ChallengeTarget | null {
  if (!seed || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ChallengeTarget>;
    const units = parseUnitsToBeat(String(parsed.units ?? ''));
    if (parsed.seed !== seed || !units) return null;
    return { seed, units };
  } catch {
    return null;
  }
}
