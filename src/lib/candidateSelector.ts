import type { Song, CandidateContext, CandidateDebugInfo, SlotId } from '../types/draft.ts';
import { SONG_LIBRARY, filterByEra } from '../data/songs.ts';

function createPrng(seedStr: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  }
  return function () {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    const t = (h += h << 5) >>> 0;
    return t / 4294967296;
  };
}

/**
 * Calculates slot affinity for a song (0–100 scale).
 */
export function getSlotAffinity(song: Song, slotId: SlotId): number {
  if (song.slotAffinity && typeof song.slotAffinity[slotId] === 'number') {
    return song.slotAffinity[slotId]!;
  }
  if (song.slots.includes(slotId)) {
    return 75;
  }
  return 40;
}

/**
 * Strict eligibility tiers for candidate pools.
 */
export function getEligiblePool(slotId: SlotId, pool: Song[]): { tier1: Song[]; tier2: Song[]; tier3: Song[]; tier4: Song[] } {
  const tier1: Song[] = [];
  const tier2: Song[] = [];
  const tier3: Song[] = [];
  const tier4: Song[] = [];

  for (const song of pool) {
    const affinity = getSlotAffinity(song, slotId);

    if (affinity >= 70) {
      tier1.push(song);
    } else if (affinity >= 60) {
      tier2.push(song);
    } else if (song.slots.includes(slotId)) {
      tier3.push(song);
    } else if (affinity >= 40) {
      tier4.push(song);
    }
  }

  return { tier1, tier2, tier3, tier4 };
}

/**
 * Applies recent exposure penalty multiplier for solo mode drafts.
 * Tuned to achieve 5–8 repeated cards target between consecutive drafts.
 */
export function getRecentExposurePenalty(song: Song, context: CandidateContext): number {
  if (context.seed !== null) {
    // Shared challenge seed: 100% deterministic, no local history penalty
    return 1.0;
  }

  const { recentlyShownSongIds, recentlyShownArtists } = context;
  const songIdx = recentlyShownSongIds.indexOf(song.id);

  if (songIdx !== -1) {
    if (songIdx < 28) return 0.001; // Shown in immediately preceding draft
    if (songIdx < 56) return 0.05;  // Shown 2 drafts ago
    return 0.25;                   // Shown 3 drafts ago
  }

  if (recentlyShownArtists.includes(song.artist)) {
    return 0.25;
  }

  return 1.0;
}

/**
 * Enforces Cinematic Intro quality & credibility requirements.
 * Replaces candidates in a loop until requirements (at least 2 actual openers and
 * 2 high recognition/impact tracks) are satisfied or replacements run out.
 */
function enforceCinematicIntroRequirements(selected: Song[], pool: Song[], context: CandidateContext, prng: () => number): Song[] {
  const result = [...selected];

  let countActualOpeners = result.filter((s) => s.isActualAlbumOpener).length;
  let countHighRecognized = result.filter((s) => s.recognition >= 65 || s.impact >= 65).length;

  const replacements = pool
    .filter((s) => !result.some((r) => r.id === s.id) && getSlotAffinity(s, 'cinematic-intro') >= 60)
    .map((s) => {
      const pen = getRecentExposurePenalty(s, context);
      const jitter = 0.7 + prng() * 0.6;
      const score = ((s.isActualAlbumOpener ? 40 : 0) + s.recognition + s.impact) * pen * jitter;
      return { song: s, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.song);

  let replacementIdx = 0;

  while ((countActualOpeners < 2 || countHighRecognized < 2) && replacementIdx < replacements.length) {
    let targetIdx = result.findIndex((s) => !s.isActualAlbumOpener && s.recognition < 65);
    if (targetIdx === -1) {
      targetIdx = result.findIndex((s) => !s.isActualAlbumOpener);
    }
    if (targetIdx === -1) break;

    result[targetIdx] = replacements[replacementIdx++];
    countActualOpeners = result.filter((s) => s.isActualAlbumOpener).length;
    countHighRecognized = result.filter((s) => s.recognition >= 65 || s.impact >= 65).length;
  }

  return result;
}

/**
 * Enforces Cinematic Outro quality & credibility requirements.
 * Replaces candidates in a loop until requirements (at least 2 actual outros and
 * 2 high recognition/impact tracks) are satisfied or replacements run out.
 */
function enforceCinematicOutroRequirements(selected: Song[], pool: Song[], context: CandidateContext, prng: () => number): Song[] {
  const result = [...selected];

  let countActualOutros = result.filter((s) => s.isActualAlbumOutro).length;
  let countHighRecognized = result.filter((s) => s.recognition >= 65 || s.impact >= 65).length;

  const replacements = pool
    .filter((s) => !result.some((r) => r.id === s.id) && getSlotAffinity(s, 'cinematic-outro') >= 50)
    .map((s) => {
      const pen = getRecentExposurePenalty(s, context);
      const jitter = 0.7 + prng() * 0.6;
      const score = ((s.isActualAlbumOutro ? 40 : 0) + s.recognition + s.impact) * pen * jitter;
      return { song: s, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.song);

  let replacementIdx = 0;

  while ((countActualOutros < 2 || countHighRecognized < 2) && replacementIdx < replacements.length) {
    let targetIdx = result.findIndex((s) => !s.isActualAlbumOutro && s.recognition < 65);
    if (targetIdx === -1) {
      targetIdx = result.findIndex((s) => !s.isActualAlbumOutro);
    }
    if (targetIdx === -1) break;

    result[targetIdx] = replacements[replacementIdx++];
    countActualOutros = result.filter((s) => s.isActualAlbumOutro).length;
    countHighRecognized = result.filter((s) => s.recognition >= 65 || s.impact >= 65).length;
  }

  return result;
}

/**
 * Strategic 4-Bucket Candidate Selector.
 */
export function generateCandidatePool(context: CandidateContext, count: number = 4): Song[] {
  const { slotId, era, seed, rerollIndex, draftedSongIds, draftedArtists } = context;

  // 1. Initial era filtering
  let pool = filterByEra(SONG_LIBRARY, era);

  // Fallback to full library if era pool is completely empty
  if (pool.length === 0) {
    pool = SONG_LIBRARY;
  }

  // 2. Strict eligibility hierarchy
  const { tier1, tier2, tier3, tier4 } = getEligiblePool(slotId, pool);

  let eligible = [...tier1, ...tier2, ...tier3];
  if (eligible.length < count) {
    eligible = [...eligible, ...tier4];
  }
  if (eligible.length < count) {
    // Global fallback to ensure minimum count
    eligible = SONG_LIBRARY.filter((s) => getSlotAffinity(s, slotId) >= 40);
  }

  // Exclude songs already drafted in current playthrough
  const undraftedEligible = eligible.filter((s) => !draftedSongIds.includes(s.id));
  const candidatePool = undraftedEligible.length >= count ? undraftedEligible : eligible;

  // 3. PRNG setup
  const prngKey = seed
    ? `${seed}:${slotId}:${era}:reroll-${rerollIndex}`
    : `solo:${slotId}:${context.recentlyShownSongIds.length}:${rerollIndex}:${Math.random()}`;
  const prng = createPrng(prngKey);

  // 4. Pre-compute sampling weights & PRNG jitter BEFORE sorting (deterministic sort order)
  const scored = candidatePool.map((song) => {
    const affinity = getSlotAffinity(song, slotId);
    const recentPenalty = getRecentExposurePenalty(song, context);
    const jitter = 0.7 + prng() * 0.6; // Computed once per candidate in array order

    const baseWeight = affinity * recentPenalty;
    const finalWeight = baseWeight * (draftedArtists.includes(song.artist) ? 0.5 : 1.0);

    return {
      song,
      affinity,
      recentPenalty,
      jitter,
      baseWeight,
      finalWeight,
      headlinerScore: (song.recognition + song.impact) * recentPenalty * jitter,
      bestFitScore: affinity * recentPenalty * jitter,
      altScore: finalWeight * jitter,
    };
  });

  // 5. Select 4 strategic candidates (Headliner, Best Fit, Alternative Style, Sleeper)
  const selected: Song[] = [];
  const usedArtists = new Set<string>();
  const usedArchetypes = new Set<string>();

  // Bucket 1: Headliner
  const headlinerCandidates = [...scored].sort((a, b) => b.headlinerScore - a.headlinerScore);
  const headliner = headlinerCandidates.find((c) => c.affinity >= 60) || headlinerCandidates[0];
  if (headliner) {
    selected.push(headliner.song);
    usedArtists.add(headliner.song.artist);
    headliner.song.archetypes.forEach((arch) => usedArchetypes.add(arch));
  }

  // Bucket 2: Best Fit
  const bestFitCandidates = [...scored].sort((a, b) => b.bestFitScore - a.bestFitScore);
  const bestFit = bestFitCandidates.find((c) => !selected.some((s) => s.id === c.song.id) && !usedArtists.has(c.song.artist)) ||
                  bestFitCandidates.find((c) => !selected.some((s) => s.id === c.song.id));
  if (bestFit) {
    selected.push(bestFit.song);
    usedArtists.add(bestFit.song.artist);
    bestFit.song.archetypes.forEach((arch) => usedArchetypes.add(arch));
  }

  // Bucket 3: Alternative Style
  const altCandidates = [...scored].sort((a, b) => b.altScore - a.altScore).filter(
    (c) =>
      !selected.some((s) => s.id === c.song.id) &&
      !c.song.archetypes.some((arch) => usedArchetypes.has(arch))
  );

  const alt = altCandidates.find((c) => !usedArtists.has(c.song.artist)) ||
              scored.find((c) => !selected.some((s) => s.id === c.song.id) && !usedArtists.has(c.song.artist)) ||
              scored.find((c) => !selected.some((s) => s.id === c.song.id));
  if (alt) {
    selected.push(alt.song);
    usedArtists.add(alt.song.artist);
    alt.song.archetypes.forEach((arch) => usedArchetypes.add(arch));
  }

  // Bucket 4: Sleeper
  const sleeperCandidates = [...scored].sort((a, b) => b.altScore - a.altScore).filter(
    (c) =>
      !selected.some((s) => s.id === c.song.id) &&
      (c.song.recognition <= 85 || c.song.archetypes.includes('value-pick'))
  );

  const sleeper = sleeperCandidates.find((c) => !usedArtists.has(c.song.artist)) ||
                  scored.find((c) => !selected.some((s) => s.id === c.song.id));
  if (sleeper) {
    selected.push(sleeper.song);
  }

  // Fill up if fewer than count
  const sortedScored = [...scored].sort((a, b) => b.altScore - a.altScore);
  for (const c of sortedScored) {
    if (selected.length >= count) break;
    if (!selected.some((s) => s.id === c.song.id)) {
      selected.push(c.song);
    }
  }

  // 6. Enforce slot-specific rules
  let finalPool = selected;
  if (slotId === 'cinematic-intro') {
    finalPool = enforceCinematicIntroRequirements(selected, candidatePool, context, prng);
  } else if (slotId === 'cinematic-outro') {
    finalPool = enforceCinematicOutroRequirements(selected, candidatePool, context, prng);
  }

  // 7. Attach development CandidateDebugInfo
  const buckets: ('headliner' | 'best-fit' | 'alternative' | 'sleeper')[] = ['headliner', 'best-fit', 'alternative', 'sleeper'];
  return finalPool.slice(0, count).map((song, idx) => {
    const affinity = getSlotAffinity(song, slotId);
    const recentPenalty = getRecentExposurePenalty(song, context);

    const debugInfo: CandidateDebugInfo = {
      bucket: buckets[idx] || 'headliner',
      slotAffinity: affinity,
      selectionWeight: affinity * recentPenalty,
      recentlyShownPenalty: recentPenalty,
      reasons: [`Affinity: ${affinity}`, `RecentPenalty: ${recentPenalty}`],
    };

    return {
      ...song,
      debugInfo,
    };
  });
}
