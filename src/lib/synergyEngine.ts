import type { DraftedTrack, SynergyBadge, CrowdHypeResult } from '../types/draft.ts';

const PRODUCER_SIGNATURES: {
  id: string;
  name: string;
  artists: string[];
  songKeywords: string[];
  icon: string;
}[] = [
  {
    id: 'metro-boomin',
    name: 'Metro Boomin Dynasty',
    artists: ['Future', '21 Savage', 'Metro Boomin', 'Offset'],
    songKeywords: ['mask off', 'ric flair', 'creep', 'heroes', 'villains', 'fukumean', 'knifed', 'bank account'],
    icon: 'Flame',
  },
  {
    id: 'kanye-west',
    name: 'Yeezy Chopped Soul & Synths',
    artists: ['Kanye West', 'Kid Cudi', 'Pusha T', 'Jay-Z'],
    songKeywords: ['dark fantasy', 'ultralight', 'bound', 'devil in a new dress', 'ghost town', 'runaway', 'blood on the leaves'],
    icon: 'Crown',
  },
  {
    id: 'mike-dean',
    name: 'Mike Dean Epic Synths',
    artists: ['Travis Scott', 'Kanye West', 'The Weeknd', 'Beyonce'],
    songKeywords: ['astroworld', 'sicko', 'stargazing', '90210', 'synthesis', 'redbone'],
    icon: 'Zap',
  },
  {
    id: 'neptunes-pharrell',
    name: 'The Neptunes 4-Count Bounce',
    artists: ['Pusha T', 'Snoop Dogg', 'Pharrell', 'Clipse', 'Tyler, The Creator'],
    songKeywords: ['grindin', 'hot in herre', 'drop it like it', 'mr. morale'],
    icon: 'Sparkles',
  },
  {
    id: 'ohevo-40',
    name: 'OVO Sound 40 Late Night Pads',
    artists: ['Drake', 'PartyNextDoor', 'dvsn'],
    songKeywords: ['marvins', 'passionfruit', 'headlines', 'jungle', 'feel no ways', 'hold on'],
    icon: 'Moon',
  },
];

/**
 * Detects active synergies across the currently drafted tracklist.
 */
export function detectSynergies(draftedTracks: DraftedTrack[]): SynergyBadge[] {
  if (draftedTracks.length < 2) return [];

  const badges: SynergyBadge[] = [];

  // 1. Silk BPM Blend (Adjacent tracks with <= 3 BPM difference or double/half time)
  let silkBlendCount = 0;
  for (let i = 1; i < draftedTracks.length; i++) {
    const prev = draftedTracks[i - 1].song;
    const curr = draftedTracks[i].song;
    const delta = Math.abs(curr.bpm - prev.bpm);
    const isDoubleTime =
      Math.abs(curr.bpm - prev.bpm * 2) <= 4 ||
      Math.abs(curr.bpm * 2 - prev.bpm) <= 4;

    if (delta <= 3 || isDoubleTime) {
      silkBlendCount++;
    }
  }

  if (silkBlendCount >= 1) {
    badges.push({
      id: 'silk-bpm-blend',
      name: silkBlendCount >= 3 ? 'Master DJ Silk Flow' : 'Silk BPM Blend',
      description: `${silkBlendCount} seamless transitions (within 3 BPM or groove locked).`,
      bonusPoints: Math.min(10, silkBlendCount * 4),
      icon: 'Disc',
      category: 'bpm',
    });
  }

  // 2. Producer / Sonic Lineage
  for (const prod of PRODUCER_SIGNATURES) {
    const matchingTracks = draftedTracks.filter((t) => {
      const artistMatch = prod.artists.some((a) => t.song.artist.toLowerCase().includes(a.toLowerCase()));
      const titleMatch = prod.songKeywords.some((k) => t.song.title.toLowerCase().includes(k.toLowerCase()));
      const tagMatch = t.song.producerTags?.some(
        (tag) => tag.toLowerCase() === prod.id.toLowerCase() || prod.name.toLowerCase().includes(tag.toLowerCase())
      );
      return Boolean(artistMatch || titleMatch || tagMatch);
    });

    if (matchingTracks.length >= 2) {
      badges.push({
        id: `producer-${prod.id}`,
        name: prod.name,
        description: `${matchingTracks.length} tracks sharing iconic sonic DNA (${matchingTracks.map((m) => m.song.artist).slice(0, 2).join(' & ')}).`,
        bonusPoints: 6,
        icon: prod.icon,
        category: 'producer',
      });
      break; // Award top producer lineage
    }
  }

  // 3. Feature Chemistry / Collaborator Alley-Oop
  let chemistryFound = false;
  for (let i = 0; i < draftedTracks.length; i++) {
    for (let j = i + 1; j < draftedTracks.length; j++) {
      const trackA = draftedTracks[i].song;
      const trackB = draftedTracks[j].song;

      // track A features track B's artist or vice versa
      const aFeaturesB = trackA.featuredArtists.some((feat) => feat.toLowerCase() === trackB.artist.toLowerCase());
      const bFeaturesA = trackB.featuredArtists.some((feat) => feat.toLowerCase() === trackA.artist.toLowerCase());
      const sharedFeature = trackA.featuredArtists.some((feat) =>
        trackB.featuredArtists.some((featB) => feat.toLowerCase() === featB.toLowerCase())
      );

      if (aFeaturesB || bFeaturesA || sharedFeature) {
        badges.push({
          id: 'feature-chemistry',
          name: 'Alley-Oop Feature Chemistry',
          description: `Collaborative bond between ${trackA.artist} and ${trackB.artist}.`,
          bonusPoints: 5,
          icon: 'Sparkles',
          category: 'feature',
        });
        chemistryFound = true;
        break;
      }
    }
    if (chemistryFound) break;
  }

  // 4. Era Run (3 consecutive tracks from the same era)
  let eraRun = 1;
  let maxEraRun = 1;
  let runEraName = '';

  for (let i = 1; i < draftedTracks.length; i++) {
    const prevYear = draftedTracks[i - 1].song.year ?? 2015;
    const currYear = draftedTracks[i].song.year ?? 2015;
    const prevDecade = Math.floor(prevYear / 10) * 10;
    const currDecade = Math.floor(currYear / 10) * 10;

    if (prevDecade === currDecade) {
      eraRun++;
      if (eraRun > maxEraRun) {
        maxEraRun = eraRun;
        runEraName = `${currDecade}s`;
      }
    } else {
      eraRun = 1;
    }
  }

  if (maxEraRun >= 3) {
    badges.push({
      id: 'era-lockdown',
      name: `${runEraName} Era Lockdown`,
      description: `${maxEraRun} consecutive tracks anchoring the iconic sound of the ${runEraName}.`,
      bonusPoints: 5,
      icon: 'Clock',
      category: 'era',
    });
  }

  // 5. Crate Digger (2+ sleeper songs with recognition <= 72)
  const sleepers = draftedTracks.filter((t) => t.song.recognition <= 72);
  if (sleepers.length >= 2) {
    badges.push({
      id: 'crate-digger',
      name: 'Certified Crate Digger',
      description: `Drafted ${sleepers.length} underground / deep cut sleepers with exceptional taste.`,
      bonusPoints: 6,
      icon: 'Headphones',
      category: 'curator',
    });
  }

  return badges;
}

/**
 * Computes dynamic Aux Cord Crowd Hype (0 to 100) based on drafted tracks,
 * energy trajectory, transition smoothness, and active synergies.
 */
export function computeCrowdHype(
  draftedTracks: DraftedTrack[],
  synergies: SynergyBadge[] = []
): CrowdHypeResult {
  if (draftedTracks.length === 0) {
    return {
      score: 65,
      status: 'AWAITING FIRST DROP 🚀',
      reactionQuote: 'Passengers waiting to see who gets the aux cord...',
    };
  }

  let score = 65;

  for (let i = 0; i < draftedTracks.length; i++) {
    const track = draftedTracks[i];
    const energyDelta = Math.abs(track.song.energy - track.slot.targetEnergy.ideal);

    // Reward ideal energy match
    if (energyDelta <= 5) score += 4;
    else if (energyDelta <= 12) score += 2;
    else if (energyDelta >= 22) score -= 4;

    // Transitions
    if (i > 0) {
      const prev = draftedTracks[i - 1].song;
      const bpmDiff = Math.abs(track.song.bpm - prev.bpm);
      if (bpmDiff <= 4) score += 3;
      else if (bpmDiff > 35) score -= 4;
    }
  }

  // Synergy bonus
  score += synergies.length * 4;

  score = Math.min(100, Math.max(15, score));

  if (score >= 88) {
    return {
      score,
      status: 'THE AUX IS ON FIRE! 🔥',
      reactionQuote: 'Windows rolled all the way down. The car is shaking.',
    };
  }
  if (score >= 74) {
    return {
      score,
      status: 'CERTIFIED AUX PASS 🔊',
      reactionQuote: 'Head nods all across the car. Nobody touches the skip button.',
    };
  }
  if (score >= 55) {
    return {
      score,
      status: 'SOLID CRUISE VIBES 🎶',
      reactionQuote: 'Good flow so far. Keep the momentum moving forward.',
    };
  }
  if (score >= 42) {
    return {
      score,
      status: 'PASSENGERS DISTRACTED 😐',
      reactionQuote: 'Vibe lull detected. You need a statement anthem next.',
    };
  }

  return {
    score,
    status: 'AUX THREAT CRITICAL 💀',
    reactionQuote: 'Someone is quietly reaching forward to unplug the aux cord...',
  };
}
