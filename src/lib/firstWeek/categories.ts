import type { ChallengeTheme, DraftSlot, SlotId, Song } from '../../types/draft.ts';
import { BEST_OF_2025_SONGS, BOLLYWOOD_SONGS, COUNTRY_SONGS, EDM_SONGS } from '../../data/categorySongs.ts';

export interface Category {
  id: ChallengeTheme;
  label: string;
  blurb: string;
  group: 'genre' | 'decade' | 'all';
}

/** Categories offered on the First Week start screen, in display order. */
export const CATEGORIES: Category[] = [
  { id: 'standard', label: 'Anything goes', blurb: 'The full catalog.', group: 'all' },
  { id: 'genre-hiphop', label: 'Hip-Hop', blurb: 'Bars, bangers and classics.', group: 'genre' },
  { id: 'genre-rnb', label: 'R&B / Soul', blurb: 'Slow jams and soul.', group: 'genre' },
  { id: 'genre-country', label: 'Country', blurb: 'From Dolly to Zach Bryan.', group: 'genre' },
  { id: 'genre-edm', label: 'EDM', blurb: 'Drops, builds and festival anthems.', group: 'genre' },
  { id: 'genre-bollywood', label: 'Bollywood', blurb: 'Film hits, from Dil Se to Jawan.', group: 'genre' },
  { id: 'era-90s', label: 'Best of the 90s', blurb: 'Golden era only.', group: 'decade' },
  { id: 'era-2000s', label: 'Best of the 2000s', blurb: '2000 to 2009.', group: 'decade' },
  { id: 'era-2010s', label: 'Best of the 2010s', blurb: '2010 to 2019.', group: 'decade' },
  { id: 'year-2025', label: 'Best of 2025', blurb: "This year's biggest songs.", group: 'decade' },
  { id: 'era-2020s', label: '2020s', blurb: '2020 and after.', group: 'decade' },
  { id: 'year-2016', label: 'Class of 2016', blurb: 'One year, one album.', group: 'decade' },
];

const LABELS: Partial<Record<ChallengeTheme, string>> = Object.fromEntries(CATEGORIES.map((category) => [category.id, category.label]));

export function getCategoryLabel(theme: ChallengeTheme | null | undefined): string | null {
  if (!theme || theme === 'standard') return null;
  return LABELS[theme] ?? null;
}

/** Categories whose songs live outside the main catalog. */
const CATEGORY_POOLS: Partial<Record<ChallengeTheme, Song[]>> = {
  'genre-country': COUNTRY_SONGS,
  'genre-edm': EDM_SONGS,
  'genre-bollywood': BOLLYWOOD_SONGS,
  'year-2025': BEST_OF_2025_SONGS,
};

export function isCatalogCategory(theme: ChallengeTheme | null | undefined): boolean {
  return Boolean(theme && CATEGORY_POOLS[theme]);
}

/** The songs a catalog category drafts from, or null for themes that filter the main library. */
export function categoryPool(theme: ChallengeTheme | null | undefined, mainLibrary: Song[]): Song[] | null {
  if (!theme) return null;
  const pool = CATEGORY_POOLS[theme];
  if (!pool) return null;
  if (theme === 'year-2025') return [...pool, ...mainLibrary.filter((song) => song.year === 2025)];
  return pool;
}

/** Genre-neutral slot names, so a country album doesn't ask for a "Gritty Street Anthem". */
const NEUTRAL_SLOT_NAMES: Partial<Record<SlotId, string>> = {
  'cinematic-intro': 'Opener',
  'statement-banger': 'Lead Single',
  'gritty-anthem': 'Anthem',
  'introspective-cut': 'Heart-on-Sleeve Cut',
  'vibe-shift': 'Vibe Shift / Collab',
  'mid-interlude': 'Interlude',
  'club-bounce': 'Party Peak',
  'late-night-rnb': 'Slow One',
  'experimental-flex': 'Deep Cut / Risk',
  'apex-climax': 'Big Finale Build',
  'acoustic-unplugged': 'Stripped Back',
  'melodic-trap': 'Melodic Wave',
  'storyteller-cut': 'Storyteller',
  'cinematic-outro': 'Closer',
};

export function relabelSlotsForCategory(slots: DraftSlot[], theme: ChallengeTheme | null | undefined): DraftSlot[] {
  if (!isCatalogCategory(theme)) return slots;
  return slots.map((slot) => ({ ...slot, name: NEUTRAL_SLOT_NAMES[slot.id] ?? slot.name }));
}
