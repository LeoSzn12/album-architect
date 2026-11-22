/**
 * The all-time ladder. Milestone tiers are game tiers, not real chart figures.
 *
 * Classic album entries must use real, published first-week figures with a
 * source for every number. None are included yet: add entries here only with
 * a `source` URL you have checked. Never use a chart company's name or logo.
 */
export interface LadderMilestone {
  units: number;
  label: string;
}

export interface ClassicAlbumBenchmark {
  title: string;
  artist: string;
  year: number;
  firstWeekUnits: number;
  /** Public page the figure was taken from. Required. */
  source: string;
}

export const LADDER_MILESTONES: LadderMilestone[] = [
  { units: 0, label: 'Under the radar' },
  { units: 40_000, label: 'Indie buzz' },
  { units: 80_000, label: 'Solid debut' },
  { units: 150_000, label: 'Top 10 debut' },
  { units: 250_000, label: 'Big debut' },
  { units: 400_000, label: 'Number 1 contender' },
  { units: 600_000, label: 'Blockbuster week' },
  { units: 850_000, label: 'Historic week' },
  { units: 1_100_000, label: 'All-time legend' },
];

export const CLASSIC_ALBUMS: ClassicAlbumBenchmark[] = [];

export function milestoneFor(units: number): { current: LadderMilestone; next: LadderMilestone | null } {
  let current = LADDER_MILESTONES[0];
  let next: LadderMilestone | null = null;
  for (const milestone of LADDER_MILESTONES) {
    if (units >= milestone.units) current = milestone;
    else {
      next = milestone;
      break;
    }
  }
  return { current, next };
}

/** Classic albums just below and just above a number, when any are listed. */
export function classicNeighbours(units: number, list: ClassicAlbumBenchmark[] = CLASSIC_ALBUMS) {
  const sorted = [...list].sort((a, b) => a.firstWeekUnits - b.firstWeekUnits);
  const below = [...sorted].reverse().find((album) => album.firstWeekUnits <= units) ?? null;
  const above = sorted.find((album) => album.firstWeekUnits > units) ?? null;
  return { below, above };
}

export function formatUnits(units: number): string {
  if (units >= 1_000_000) return `${(units / 1_000_000).toFixed(2).replace(/0$/, '')}M`;
  if (units >= 1_000) return `${Math.round(units / 1_000)}K`;
  return String(Math.round(units));
}
