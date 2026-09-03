import { describe, it } from 'node:test';
import assert from 'node:assert';

import { SONG_LIBRARY, filterByChallengeTheme } from '../src/data/songs.ts';
import {
  getSongBudgetPrice,
  calculateRemainingBudget,
  canAffordSong,
  computeBudgetReport,
  INITIAL_BUDGET,
} from '../src/lib/budgetEngine.ts';
import {
  getDailySeed,
  getDailyTheme,
  calculateDailyStreak,
} from '../src/lib/dailyDrop.ts';
import {
  detectSynergies,
  computeCrowdHype,
} from '../src/lib/synergyEngine.ts';
import { BUDGET_SLOTS } from '../src/data/slots.ts';
import type { Song, DraftedTrack } from '../src/types/draft.ts';

describe('1. The $15 Aux Budget Draft Mode Tests', () => {
  it('budget slots has exactly 5 curated positional slots', () => {
    assert.strictEqual(BUDGET_SLOTS.length, 5);
    assert.strictEqual(BUDGET_SLOTS[0].id, 'cinematic-intro');
    assert.strictEqual(BUDGET_SLOTS[4].id, 'cinematic-outro');
  });

  it('determines song prices from $1 to $5 based on recognition and impact', () => {
    for (const song of SONG_LIBRARY) {
      const price = getSongBudgetPrice(song);
      assert.ok(price >= 1 && price <= 5, `Price for ${song.title} should be between $1 and $5, got ${price}`);
    }

    // High impact/recognition megastars should be $4 or $5
    const megastar = SONG_LIBRARY.find((s) => s.recognition >= 92 && s.impactScore >= 90);
    if (megastar) {
      assert.ok(getSongBudgetPrice(megastar) >= 4);
    }
  });

  it('calculates remaining budget and affordability accurately', () => {
    const song1: Song = { ...SONG_LIBRARY[0], budgetCost: 4 };
    const song2: Song = { ...SONG_LIBRARY[1], budgetCost: 3 };

    const drafted: DraftedTrack[] = [
      { slot: BUDGET_SLOTS[0], song: song1, roundDrafted: 1, isWildcard: false },
      { slot: BUDGET_SLOTS[1], song: song2, roundDrafted: 2, isWildcard: false },
    ];

    const remaining = calculateRemainingBudget(drafted, INITIAL_BUDGET);
    assert.strictEqual(remaining, 15 - 4 - 3); // 8

    const expensiveSong: Song = { ...SONG_LIBRARY[2], budgetCost: 5 };
    const cheapSong: Song = { ...SONG_LIBRARY[3], budgetCost: 2 };
    const tightBudget = 3;

    assert.strictEqual(canAffordSong(expensiveSong, tightBudget), false);
    assert.strictEqual(canAffordSong(cheapSong, tightBudget), true);
  });

  it('computes complete budget efficiency report with rating', () => {
    const drafted: DraftedTrack[] = BUDGET_SLOTS.map((slot, i) => ({
      slot,
      song: { ...SONG_LIBRARY[i], budgetCost: 3 },
      roundDrafted: i + 1,
      isWildcard: false,
    }));

    const report = computeBudgetReport(drafted, 8.8, 15);
    assert.strictEqual(report.totalSpent, 15);
    assert.strictEqual(report.remainingBudget, 0);
    assert.ok(report.efficiencyScore > 0 && report.efficiencyScore <= 100);
    assert.ok(typeof report.executiveRating === 'string');
  });
});

describe('2. The Daily Drop & Streak Tests', () => {
  it('generates a deterministic daily seed based on date', () => {
    const fixedDate = new Date('2026-09-03T12:00:00Z');
    const seed = getDailySeed(fixedDate);
    assert.strictEqual(seed, 'DAILY-2026-09-03');
  });

  it('rotates 7 curated daily themes by day of week', () => {
    const sunday = new Date('2026-08-30T12:00:00Z'); // Sunday
    const themeSun = getDailyTheme(sunday);
    assert.strictEqual(themeSun.dayOfWeek, 0);
    assert.ok(themeSun.title.includes('Soul') || themeSun.subtitle.includes('Sunday'));

    const monday = new Date('2026-08-31T12:00:00Z'); // Monday
    const themeMon = getDailyTheme(monday);
    assert.strictEqual(themeMon.dayOfWeek, 1);
  });

  it('increments streak on consecutive daily completions', () => {
    // Yesterday completed, today completed -> streak increments
    const yesterday = 'DAILY-2026-09-02';
    const today = 'DAILY-2026-09-03';
    const result = calculateDailyStreak(yesterday, 3, today);
    assert.strictEqual(result.newStreak, 4);
    assert.strictEqual(result.streakBroken, false);
  });

  it('preserves streak when played multiple times on same day', () => {
    const today = 'DAILY-2026-09-03';
    const result = calculateDailyStreak(today, 5, today);
    assert.strictEqual(result.newStreak, 5);
    assert.strictEqual(result.streakBroken, false);
  });

  it('resets streak to 1 if user missed a day', () => {
    const threeDaysAgo = 'DAILY-2026-08-31';
    const today = 'DAILY-2026-09-03';
    const result = calculateDailyStreak(threeDaysAgo, 10, today);
    assert.strictEqual(result.newStreak, 1);
    assert.strictEqual(result.streakBroken, true);
  });
});

describe('3. Secret Synergy & Aux Crowd Hype Tests', () => {
  it('detects producer dynasty when 2+ songs share a legendary producer', () => {
    const metroSong1: Song = { ...SONG_LIBRARY[0], producerTags: ['Metro Boomin'] };
    const metroSong2: Song = { ...SONG_LIBRARY[1], producerTags: ['Metro Boomin'] };

    const drafted: DraftedTrack[] = [
      { slot: BUDGET_SLOTS[0], song: metroSong1, roundDrafted: 1, isWildcard: false },
      { slot: BUDGET_SLOTS[1], song: metroSong2, roundDrafted: 2, isWildcard: false },
    ];

    const synergies = detectSynergies(drafted);
    const metroSynergy = synergies.find((s) => s.id === 'producer-metro-boomin');
    assert.ok(metroSynergy, 'Metro Boomin synergy should be detected');
    assert.strictEqual(metroSynergy.category, 'producer');
    assert.ok(metroSynergy.bonusPoints > 0);
  });

  it('detects Silk BPM blend when consecutive tracks are within 3 BPM', () => {
    const song1: Song = { ...SONG_LIBRARY[0], bpm: 128 };
    const song2: Song = { ...SONG_LIBRARY[1], bpm: 130 }; // delta = 2

    const drafted: DraftedTrack[] = [
      { slot: BUDGET_SLOTS[0], song: song1, roundDrafted: 1, isWildcard: false },
      { slot: BUDGET_SLOTS[1], song: song2, roundDrafted: 2, isWildcard: false },
    ];

    const synergies = detectSynergies(drafted);
    const bpmSynergy = synergies.find((s) => s.id === 'silk-bpm-blend');
    assert.ok(bpmSynergy, 'Silk BPM Blend synergy should be detected');
    assert.strictEqual(bpmSynergy.category, 'bpm');
  });

  it('computes live Aux Crowd Hype gauge (0-100%) and reaction quotes', () => {
    const drafted: DraftedTrack[] = BUDGET_SLOTS.map((slot, i) => ({
      slot,
      song: SONG_LIBRARY[i],
      roundDrafted: i + 1,
      isWildcard: false,
    }));

    const synergies = detectSynergies(drafted);
    const hype = computeCrowdHype(drafted, synergies);

    assert.ok(hype.score >= 15 && hype.score <= 100);
    assert.ok(typeof hype.status === 'string');
    assert.ok(typeof hype.reactionQuote === 'string');
    assert.ok(hype.reactionQuote.length > 5);
  });
});

describe('4. Era & Genre Gauntlets Tests', () => {
  it('filters library strictly for 90s Golden Era', () => {
    const nineties = filterByChallengeTheme(SONG_LIBRARY, 'era-90s');
    assert.ok(nineties.length >= 8, `Should have at least 8 90s songs, found ${nineties.length}`);
    for (const song of nineties) {
      assert.ok(song.year !== undefined && song.year < 2000, `${song.title} (${song.year}) is not 90s`);
    }
  });

  it('filters library strictly for Class of 2016 Time Capsule', () => {
    const class2016 = filterByChallengeTheme(SONG_LIBRARY, 'year-2016');
    assert.ok(class2016.length >= 7, `Should have at least 7 2016 songs, found ${class2016.length}`);
    for (const song of class2016) {
      assert.strictEqual(song.year, 2016, `${song.title} (${song.year}) is not 2016`);
    }
  });

  it('filters library strictly for Hip-Hop and R&B genres', () => {
    const hiphop = filterByChallengeTheme(SONG_LIBRARY, 'genre-hiphop');
    assert.ok(hiphop.length > 20);

    const rnb = filterByChallengeTheme(SONG_LIBRARY, 'genre-rnb');
    assert.ok(rnb.length >= 10);
    for (const song of rnb) {
      const isRnb = song.genre.toLowerCase().includes('r&b') || song.genre.toLowerCase().includes('soul') || song.slots.includes('late-night-rnb');
      assert.ok(isRnb, `${song.title} (${song.genre}) should be R&B/Soul`);
    }
  });
});
