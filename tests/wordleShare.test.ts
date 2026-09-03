import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildWordleShareData, formatWordleShareText } from '../src/lib/wordleShare.ts';
import type { DraftedTrack, EvaluationResult, Song, DraftSlot } from '../src/types/draft.ts';

function makeMockSong(overrides: Partial<Song> = {}): Song {
  return {
    id: 'test-song',
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    year: 2020,
    genre: 'Hip-Hop',
    typeTag: 'Banger',
    bpm: 120,
    energy: 80,
    slots: ['statement-banger'],
    gradient: 'from-pink-900 to-purple-900',
    impact: 85,
    recognition: 85,
    acclaim: 85,
    archetypes: ['anthem'],
    flowInsight: {
      bpmDelta: 2,
      energyDelta: 0,
      pacingLabel: 'Smooth Ramp',
      synergyScore: 92,
      isMonopolyRisk: false,
    },
    ...overrides,
  };
}

function makeMockSlot(overrides: Partial<DraftSlot> = {}): DraftSlot {
  return {
    id: 'slot-1',
    name: 'Opener',
    targetEnergy: { min: 70, max: 90, ideal: 80 },
    allowedArchetypes: ['intro', 'anthem'],
    description: 'Slot test',
    categoryKey: 'slotFit',
    ...overrides,
  };
}

function makeMockEvaluation(overrides: Partial<EvaluationResult> = {}): EvaluationResult {
  return {
    overallScore: 9.4,
    rawScore: 94,
    monopolyPenalty: 0,
    gradeBadge: 'A+',
    subScores: { slotFit: 9.5, albumFlow: 9.2, cohesion: 9.3, impact: 9.6 },
    reviews: [],
    monopolyReport: { uniqueArtists: 3, totalTracks: 3, repeatArtists: [], penaltyApplied: 0 },
    bestPossibleScore: 9.7,
    draftEfficiency: 97,
    source: 'fallback',
    ...overrides,
  };
}

describe('Wordle-Style Daily Share Card Engine', () => {
  it('builds structured Wordle share data with green squares for high-synergy tracks', () => {
    const tracks: DraftedTrack[] = [
      { song: makeMockSong({ title: 'Song 1', artist: 'Artist 1' }), slot: makeMockSlot(), draftedAt: 1 },
      { song: makeMockSong({ title: 'Song 2', artist: 'Artist 2' }), slot: makeMockSlot(), draftedAt: 2 },
    ];

    const evaluation = makeMockEvaluation();
    const data = buildWordleShareData(evaluation, tracks, 'draft', 'CHALLENGE_99', undefined, 4);

    assert.equal(data.score, 9.4);
    assert.equal(data.gradeBadge, 'A+');
    assert.equal(data.streakDays, 4);
    assert.equal(data.slotsBreakdown.length, 2);
    assert.equal(data.slotsBreakdown[0].emojiSquare, '🟩');
  });

  it('formats viral copy text ready for clipboard with emojis and challenge code', () => {
    const tracks: DraftedTrack[] = [
      { song: makeMockSong({ title: 'DNA', artist: 'Kendrick Lamar' }), slot: makeMockSlot(), draftedAt: 1 },
      { song: makeMockSong({ title: 'SICKO MODE', artist: 'Travis Scott' }), slot: makeMockSlot(), draftedAt: 2 },
    ];

    const evaluation = makeMockEvaluation({ overallScore: 9.2 });
    const data = buildWordleShareData(evaluation, tracks, 'draft', 'SEED_123');
    const text = formatWordleShareText(data);

    assert.match(text, /🎧 TrackDraft · 9.2\/10/);
    assert.match(text, /AUX PASS APPROVED/);
    assert.match(text, /🟩 1\. DNA - Kendrick Lamar/);
    assert.match(text, /⚔️ 1v1 Code: SEED_123/);
  });
});
