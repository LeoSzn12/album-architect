import assert from 'node:assert';
import { test, describe } from 'node:test';
import { generateCandidatePool } from '../src/lib/candidateSelector.ts';
import { SONG_LIBRARY } from '../src/data/songs.ts';
import type { CandidateContext } from '../src/types/draft.ts';
import { EP_SLOTS, ALBUM_SLOTS } from '../src/data/slots.ts';
import { generateEraSequence } from '../src/lib/eraSequence.ts';

describe('Catalog & Candidate Selector Simulation Tests (1,000 Drafts)', () => {
  test('Simulate 1,000 solo drafts (EP & Full Album modes) and measure song exposure distribution and overlap', () => {
    const TOTAL_DRAFTS = 1000;
    const songAppearanceCount: Record<string, number> = {};
    const artistAppearanceCount: Record<string, number> = {};

    SONG_LIBRARY.forEach((s) => {
      songAppearanceCount[s.id] = 0;
      artistAppearanceCount[s.artist] = 0;
    });

    let recentlyShownSongIds: string[] = [];
    let recentlyShownArtists: string[] = [];

    const epDraftImpressions: string[][] = [];
    let totalCardImpressions = 0;

    for (let draft = 0; draft < TOTAL_DRAFTS; draft++) {
      // Alternate between EP mode (7 slots) and Full Album mode (14 slots)
      const slots = draft % 2 === 0 ? EP_SLOTS : ALBUM_SLOTS;
      const eraSequence = generateEraSequence(slots, null);
      const currentDraftSongs: string[] = [];
      const draftedSongIds: string[] = [];
      const draftedArtists: string[] = [];

      for (let roundIdx = 0; roundIdx < slots.length; roundIdx++) {
        const slot = slots[roundIdx];
        const assignedEra = eraSequence[roundIdx] ?? 'all';

        const context: CandidateContext = {
          slotId: slot.id,
          era: assignedEra,
          seed: null,
          rerollIndex: draft * 20 + roundIdx,
          draftedSongIds,
          draftedArtists,
          recentlyShownSongIds,
          recentlyShownArtists,
        };

        const candidates = generateCandidatePool(context, 4);

        for (const song of candidates) {
          songAppearanceCount[song.id] = (songAppearanceCount[song.id] || 0) + 1;
          artistAppearanceCount[song.artist] = (artistAppearanceCount[song.artist] || 0) + 1;
          currentDraftSongs.push(song.id);
          totalCardImpressions++;
        }

        // Simulate player drafting 1 song per round
        const picked = candidates[0];
        draftedSongIds.push(picked.id);
        draftedArtists.push(picked.artist);
      }

      if (slots === EP_SLOTS) {
        epDraftImpressions.push(currentDraftSongs);
      }

      // Update recently shown state (80 IDs / 40 artists)
      recentlyShownSongIds = Array.from(new Set([...currentDraftSongs, ...recentlyShownSongIds])).slice(0, 80);
      recentlyShownArtists = Array.from(
        new Set([
          ...currentDraftSongs.map((id) => SONG_LIBRARY.find((s) => s.id === id)?.artist || ''),
          ...recentlyShownArtists,
        ])
      ).slice(0, 40);
    }

    // 1. Overlap analysis between consecutive EP drafts (28 cards)
    const overlaps: number[] = [];
    for (let i = 1; i < epDraftImpressions.length; i++) {
      const prevSet = new Set(epDraftImpressions[i - 1]);
      const current = epDraftImpressions[i];
      const overlap = current.filter((id) => prevSet.has(id)).length;
      overlaps.push(overlap);
    }

    overlaps.sort((a, b) => a - b);
    const avgOverlap = overlaps.reduce((a, b) => a + b, 0) / overlaps.length;
    const medianOverlap = overlaps[Math.floor(overlaps.length / 2)];
    const p90Overlap = overlaps[Math.floor(overlaps.length * 0.9)];

    // 2. Top surfaced songs & artists
    const topSongs = Object.entries(songAppearanceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => {
        const song = SONG_LIBRARY.find((s) => s.id === id);
        return `${song?.title} by ${song?.artist} (${count} impressions)`;
      });

    const topArtists = Object.entries(artistAppearanceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([artist, count]) => `${artist} (${count} impressions)`);

    const neverAppeared = Object.entries(songAppearanceCount).filter(([, count]) => count === 0);

    console.log('\n--- SIMULATION RESULTS (1,000 Solo Drafts: EP + Album) ---');
    console.log(`Total Drafts Run: ${TOTAL_DRAFTS}`);
    console.log(`Total Card Impressions: ${totalCardImpressions}`);
    console.log(`Songs Never Surfaced: ${neverAppeared.length}`);
    console.log(`\nConsecutive EP Draft Overlap (out of 28 cards):`);
    console.log(`  - Average Overlap: ${avgOverlap.toFixed(1)} cards (${((avgOverlap / 28) * 100).toFixed(1)}%)`);
    console.log(`  - Median Overlap: ${medianOverlap} cards`);
    console.log(`  - 90th Percentile Overlap: ${p90Overlap} cards`);
    console.log(`\nTop 10 Surfaced Songs:`);
    topSongs.forEach((s, idx) => console.log(`  ${idx + 1}. ${s}`));
    console.log(`\nTop 10 Surfaced Artists:`);
    topArtists.forEach((a, idx) => console.log(`  ${idx + 1}. ${a}`));

    // Assertions
    assert.strictEqual(
      neverAppeared.length,
      0,
      `All catalog songs should surface at least once during 1,000 drafts.`
    );

    assert.ok(
      avgOverlap <= 12.5,
      `Average overlap between consecutive solo EP drafts should be <= 12.5 cards (Target: 5–8 cards). Got ${avgOverlap.toFixed(1)} cards.`
    );
  });
});
