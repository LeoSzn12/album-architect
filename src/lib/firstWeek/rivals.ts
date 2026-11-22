import type { DraftSlot, DraftedTrack, Song } from '../../types/draft.ts';
import { createSeededRandom } from '../seededRandom.ts';

export type RivalId = 'hitmaker' | 'crate-digger' | 'vibe-curator';

export interface Rival {
  id: RivalId;
  name: string;
  tagline: string;
  /** Short reason shown when this rival takes a song. */
  pickReason: (song: Song) => string;
  /** Higher is better. Pure function of the song, the slot and what the rival already has. */
  rate: (song: Song, slot: DraftSlot, owned: DraftedTrack[]) => number;
}

const ownedArtistPenalty = (song: Song, owned: DraftedTrack[]) =>
  owned.some((track) => track.song.artist === song.artist) ? 25 : 0;

const slotFit = (song: Song, slot: DraftSlot) => song.slotAffinity[slot.id] ?? 50;
const energyFit = (song: Song, slot: DraftSlot) => 100 - Math.min(100, Math.abs(song.energy - slot.targetEnergy.ideal) * 2);

export const RIVALS: Record<RivalId, Rival> = {
  hitmaker: {
    id: 'hitmaker',
    name: 'The Hitmaker',
    tagline: 'Chases the biggest songs on the board.',
    pickReason: (song) => `${song.title} is the biggest name left, so the Hitmaker grabbed it.`,
    rate: (song, slot, owned) =>
      song.recognition * 0.55 + song.impact * 0.3 + slotFit(song, slot) * 0.15 - ownedArtistPenalty(song, owned),
  },
  'crate-digger': {
    id: 'crate-digger',
    name: 'Crate Digger',
    tagline: 'Skips the obvious hit for the deep cut critics love.',
    pickReason: (song) => `Crate Digger went for ${song.title}: less famous, more respected.`,
    rate: (song, slot, owned) =>
      (song.acclaim ?? song.impact) * 0.5 + (100 - song.recognition) * 0.3 + slotFit(song, slot) * 0.2 - ownedArtistPenalty(song, owned),
  },
  'vibe-curator': {
    id: 'vibe-curator',
    name: 'Vibe Curator',
    tagline: 'Picks whatever fits the moment and the flow.',
    pickReason: (song) => `${song.title} fit this spot's energy best, so the Vibe Curator took it.`,
    rate: (song, slot, owned) =>
      energyFit(song, slot) * 0.5 + slotFit(song, slot) * 0.4 + song.impact * 0.1 - ownedArtistPenalty(song, owned),
  },
};

export const RIVAL_IDS: RivalId[] = ['hitmaker', 'crate-digger', 'vibe-curator'];

export function isRivalId(value: unknown): value is RivalId {
  return typeof value === 'string' && (RIVAL_IDS as string[]).includes(value);
}

export function dealRival(seedKey: string): RivalId {
  const random = createSeededRandom(`${seedKey}::rival`);
  return RIVAL_IDS[Math.floor(random() * RIVAL_IDS.length)] ?? 'hitmaker';
}

/** The rival picks first on every second round (rounds 2, 4, 6...). */
export function isRivalFirstRound(roundIndex: number): boolean {
  return roundIndex % 2 === 1;
}

export function rivalPick(rivalId: RivalId, options: Song[], slot: DraftSlot, owned: DraftedTrack[]): Song | null {
  const rival = RIVALS[rivalId] ?? RIVALS.hitmaker;
  let best: Song | null = null;
  let bestScore = -Infinity;
  for (const song of options) {
    const score = rival.rate(song, slot, owned);
    if (score > bestScore || (score === bestScore && best && song.id < best.id)) {
      best = song;
      bestScore = score;
    }
  }
  return best;
}
