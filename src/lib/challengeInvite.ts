import { getDailyTheme } from './dailyDrop.ts';
import type { ChallengeTheme, DifficultyTier, EraFilter, GameMode } from '../types/draft.ts';
import { parseUnitsToBeat } from './firstWeek/weekOneChallenge.ts';

export interface ChallengeInvite {
  seed: string;
  mode: GameMode;
  difficulty: DifficultyTier;
  era: EraFilter;
  theme: ChallengeTheme;
  /** Sender's week-one units, for a "beat my week one" challenge. */
  toBeat?: number;
}

const themes: ChallengeTheme[] = ['standard', 'era-90s', 'era-2000s', 'era-2010s', 'era-2020s', 'year-2016', 'genre-hiphop', 'genre-rnb', 'genre-country', 'genre-edm', 'genre-bollywood', 'year-2025'];

export function parseChallengeInvite(value: string): ChallengeInvite | null {
  const trimmed = value.trim();
  let params: URLSearchParams;
  try {
    params = trimmed.startsWith('?') ? new URLSearchParams(trimmed) : new URL(trimmed).searchParams;
  } catch {
    params = new URLSearchParams({ seed: trimmed });
  }
  const seed = params.get('seed')?.trim().toUpperCase();
  if (!seed || !/^[A-Z0-9_-]{1,40}$/.test(seed)) return null;
  const mode = params.get('mode');
  const difficulty = params.get('diff');
  const era = params.get('era');
  const theme = params.get('theme') as ChallengeTheme | null;
  const toBeat = parseUnitsToBeat(params.get('beat'));
  return {
    ...(toBeat ? { toBeat } : {}),
    seed,
    mode: mode === 'ep' || mode === 'album' || mode === 'budget' ? mode : 'draft',
    difficulty: difficulty === 'veteran' || difficulty === 'hardcore' ? difficulty : 'standard',
    era: era === '2020s' || era === '2010s' || era === '2000s' ? era : 'all',
    theme: theme && themes.includes(theme) ? theme
      : /^DAILY-\d{4}-\d{2}-\d{2}$/.test(seed) && !Number.isNaN(Date.parse(seed.slice(6)))
        ? getDailyTheme(new Date(seed.slice(6))).theme : 'standard',
  };
}

export function buildChallengeInvite(origin: string, invite: ChallengeInvite): string {
  // origin may include a base path (e.g. https://host/album-architect); keep it.
  const url = new URL('./', origin.endsWith('/') ? origin : `${origin}/`);
  const params = new URLSearchParams({ seed: invite.seed, mode: invite.mode, diff: invite.difficulty, era: invite.era, theme: invite.theme });
  if (invite.toBeat) params.set('beat', String(Math.round(invite.toBeat)));
  url.search = params.toString();
  return url.toString();
}
