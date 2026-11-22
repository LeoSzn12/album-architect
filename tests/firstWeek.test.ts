import { describe, it } from 'node:test';
import assert from 'node:assert';

import { SONG_LIBRARY } from '../src/data/songs.ts';
import { DRAFT_SLOTS, ALBUM_SLOTS } from '../src/data/slots.ts';
import { generateCandidatePool } from '../src/lib/candidateSelector.ts';
import type { DraftedTrack, Song } from '../src/types/draft.ts';
import { simulateRelease, qualityUnits } from '../src/lib/firstWeek/releaseSim.ts';
import { WEEKLY_TRENDS, getWeeklyTrend } from '../src/lib/firstWeek/weeklyTrend.ts';
import { RULE_CARDS, RULE_CARD_IDS, dealRuleCards, pickMysteryRound, evaluateRuleCards } from '../src/lib/firstWeek/ruleCards.ts';
import { RIVAL_IDS, dealRival, isRivalFirstRound, rivalPick } from '../src/lib/firstWeek/rivals.ts';
import { milestoneFor, formatUnits, LADDER_MILESTONES } from '../src/lib/firstWeek/ladder.ts';
import { CATEGORIES, categoryPool, relabelSlotsForCategory } from '../src/lib/firstWeek/categories.ts';
import { CATEGORY_SONGS } from '../src/data/categorySongs.ts';
import { formatFirstWeekShare, dailySparkline } from '../src/lib/firstWeek/shareText.ts';
import { parseChallengeInvite, buildChallengeInvite } from '../src/lib/challengeInvite.ts';

function album(songs: Song[]): DraftedTrack[] {
  return songs.map((song, index) => ({ slot: DRAFT_SLOTS[index % DRAFT_SLOTS.length], song, roundDrafted: index + 1, isWildcard: false }));
}

const tracks = album(SONG_LIBRARY.slice(0, 7));
const baseInput = {
  tracks,
  evaluation: { overallScore: 8.2, rawScore: 8.2 },
  ruleCards: dealRuleCards('TEST-SEED'),
  mysteryRoundIndex: null,
  trend: WEEKLY_TRENDS[0],
  seedKey: 'TEST-SEED',
};

describe('First Week release simulation', () => {
  it('is deterministic for the same album and seed', () => {
    assert.deepStrictEqual(simulateRelease(baseInput), simulateRelease(baseInput));
  });

  it('lands inside its range and the days add up', () => {
    for (const seedKey of ['A', 'B', 'C', 'D', 'E']) {
      const result = simulateRelease({ ...baseInput, seedKey });
      assert.ok(result.finalUnits >= result.low && result.finalUnits <= result.high, `${seedKey}: ${result.finalUnits}`);
      assert.strictEqual(result.dailyUnits.length, 7);
      assert.strictEqual(result.dailyUnits.reduce((sum, units) => sum + units, 0), result.finalUnits);
      assert.ok(result.dailyUnits[0] === Math.max(...result.dailyUnits), 'Friday is the biggest day');
    }
  });

  it('sells more for a better album', () => {
    const weak = simulateRelease({ ...baseInput, evaluation: { overallScore: 4, rawScore: 4 } });
    const strong = simulateRelease({ ...baseInput, evaluation: { overallScore: 9.5, rawScore: 9.5 } });
    assert.ok(strong.projected > weak.projected);
    assert.ok(qualityUnits(10) > qualityUnits(5));
  });

  it('shows the repeat-artist penalty as its own reason', () => {
    const result = simulateRelease({ ...baseInput, evaluation: { overallScore: 6.5, rawScore: 8.5 } });
    assert.ok(result.reasons.some((reason) => reason.label === 'Same artist more than once' && reason.units < 0));
  });

  it('picks a milestone and the next one', () => {
    assert.strictEqual(milestoneFor(0).current.label, LADDER_MILESTONES[0].label);
    const { current, next } = milestoneFor(300_000);
    assert.strictEqual(current.label, 'Big debut');
    assert.strictEqual(next?.label, 'Number 1 contender');
    assert.strictEqual(milestoneFor(5_000_000).next, null);
    assert.strictEqual(formatUnits(312_000), '312K');
    assert.strictEqual(formatUnits(1_250_000), '1.25M');
  });

  it('rotates the weekly trend by week', () => {
    const friday = new Date(Date.UTC(2026, 10, 20));
    const nextFriday = new Date(Date.UTC(2026, 10, 27));
    assert.notStrictEqual(getWeeklyTrend(friday).id, getWeeklyTrend(nextFriday).id);
    assert.strictEqual(getWeeklyTrend(friday).id, getWeeklyTrend(new Date(Date.UTC(2026, 10, 26))).id);
  });
});

describe('First Week rule cards', () => {
  it('never deals two mood cards and always deals one or two', () => {
    for (let index = 0; index < 300; index += 1) {
      const cards = dealRuleCards(`SEED-${index}`);
      assert.ok(cards.length >= 1 && cards.length <= 2);
      assert.ok(cards.filter((id) => id.startsWith('mood-')).length <= 1);
      assert.strictEqual(new Set(cards).size, cards.length);
    }
  });

  it('only hides a round for Snippet Round, and never the first round', () => {
    assert.strictEqual(pickMysteryRound('X', ['no-repeats'], 7), null);
    for (let index = 0; index < 100; index += 1) {
      const round = pickMysteryRound(`S-${index}`, ['snippet-round'], 7);
      assert.ok(round !== null && round >= 1 && round < 7);
    }
  });

  it('evaluates every card without throwing', () => {
    const results = evaluateRuleCards(RULE_CARD_IDS, tracks, 2);
    assert.strictEqual(results.length, RULE_CARD_IDS.length);
    for (const { outcome } of results) {
      assert.ok(Math.abs(outcome.unitShare) <= 0.1);
      assert.ok(outcome.note.length > 0);
    }
  });

  it('No Repeats catches a repeated artist', () => {
    const repeat = album([SONG_LIBRARY[0], SONG_LIBRARY[0]]);
    assert.strictEqual(RULE_CARDS['no-repeats'].evaluate(repeat, { mysteryRoundIndex: null }).met, false);
  });
});

describe('First Week rivals', () => {
  it('deals a known rival deterministically', () => {
    assert.ok(RIVAL_IDS.includes(dealRival('ABC')));
    assert.strictEqual(dealRival('ABC'), dealRival('ABC'));
  });

  it('goes first on every second round', () => {
    assert.deepStrictEqual([0, 1, 2, 3].map(isRivalFirstRound), [false, true, false, true]);
  });

  it('picks from the pool and prefers an artist it does not own yet', () => {
    const options = SONG_LIBRARY.slice(0, 5);
    for (const id of RIVAL_IDS) {
      const pick = rivalPick(id, options, DRAFT_SLOTS[1], []);
      assert.ok(pick && options.some((song) => song.id === pick.id));
    }
    assert.strictEqual(rivalPick('hitmaker', [], DRAFT_SLOTS[0], []), null);
  });
});

describe('First Week categories', () => {
  it('gives category songs unique ids that never clash with the main catalog', () => {
    const mainIds = new Set(SONG_LIBRARY.map((song) => song.id));
    const ids = CATEGORY_SONGS.map((song) => song.id);
    assert.strictEqual(new Set(ids).size, ids.length);
    assert.ok(ids.every((id) => !mainIds.has(id)));
  });

  it('fills every slot with five songs from the right category', () => {
    for (const theme of ['genre-country', 'genre-edm', 'genre-bollywood', 'year-2025'] as const) {
      const pool = categoryPool(theme, SONG_LIBRARY) ?? [];
      const allowed = new Set(pool.map((song) => song.id));
      for (const slot of [...DRAFT_SLOTS, ...ALBUM_SLOTS]) {
        const options = generateCandidatePool({
          slotId: slot.id, era: 'all', seed: 'CAT-TEST', rerollIndex: 0,
          draftedSongIds: [], draftedArtists: [], recentlyShownSongIds: [], recentlyShownArtists: [], theme,
        }, 5);
        assert.strictEqual(options.length, 5, `${theme} ${slot.id}`);
        assert.ok(options.every((song) => allowed.has(song.id)), `${theme} ${slot.id} pulled an off-category song`);
      }
    }
  });

  it('keeps category songs out of the standard draft', () => {
    const options = generateCandidatePool({
      slotId: 'statement-banger', era: 'all', seed: 'STD', rerollIndex: 0,
      draftedSongIds: [], draftedArtists: [], recentlyShownSongIds: [], recentlyShownArtists: [], theme: 'standard',
    }, 5);
    assert.ok(options.every((song) => !song.id.startsWith('cat-')));
  });

  it('renames hip-hop slot names for other genres only', () => {
    const country = relabelSlotsForCategory(DRAFT_SLOTS, 'genre-country');
    assert.ok(country.every((slot) => !/R&B|Club/.test(slot.name)));
    assert.deepStrictEqual(relabelSlotsForCategory(DRAFT_SLOTS, 'genre-hiphop'), DRAFT_SLOTS);
  });

  it('round-trips every category through a challenge link', () => {
    for (const { id } of CATEGORIES) {
      const link = buildChallengeInvite('https://example.com', { seed: 'ABC123', mode: 'draft', difficulty: 'standard', era: 'all', theme: id });
      assert.strictEqual(parseChallengeInvite(link)?.theme, id);
    }
  });
});

describe('First Week share text', () => {
  it('reports the number, milestone and rival result', () => {
    const release = simulateRelease(baseInput);
    const text = formatFirstWeekShare({ release, rival: { name: 'The Hitmaker', units: 1 }, label: "Today's Drop", url: 'https://example.com' });
    assert.ok(text.includes(formatUnits(release.finalUnits)));
    assert.ok(text.includes(release.milestone.label));
    assert.ok(text.includes('Beat The Hitmaker'));
    assert.ok(text.endsWith('https://example.com'));
    assert.strictEqual(dailySparkline([10, 5, 0]).length, 3);
  });
});
