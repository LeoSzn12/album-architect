import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCandidateInsight,
  enrichCandidatesWithFlowIntelligence,
  pickWildcardCandidate,
} from '../src/lib/flowIntelligence.ts';
import { SONG_LIBRARY } from '../src/data/songs.ts';
import type { DraftSlot, DraftedTrack, Song } from '../src/types/draft.ts';

describe('A&R Flow Intelligence Engine', () => {
  const introSlot: DraftSlot = {
    id: 'cinematic-intro',
    name: 'Intro / Statement',
    roundNumber: 1,
    targetEnergy: { min: 60, max: 85, ideal: 75 },
    description: 'Opening statement',
    iconName: 'Sparkles',
    defaultEra: 'all',
    eraLabel: 'All Eras',
  };

  const bangerSlot: DraftSlot = {
    id: 'statement-banger',
    name: 'Lead Single / Banger',
    roundNumber: 2,
    targetEnergy: { min: 80, max: 95, ideal: 90 },
    description: 'High energy',
    iconName: 'Flame',
    defaultEra: 'all',
    eraLabel: 'All Eras',
  };

  it('computes credible synergy and transition metrics for an opener', () => {
    const opener = SONG_LIBRARY[0];
    const insight = computeCandidateInsight(opener, introSlot, [], []);

    assert.ok(insight.synergyScore >= 50 && insight.synergyScore <= 100);
    assert.equal(insight.bpmTransitionLabel, 'Opening Tempo');
    assert.ok(insight.curatorInsight.length > 10);
  });

  it('detects tempo delta and smooth transitions between consecutive songs', () => {
    const songA = SONG_LIBRARY[0];
    const songB = SONG_LIBRARY[1];

    const draftedA: DraftedTrack = {
      slot: introSlot,
      song: songA,
      roundDrafted: 1,
      isWildcard: false,
    };

    const insight = computeCandidateInsight(songB, bangerSlot, [draftedA], [songA.artist]);
    assert.equal(insight.bpmDelta, songB.bpm - songA.bpm);
    assert.match(insight.bpmTransitionLabel, /Locked|Natural|Dynamic/);
  });

  it('penalizes monopoly duplicates heavily in synergy score', () => {
    const drakeSong = SONG_LIBRARY.find((s) => s.artist === 'Drake')!;
    const draftedDrake: DraftedTrack = {
      slot: introSlot,
      song: drakeSong,
      roundDrafted: 1,
      isWildcard: false,
    };

    const nextDrakeCandidate: Song = {
      ...drakeSong,
      id: 'drake-test-2',
      title: 'Drake Duplicate',
    };

    const insight = computeCandidateInsight(
      nextDrakeCandidate,
      bangerSlot,
      [draftedDrake],
      ['Drake']
    );

    assert.equal(insight.tag, 'MONOPOLY RISK');
    assert.equal(insight.tagColor, 'pink');
    assert.ok(insight.synergyScore < 75);
    assert.match(insight.curatorInsight, /High Monopoly Penalty risk/);
  });

  it('enriches candidates and designates exactly one top A&R recommendation', () => {
    const candidates = SONG_LIBRARY.slice(0, 5);
    const enriched = enrichCandidatesWithFlowIntelligence(candidates, bangerSlot, [], []);

    assert.equal(enriched.length, 5);
    const topPicks = enriched.filter((c) => c.flowInsight?.isTopCuratorPick);
    assert.equal(topPicks.length, 1);
    assert.equal(topPicks[0].flowInsight?.tag, 'A&R TOP RECOMMENDATION');
  });

  it('picks a valid surprise wildcard for a slot', () => {
    const wildcard = pickWildcardCandidate('club-bounce', [], []);
    assert.ok(wildcard);
    assert.ok(wildcard.id);
    assert.match(wildcard.typeTag, /Wildcard Gem/);
  });
});
