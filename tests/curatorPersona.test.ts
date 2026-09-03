import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCuratorPersona } from '../src/lib/curatorPersona.ts';
import type { DraftedTrack, Song, DraftSlot } from '../src/types/draft.ts';

function makeMockSong(overrides: Partial<Song> = {}): Song {
  return {
    id: 'test-song',
    title: 'Test Title',
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

describe('Curator DNA & DJ Persona Profiler', () => {
  it('detects The 808 Architect when tracks have very high energy and trap tags', () => {
    const tracks: DraftedTrack[] = [
      { song: makeMockSong({ energy: 92, typeTag: 'Explosive Trap Anthem' }), slot: makeMockSlot(), draftedAt: 1 },
      { song: makeMockSong({ energy: 90, typeTag: '808 Bounce Club' }), slot: makeMockSlot(), draftedAt: 2 },
      { song: makeMockSong({ energy: 88, typeTag: 'Trap Heavyweight' }), slot: makeMockSlot(), draftedAt: 3 },
    ];

    const persona = deriveCuratorPersona(tracks);
    assert.match(persona.title, /808 Architect/);
    assert.equal(persona.id, '808-architect');
  });

  it('detects Certified Crate Digger when player drafts 2+ sleeper/value picks', () => {
    const tracks: DraftedTrack[] = [
      { song: makeMockSong({ archetypes: ['value-pick'], budgetCost: 1, recognition: 65 }), slot: makeMockSlot(), draftedAt: 1 },
      { song: makeMockSong({ archetypes: ['value-pick'], budgetCost: 1, recognition: 70 }), slot: makeMockSlot(), draftedAt: 2 },
      { song: makeMockSong({ energy: 75 }), slot: makeMockSlot(), draftedAt: 3 },
    ];

    const persona = deriveCuratorPersona(tracks);
    assert.match(persona.title, /Certified Crate Digger/);
    assert.equal(persona.id, 'crate-digger');
  });

  it('detects Golden Era Purist when player drafts vintage 90s/2000s lyrical cuts', () => {
    const tracks: DraftedTrack[] = [
      { song: makeMockSong({ year: 1994, archetypes: ['lyrical'] }), slot: makeMockSlot(), draftedAt: 1 },
      { song: makeMockSong({ year: 1996, archetypes: ['lyrical'] }), slot: makeMockSlot(), draftedAt: 2 },
      { song: makeMockSong({ year: 2001, archetypes: ['storytelling'] }), slot: makeMockSlot(), draftedAt: 3 },
    ];

    const persona = deriveCuratorPersona(tracks);
    assert.match(persona.title, /Golden Era Purist/);
    assert.equal(persona.id, 'golden-era-purist');
  });

  it('detects Late Night Cruise Specialist when player drafts smooth R&B / mellow cuts', () => {
    const tracks: DraftedTrack[] = [
      { song: makeMockSong({ genre: 'R&B', energy: 55 }), slot: makeMockSlot(), draftedAt: 1 },
      { song: makeMockSong({ genre: 'R&B', energy: 60 }), slot: makeMockSlot(), draftedAt: 2 },
      { song: makeMockSong({ energy: 58 }), slot: makeMockSlot(), draftedAt: 3 },
    ];

    const persona = deriveCuratorPersona(tracks);
    assert.match(persona.title, /Late Night Cruise Specialist/);
    assert.equal(persona.id, 'late-night-specialist');
  });
});
