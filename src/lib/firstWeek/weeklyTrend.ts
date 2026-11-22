import type { DraftedTrack } from '../../types/draft.ts';

export interface WeeklyTrend {
  id: string;
  name: string;
  description: string;
  /** Share of base units this album gains from the trend (0 to about 0.1). */
  effect: (tracks: DraftedTrack[]) => { unitShare: number; note: string };
}

const share = (count: number, perSong: number, cap: number) => Math.min(cap, count * perSong);

export const WEEKLY_TRENDS: WeeklyTrend[] = [
  {
    id: 'features-hot',
    name: 'Features are hot',
    description: 'Listeners this week want collaborations.',
    effect: (tracks) => {
      const count = tracks.filter((track) => (track.song.featuredArtists ?? []).length > 0).length;
      return { unitShare: share(count, 0.025, 0.1), note: `${count} song${count === 1 ? '' : 's'} with features rode the trend.` };
    },
  },
  {
    id: 'late-night-wave',
    name: 'Late-night wave',
    description: 'Slow, moody songs are streaming big this week.',
    effect: (tracks) => {
      const count = tracks.filter((track) => track.song.energy <= 65).length;
      return { unitShare: share(count, 0.03, 0.1), note: `${count} slow song${count === 1 ? '' : 's'} caught the late-night wave.` };
    },
  },
  {
    id: 'throwback-season',
    name: 'Throwback season',
    description: 'Older songs are having a moment.',
    effect: (tracks) => {
      const count = tracks.filter((track) => (track.song.year ?? 9999) < 2010).length;
      return { unitShare: share(count, 0.025, 0.1), note: `${count} pre-2010 song${count === 1 ? '' : 's'} cashed in on throwback season.` };
    },
  },
  {
    id: 'big-hooks',
    name: 'Big hooks only',
    description: 'The biggest, most familiar songs win this week.',
    effect: (tracks) => {
      const count = tracks.filter((track) => track.song.recognition >= 92).length;
      return { unitShare: share(count, 0.02, 0.1), note: `${count} huge hit${count === 1 ? '' : 's'} pulled casual listeners in.` };
    },
  },
  {
    id: 'deep-cuts',
    name: 'Deep cuts trending',
    description: 'Critics and tastemakers are steering the week.',
    effect: (tracks) => {
      const count = tracks.filter((track) => track.song.recognition < 85 && (track.song.acclaim ?? track.song.impact) >= 85).length;
      return { unitShare: share(count, 0.035, 0.1), note: `${count} respected deep cut${count === 1 ? '' : 's'} got tastemaker love.` };
    },
  },
  {
    id: 'party-week',
    name: 'Party week',
    description: 'High-energy songs dominate the playlists.',
    effect: (tracks) => {
      const count = tracks.filter((track) => track.song.energy >= 88).length;
      return { unitShare: share(count, 0.025, 0.1), note: `${count} high-energy song${count === 1 ? '' : 's'} lit up party playlists.` };
    },
  },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// Weeks start on Friday, release day. 1970-01-02 was a Friday.
const FRIDAY_EPOCH = Date.UTC(1970, 0, 2);

export function weekNumber(date: Date = new Date()): number {
  return Math.floor((date.getTime() - FRIDAY_EPOCH) / WEEK_MS);
}

export function getWeeklyTrend(date: Date = new Date()): WeeklyTrend {
  const index = ((weekNumber(date) % WEEKLY_TRENDS.length) + WEEKLY_TRENDS.length) % WEEKLY_TRENDS.length;
  return WEEKLY_TRENDS[index];
}
