import type { Song, SlotId, SongArchetype } from '../types/draft.ts';

/**
 * Songs for the First Week genre and year categories (country, EDM, Bollywood,
 * best of 2025). They only enter a draft when their category is picked, so the
 * standard draft keeps its hip-hop catalog.
 *
 * Preview audio and artwork are not stored here: the snippet player resolves
 * them at play time through /api/songs/preview (iTunes, then Deezer).
 * BPM, energy and the game ratings are approximate game values.
 */

type Category = 'country' | 'edm' | 'bollywood' | 'best-2025';

interface SongSeed {
  title: string;
  artist: string;
  feat?: string[];
  album: string;
  year: number;
  genre: string;
  typeTag: string;
  bpm: number;
  energy: number;
  impact: number;
  recognition: number;
  acclaim: number;
  archetypes: SongArchetype[];
  /** Slots this song is made for. Everything else is derived from energy. */
  best: Partial<Record<SlotId, number>>;
}

const GRADIENTS: Record<Category, string[]> = {
  country: ['from-amber-900 to-orange-950', 'from-yellow-900 to-stone-900', 'from-orange-900 to-red-950'],
  edm: ['from-cyan-900 to-indigo-950', 'from-fuchsia-900 to-violet-950', 'from-sky-900 to-blue-950'],
  bollywood: ['from-rose-900 to-amber-900', 'from-pink-900 to-orange-950', 'from-red-900 to-fuchsia-950'],
  'best-2025': ['from-violet-900 to-rose-950', 'from-emerald-900 to-teal-950', 'from-indigo-900 to-pink-950'],
};

function energyAffinity(energy: number): Partial<Record<SlotId, number>> {
  if (energy >= 85) {
    return { 'club-bounce': 74, 'apex-climax': 72, 'statement-banger': 70, 'gritty-anthem': 66, 'cinematic-intro': 62 };
  }
  if (energy >= 68) {
    return { 'vibe-shift': 72, 'statement-banger': 66, 'melodic-trap': 66, 'mid-interlude': 62, 'storyteller-cut': 60, 'cinematic-intro': 60 };
  }
  return { 'late-night-rnb': 74, 'introspective-cut': 72, 'acoustic-unplugged': 70, 'cinematic-outro': 66, 'storyteller-cut': 64, 'experimental-flex': 60 };
}

function build(category: Category, seeds: SongSeed[]): Song[] {
  return seeds.map((seed, index) => {
    const slotAffinity = { ...energyAffinity(seed.energy), ...seed.best };
    const slots = (Object.entries(slotAffinity) as [SlotId, number][])
      .filter(([, value]) => value >= 70)
      .map(([slot]) => slot);
    const feat = seed.feat ?? [];
    return {
      id: `cat-${category}-${index + 1}`,
      title: seed.title,
      artist: seed.artist,
      featuredArtists: feat,
      rawArtistString: feat.length ? `${seed.artist} feat. ${feat.join(', ')}` : seed.artist,
      album: seed.album,
      year: seed.year,
      genre: seed.genre,
      typeTag: seed.typeTag,
      bpm: seed.bpm,
      energy: seed.energy,
      slots,
      gradient: GRADIENTS[category][index % GRADIENTS[category].length],
      audioSynthFreq: 220 + ((seed.bpm * 7) % 300),
      impact: seed.impact,
      recognition: seed.recognition,
      acclaim: seed.acclaim,
      archetypes: seed.archetypes,
      slotAffinity,
    };
  });
}

export const COUNTRY_SONGS = build('country', [
  { title: 'Tennessee Whiskey', artist: 'Chris Stapleton', album: 'Traveller', year: 2015, genre: 'Country', typeTag: 'Soul Country Ballad', bpm: 48, energy: 40, impact: 94, recognition: 93, acclaim: 92, archetypes: ['rnb', 'introspective'], best: { 'late-night-rnb': 95, 'acoustic-unplugged': 88 } },
  { title: 'Last Night', artist: 'Morgan Wallen', album: 'One Thing at a Time', year: 2023, genre: 'Country', typeTag: 'Country Pop Smash', bpm: 102, energy: 70, impact: 88, recognition: 92, acclaim: 72, archetypes: ['vibe-shift'], best: { 'statement-banger': 90 } },
  { title: 'Fast Car', artist: 'Luke Combs', album: 'Gettin\' Old', year: 2023, genre: 'Country', typeTag: 'Storytelling Cover', bpm: 104, energy: 58, impact: 84, recognition: 88, acclaim: 78, archetypes: ['storytelling'], best: { 'storyteller-cut': 92 } },
  { title: 'Before He Cheats', artist: 'Carrie Underwood', album: 'Some Hearts', year: 2005, genre: 'Country', typeTag: 'Revenge Anthem', bpm: 74, energy: 80, impact: 90, recognition: 92, acclaim: 82, archetypes: ['storytelling', 'high-energy'], best: { 'gritty-anthem': 88, 'statement-banger': 84 } },
  { title: 'Friends in Low Places', artist: 'Garth Brooks', album: 'No Fences', year: 1990, genre: 'Country', typeTag: 'Singalong Classic', bpm: 106, energy: 74, impact: 95, recognition: 94, acclaim: 88, archetypes: ['street-anthem'], best: { 'apex-climax': 86, 'cinematic-outro': 80 } },
  { title: 'Jolene', artist: 'Dolly Parton', album: 'Jolene', year: 1973, genre: 'Country', typeTag: 'Timeless Plea', bpm: 110, energy: 60, impact: 97, recognition: 95, acclaim: 97, archetypes: ['storytelling', 'introspective'], best: { 'cinematic-intro': 86, 'storyteller-cut': 90 } },
  { title: 'Need You Now', artist: 'Lady A', album: 'Need You Now', year: 2009, genre: 'Country', typeTag: 'Late-Night Duet', bpm: 108, energy: 62, impact: 86, recognition: 88, acclaim: 82, archetypes: ['rnb', 'introspective'], best: { 'late-night-rnb': 90, 'vibe-shift': 74 } },
  { title: 'Body Like a Back Road', artist: 'Sam Hunt', album: 'Southside', year: 2017, genre: 'Country', typeTag: 'Laid-Back Groove', bpm: 98, energy: 66, impact: 80, recognition: 84, acclaim: 68, archetypes: ['vibe-shift'], best: { 'vibe-shift': 86 } },
  { title: 'Beautiful Crazy', artist: 'Luke Combs', album: 'This One\'s for You Too', year: 2018, genre: 'Country', typeTag: 'Love Song', bpm: 70, energy: 42, impact: 82, recognition: 84, acclaim: 76, archetypes: ['introspective'], best: { 'acoustic-unplugged': 88 } },
  { title: 'Texas Hold \'Em', artist: 'Beyoncé', album: 'Cowboy Carter', year: 2024, genre: 'Country Pop', typeTag: 'Hoedown Crossover', bpm: 110, energy: 84, impact: 88, recognition: 92, acclaim: 86, archetypes: ['high-energy', 'vibe-shift'], best: { 'club-bounce': 86, 'statement-banger': 84 } },
  { title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', album: 'Where I\'ve Been, Isn\'t Where I\'m Going', year: 2024, genre: 'Country', typeTag: 'Bar Singalong', bpm: 81, energy: 82, impact: 86, recognition: 92, acclaim: 74, archetypes: ['club', 'high-energy'], best: { 'club-bounce': 90, 'apex-climax': 78 } },
  { title: 'I Had Some Help', artist: 'Post Malone', feat: ['Morgan Wallen'], album: 'F-1 Trillion', year: 2024, genre: 'Country Pop', typeTag: 'Superstar Duet', bpm: 128, energy: 78, impact: 84, recognition: 90, acclaim: 70, archetypes: ['vibe-shift'], best: { 'vibe-shift': 90, 'statement-banger': 80 } },
  { title: 'Chicken Fried', artist: 'Zac Brown Band', album: 'The Foundation', year: 2008, genre: 'Country', typeTag: 'Front-Porch Anthem', bpm: 84, energy: 62, impact: 82, recognition: 84, acclaim: 76, archetypes: ['storytelling'], best: { 'mid-interlude': 82, 'cinematic-outro': 76 } },
  { title: 'Wagon Wheel', artist: 'Darius Rucker', album: 'True Believers', year: 2013, genre: 'Country', typeTag: 'Road Trip Singalong', bpm: 74, energy: 66, impact: 82, recognition: 86, acclaim: 72, archetypes: ['storytelling'], best: { 'storyteller-cut': 82, 'cinematic-outro': 80 } },
  { title: 'Cruise', artist: 'Florida Georgia Line', album: 'Here\'s to the Good Times', year: 2012, genre: 'Country', typeTag: 'Bro-Country Banger', bpm: 76, energy: 86, impact: 80, recognition: 86, acclaim: 60, archetypes: ['high-energy', 'club'], best: { 'club-bounce': 84 } },
  { title: 'Man! I Feel Like a Woman!', artist: 'Shania Twain', album: 'Come On Over', year: 1997, genre: 'Country Pop', typeTag: 'Party Opener', bpm: 125, energy: 90, impact: 90, recognition: 93, acclaim: 82, archetypes: ['iconic-opener', 'high-energy'], best: { 'cinematic-intro': 90, 'club-bounce': 84 } },
  { title: 'Something in the Orange', artist: 'Zach Bryan', album: 'American Heartbreak', year: 2022, genre: 'Country', typeTag: 'Raw Heartbreak', bpm: 88, energy: 38, impact: 86, recognition: 82, acclaim: 90, archetypes: ['introspective', 'experimental'], best: { 'experimental-flex': 84, 'introspective-cut': 90 } },
  { title: 'Take Me Home, Country Roads', artist: 'John Denver', album: 'Poems, Prayers & Promises', year: 1971, genre: 'Country Folk', typeTag: 'Campfire Classic', bpm: 82, energy: 56, impact: 94, recognition: 95, acclaim: 90, archetypes: ['climax'], best: { 'cinematic-outro': 92, 'apex-climax': 74 } },
  { title: 'The Gambler', artist: 'Kenny Rogers', album: 'The Gambler', year: 1978, genre: 'Country', typeTag: 'Story Song', bpm: 84, energy: 52, impact: 92, recognition: 90, acclaim: 88, archetypes: ['storytelling'], best: { 'storyteller-cut': 94 } },
  { title: 'Wide Open Spaces', artist: 'The Chicks', album: 'Wide Open Spaces', year: 1998, genre: 'Country', typeTag: 'Leaving-Home Anthem', bpm: 96, energy: 62, impact: 86, recognition: 84, acclaim: 86, archetypes: ['introspective', 'storytelling'], best: { 'cinematic-intro': 80, 'storyteller-cut': 82 } },
  { title: 'Chattahoochee', artist: 'Alan Jackson', album: 'A Lot About Livin\' (And a Little \'bout Love)', year: 1993, genre: 'Country', typeTag: 'River Party', bpm: 124, energy: 84, impact: 84, recognition: 82, acclaim: 80, archetypes: ['high-energy'], best: { 'club-bounce': 82, 'statement-banger': 78 } },
  { title: 'Humble and Kind', artist: 'Tim McGraw', album: 'Damn Country Music', year: 2016, genre: 'Country', typeTag: 'Life Advice Ballad', bpm: 72, energy: 36, impact: 82, recognition: 80, acclaim: 82, archetypes: ['introspective'], best: { 'cinematic-outro': 86, 'acoustic-unplugged': 82 } },
  { title: 'Live Like You Were Dying', artist: 'Tim McGraw', album: 'Live Like You Were Dying', year: 2004, genre: 'Country', typeTag: 'Big Life Anthem', bpm: 76, energy: 64, impact: 86, recognition: 86, acclaim: 82, archetypes: ['climax', 'storytelling'], best: { 'apex-climax': 82, 'storyteller-cut': 80 } },
  { title: 'Ring of Fire', artist: 'Johnny Cash', album: 'Ring of Fire: The Best of Johnny Cash', year: 1963, genre: 'Country', typeTag: 'Mariachi Horn Classic', bpm: 104, energy: 66, impact: 96, recognition: 93, acclaim: 95, archetypes: ['iconic-opener', 'experimental'], best: { 'cinematic-intro': 90, 'experimental-flex': 80 } },
  { title: '9 to 5', artist: 'Dolly Parton', album: '9 to 5 and Odd Jobs', year: 1980, genre: 'Country Pop', typeTag: 'Workday Banger', bpm: 108, energy: 82, impact: 90, recognition: 92, acclaim: 88, archetypes: ['high-energy', 'street-anthem'], best: { 'gritty-anthem': 86, 'statement-banger': 82 } },
  { title: 'Teardrops on My Guitar', artist: 'Taylor Swift', album: 'Taylor Swift', year: 2006, genre: 'Country Pop', typeTag: 'Teen Heartbreak', bpm: 100, energy: 54, impact: 84, recognition: 88, acclaim: 76, archetypes: ['introspective'], best: { 'introspective-cut': 86, 'late-night-rnb': 78 } },
  { title: 'Follow Your Arrow', artist: 'Kacey Musgraves', album: 'Same Trailer Different Park', year: 2013, genre: 'Country', typeTag: 'Free-Spirit Anthem', bpm: 120, energy: 60, impact: 82, recognition: 76, acclaim: 90, archetypes: ['experimental', 'lyrical'], best: { 'experimental-flex': 88 } },
  { title: 'Austin', artist: 'Dasha', album: 'What Happens Now?', year: 2024, genre: 'Country Pop', typeTag: 'Line-Dance Viral', bpm: 116, energy: 80, impact: 76, recognition: 82, acclaim: 66, archetypes: ['club', 'vibe-shift'], best: { 'vibe-shift': 84, 'club-bounce': 78 } },
]);

export const EDM_SONGS = build('edm', [
  { title: 'Levels', artist: 'Avicii', album: 'Levels', year: 2011, genre: 'EDM', typeTag: 'Festival Anthem', bpm: 126, energy: 92, impact: 95, recognition: 94, acclaim: 88, archetypes: ['club', 'climax'], best: { 'apex-climax': 94, 'club-bounce': 90 } },
  { title: 'Wake Me Up', artist: 'Avicii', album: 'True', year: 2013, genre: 'EDM', typeTag: 'Folk-House Crossover', bpm: 124, energy: 84, impact: 93, recognition: 95, acclaim: 84, archetypes: ['vibe-shift', 'iconic-opener'], best: { 'cinematic-intro': 86, 'statement-banger': 90 } },
  { title: 'Titanium', artist: 'David Guetta', feat: ['Sia'], album: 'Nothing but the Beat', year: 2011, genre: 'EDM', typeTag: 'Power Vocal Drop', bpm: 126, energy: 86, impact: 92, recognition: 94, acclaim: 82, archetypes: ['climax', 'high-energy'], best: { 'apex-climax': 92, 'vibe-shift': 80 } },
  { title: 'Animals', artist: 'Martin Garrix', album: 'Animals', year: 2013, genre: 'Big Room', typeTag: 'Big Room Drop', bpm: 128, energy: 96, impact: 86, recognition: 88, acclaim: 72, archetypes: ['club', 'high-energy'], best: { 'club-bounce': 94, 'gritty-anthem': 80 } },
  { title: 'Don\'t You Worry Child', artist: 'Swedish House Mafia', feat: ['John Martin'], album: 'Until Now', year: 2012, genre: 'Progressive House', typeTag: 'Euphoric Singalong', bpm: 129, energy: 88, impact: 90, recognition: 90, acclaim: 84, archetypes: ['climax'], best: { 'apex-climax': 90, 'cinematic-outro': 80 } },
  { title: 'Clarity', artist: 'Zedd', feat: ['Foxes'], album: 'Clarity', year: 2012, genre: 'Electro House', typeTag: 'Emotional Drop', bpm: 128, energy: 82, impact: 86, recognition: 86, acclaim: 82, archetypes: ['vibe-shift'], best: { 'vibe-shift': 88, 'statement-banger': 80 } },
  { title: 'Lean On', artist: 'Major Lazer', feat: ['DJ Snake', 'MØ'], album: 'Peace Is the Mission', year: 2015, genre: 'Moombahton', typeTag: 'Global Bounce', bpm: 98, energy: 78, impact: 90, recognition: 93, acclaim: 78, archetypes: ['club', 'vibe-shift'], best: { 'vibe-shift': 92, 'club-bounce': 82 } },
  { title: 'Turn Down for What', artist: 'DJ Snake', feat: ['Lil Jon'], album: 'Turn Down for What', year: 2013, genre: 'Trap EDM', typeTag: 'Chaos Drop', bpm: 100, energy: 98, impact: 86, recognition: 92, acclaim: 70, archetypes: ['high-energy', 'street-anthem'], best: { 'gritty-anthem': 92, 'club-bounce': 88 } },
  { title: 'Scary Monsters and Nice Sprites', artist: 'Skrillex', album: 'Scary Monsters and Nice Sprites', year: 2010, genre: 'Dubstep', typeTag: 'Dubstep Detonation', bpm: 140, energy: 97, impact: 88, recognition: 86, acclaim: 82, archetypes: ['experimental', 'high-energy'], best: { 'experimental-flex': 92, 'gritty-anthem': 86 } },
  { title: 'One More Time', artist: 'Daft Punk', album: 'Discovery', year: 2000, genre: 'French House', typeTag: 'Disco House Opener', bpm: 123, energy: 86, impact: 97, recognition: 94, acclaim: 96, archetypes: ['iconic-opener', 'club'], best: { 'cinematic-intro': 94, 'club-bounce': 86 } },
  { title: 'Get Lucky', artist: 'Daft Punk', feat: ['Pharrell Williams', 'Nile Rodgers'], album: 'Random Access Memories', year: 2013, genre: 'Nu-Disco', typeTag: 'Funk Groove', bpm: 116, energy: 74, impact: 94, recognition: 95, acclaim: 92, archetypes: ['vibe-shift'], best: { 'vibe-shift': 90, 'statement-banger': 86 } },
  { title: 'Strobe', artist: 'deadmau5', album: 'For Lack of a Better Name', year: 2009, genre: 'Progressive House', typeTag: 'Ten-Minute Build', bpm: 128, energy: 64, impact: 88, recognition: 78, acclaim: 94, archetypes: ['cinematic', 'experimental'], best: { 'cinematic-intro': 88, 'mid-interlude': 86, 'experimental-flex': 84 } },
  { title: 'Where Are Ü Now', artist: 'Jack Ü', feat: ['Justin Bieber'], album: 'Skrillex and Diplo Present Jack Ü', year: 2015, genre: 'Future Bass', typeTag: 'Vocal Chop Drop', bpm: 140, energy: 70, impact: 86, recognition: 88, acclaim: 86, archetypes: ['experimental', 'vibe-shift'], best: { 'experimental-flex': 86, 'melodic-trap': 84 } },
  { title: 'Closer', artist: 'The Chainsmokers', feat: ['Halsey'], album: 'Collage', year: 2016, genre: 'Future Pop', typeTag: 'Nostalgic Duet', bpm: 95, energy: 58, impact: 86, recognition: 94, acclaim: 62, archetypes: ['rnb', 'introspective'], best: { 'late-night-rnb': 86, 'vibe-shift': 76 } },
  { title: 'Summer', artist: 'Calvin Harris', album: 'Motion', year: 2014, genre: 'EDM', typeTag: 'Sunset Banger', bpm: 128, energy: 86, impact: 84, recognition: 88, acclaim: 72, archetypes: ['club'], best: { 'statement-banger': 84, 'club-bounce': 84 } },
  { title: 'One Kiss', artist: 'Calvin Harris', feat: ['Dua Lipa'], album: 'One Kiss', year: 2018, genre: 'House', typeTag: 'Late-Night House', bpm: 124, energy: 72, impact: 86, recognition: 88, acclaim: 80, archetypes: ['club', 'rnb'], best: { 'late-night-rnb': 80, 'vibe-shift': 84 } },
  { title: 'Sandstorm', artist: 'Darude', album: 'Before the Storm', year: 1999, genre: 'Trance', typeTag: 'Stadium Trance', bpm: 136, energy: 95, impact: 86, recognition: 92, acclaim: 70, archetypes: ['high-energy'], best: { 'apex-climax': 82, 'club-bounce': 82 } },
  { title: 'Latch', artist: 'Disclosure', feat: ['Sam Smith'], album: 'Settle', year: 2012, genre: 'UK Garage', typeTag: 'Garage Soul', bpm: 122, energy: 68, impact: 86, recognition: 84, acclaim: 92, archetypes: ['rnb', 'vibe-shift'], best: { 'late-night-rnb': 84, 'vibe-shift': 84 } },
  { title: 'Shelter', artist: 'Porter Robinson', feat: ['Madeon'], album: 'Shelter', year: 2016, genre: 'Synth-Pop EDM', typeTag: 'Heartfelt Closer', bpm: 100, energy: 60, impact: 82, recognition: 74, acclaim: 92, archetypes: ['introspective', 'climax'], best: { 'cinematic-outro': 92, 'introspective-cut': 84 } },
  { title: 'Don\'t Let Me Down', artist: 'The Chainsmokers', feat: ['Daya'], album: 'Collage', year: 2016, genre: 'Future Bass', typeTag: 'Big Vocal Drop', bpm: 160, energy: 80, impact: 84, recognition: 90, acclaim: 66, archetypes: ['high-energy'], best: { 'statement-banger': 84, 'apex-climax': 78 } },
  { title: 'Bangarang', artist: 'Skrillex', feat: ['Sirah'], album: 'Bangarang', year: 2011, genre: 'Dubstep', typeTag: 'Grimy Anthem', bpm: 110, energy: 94, impact: 86, recognition: 86, acclaim: 80, archetypes: ['street-anthem', 'high-energy'], best: { 'gritty-anthem': 90 } },
  { title: 'Faded', artist: 'Alan Walker', album: 'Different World', year: 2015, genre: 'Electro House', typeTag: 'Melancholy Drop', bpm: 90, energy: 66, impact: 86, recognition: 90, acclaim: 70, archetypes: ['introspective', 'vibe-shift'], best: { 'introspective-cut': 84, 'melodic-trap': 82 } },
  { title: 'Language', artist: 'Porter Robinson', album: 'Language', year: 2012, genre: 'Progressive House', typeTag: 'Euphoric Build', bpm: 128, energy: 84, impact: 82, recognition: 72, acclaim: 90, archetypes: ['cinematic', 'climax'], best: { 'apex-climax': 86, 'cinematic-intro': 80 } },
  { title: 'Ghosts \'n\' Stuff', artist: 'deadmau5', feat: ['Rob Swire'], album: 'For Lack of a Better Name', year: 2008, genre: 'Electro House', typeTag: 'Electro Banger', bpm: 128, energy: 90, impact: 84, recognition: 80, acclaim: 84, archetypes: ['club'], best: { 'club-bounce': 86 } },
  { title: 'Around the World', artist: 'Daft Punk', album: 'Homework', year: 1997, genre: 'French House', typeTag: 'Hypnotic Loop', bpm: 121, energy: 76, impact: 92, recognition: 88, acclaim: 94, archetypes: ['experimental', 'club'], best: { 'experimental-flex': 86, 'mid-interlude': 84 } },
  { title: 'Sweet Nothing', artist: 'Calvin Harris', feat: ['Florence Welch'], album: '18 Months', year: 2012, genre: 'EDM', typeTag: 'Power Vocal House', bpm: 128, energy: 84, impact: 84, recognition: 84, acclaim: 80, archetypes: ['climax'], best: { 'apex-climax': 84, 'vibe-shift': 78 } },
  { title: 'Rather Be', artist: 'Clean Bandit', feat: ['Jess Glynne'], album: 'New Eyes', year: 2014, genre: 'Dance Pop', typeTag: 'Strings and Beats', bpm: 121, energy: 78, impact: 84, recognition: 86, acclaim: 82, archetypes: ['vibe-shift'], best: { 'vibe-shift': 86, 'statement-banger': 78 } },
  { title: 'Firestone', artist: 'Kygo', feat: ['Conrad Sewell'], album: 'Cloud Nine', year: 2014, genre: 'Tropical House', typeTag: 'Sunset Tropical', bpm: 114, energy: 62, impact: 80, recognition: 80, acclaim: 72, archetypes: ['rnb', 'vibe-shift'], best: { 'late-night-rnb': 82, 'cinematic-outro': 76 } },
]);

export const BOLLYWOOD_SONGS = build('bollywood', [
  { title: 'Kesariya', artist: 'Arijit Singh', album: 'Brahmāstra', year: 2022, genre: 'Bollywood', typeTag: 'Romantic Ballad', bpm: 94, energy: 46, impact: 90, recognition: 92, acclaim: 84, archetypes: ['rnb', 'introspective'], best: { 'late-night-rnb': 92, 'statement-banger': 72 } },
  { title: 'Tum Hi Ho', artist: 'Arijit Singh', album: 'Aashiqui 2', year: 2013, genre: 'Bollywood', typeTag: 'Heartbreak Ballad', bpm: 94, energy: 38, impact: 94, recognition: 94, acclaim: 88, archetypes: ['introspective'], best: { 'introspective-cut': 94, 'cinematic-outro': 80 } },
  { title: 'Chaiyya Chaiyya', artist: 'Sukhwinder Singh', feat: ['Sapna Awasthi'], album: 'Dil Se..', year: 1998, genre: 'Bollywood', typeTag: 'Train-Top Anthem', bpm: 112, energy: 88, impact: 97, recognition: 94, acclaim: 96, archetypes: ['iconic-opener', 'high-energy'], best: { 'cinematic-intro': 94, 'apex-climax': 86 } },
  { title: 'Jai Ho', artist: 'A. R. Rahman', feat: ['Sukhwinder Singh', 'Tanvi Shah', 'Mahalakshmi Iyer'], album: 'Slumdog Millionaire', year: 2008, genre: 'Bollywood', typeTag: 'Victory Anthem', bpm: 134, energy: 92, impact: 95, recognition: 93, acclaim: 92, archetypes: ['climax', 'high-energy'], best: { 'apex-climax': 94, 'cinematic-outro': 80 } },
  { title: 'Kal Ho Naa Ho', artist: 'Sonu Nigam', album: 'Kal Ho Naa Ho', year: 2003, genre: 'Bollywood', typeTag: 'Bittersweet Classic', bpm: 84, energy: 48, impact: 94, recognition: 92, acclaim: 90, archetypes: ['introspective', 'climax'], best: { 'cinematic-outro': 92, 'introspective-cut': 84 } },
  { title: 'Chammak Challo', artist: 'Akon', feat: ['Hamsika Iyer'], album: 'Ra.One', year: 2011, genre: 'Bollywood Pop', typeTag: 'Crossover Club Hit', bpm: 100, energy: 86, impact: 84, recognition: 90, acclaim: 66, archetypes: ['club', 'vibe-shift'], best: { 'club-bounce': 88, 'vibe-shift': 84 } },
  { title: 'London Thumakda', artist: 'Labh Janjua', feat: ['Sonu Kakkar', 'Neha Kakkar'], album: 'Queen', year: 2014, genre: 'Bollywood', typeTag: 'Wedding Banger', bpm: 104, energy: 92, impact: 86, recognition: 90, acclaim: 76, archetypes: ['club', 'high-energy'], best: { 'club-bounce': 92 } },
  { title: 'Malhari', artist: 'Vishal Dadlani', album: 'Bajirao Mastani', year: 2015, genre: 'Bollywood', typeTag: 'War Dance', bpm: 132, energy: 96, impact: 86, recognition: 86, acclaim: 80, archetypes: ['street-anthem', 'high-energy'], best: { 'gritty-anthem': 94, 'apex-climax': 82 } },
  { title: 'Jhoome Jo Pathaan', artist: 'Arijit Singh', feat: ['Sukriti Kakar'], album: 'Pathaan', year: 2023, genre: 'Bollywood Pop', typeTag: 'Blockbuster Groove', bpm: 108, energy: 84, impact: 84, recognition: 88, acclaim: 70, archetypes: ['vibe-shift', 'club'], best: { 'statement-banger': 86, 'club-bounce': 82 } },
  { title: 'Kala Chashma', artist: 'Badshah', feat: ['Neha Kakkar', 'Indeep Bakshi'], album: 'Baar Baar Dekho', year: 2016, genre: 'Punjabi Pop', typeTag: 'Dance Floor Viral', bpm: 98, energy: 94, impact: 88, recognition: 92, acclaim: 70, archetypes: ['club', 'high-energy'], best: { 'club-bounce': 94, 'statement-banger': 82 } },
  { title: 'Channa Mereya', artist: 'Arijit Singh', album: 'Ae Dil Hai Mushkil', year: 2016, genre: 'Bollywood', typeTag: 'Unrequited Love', bpm: 80, energy: 42, impact: 90, recognition: 90, acclaim: 88, archetypes: ['introspective'], best: { 'introspective-cut': 90, 'acoustic-unplugged': 84 } },
  { title: 'Apna Time Aayega', artist: 'Ranveer Singh', feat: ['DIVINE'], album: 'Gully Boy', year: 2019, genre: 'Desi Hip-Hop', typeTag: 'Underdog Anthem', bpm: 92, energy: 86, impact: 88, recognition: 88, acclaim: 88, archetypes: ['street-anthem', 'lyrical'], best: { 'gritty-anthem': 92, 'experimental-flex': 78 } },
  { title: 'Tujh Mein Rab Dikhta Hai', artist: 'Roop Kumar Rathod', album: 'Rab Ne Bana Di Jodi', year: 2008, genre: 'Bollywood', typeTag: 'Devotional Love', bpm: 76, energy: 36, impact: 88, recognition: 86, acclaim: 86, archetypes: ['introspective', 'rnb'], best: { 'late-night-rnb': 86, 'acoustic-unplugged': 84 } },
  { title: 'Desi Girl', artist: 'Shankar Mahadevan', feat: ['Sunidhi Chauhan', 'Vishal Dadlani'], album: 'Dostana', year: 2008, genre: 'Bollywood Pop', typeTag: 'Party Classic', bpm: 120, energy: 90, impact: 84, recognition: 88, acclaim: 74, archetypes: ['club', 'vibe-shift'], best: { 'vibe-shift': 86, 'club-bounce': 84 } },
  { title: 'Badtameez Dil', artist: 'Benny Dayal', feat: ['Shefali Alvares'], album: 'Yeh Jawaani Hai Deewani', year: 2013, genre: 'Bollywood Pop', typeTag: 'Rule-Breaker Bop', bpm: 126, energy: 92, impact: 86, recognition: 90, acclaim: 76, archetypes: ['high-energy'], best: { 'statement-banger': 88, 'cinematic-intro': 80 } },
  { title: 'Raataan Lambiyan', artist: 'Jubin Nautiyal', feat: ['Asees Kaur'], album: 'Shershaah', year: 2021, genre: 'Bollywood', typeTag: 'Night Drive Duet', bpm: 92, energy: 52, impact: 84, recognition: 88, acclaim: 76, archetypes: ['rnb'], best: { 'late-night-rnb': 90, 'vibe-shift': 72 } },
  { title: 'Chaleya', artist: 'Anirudh Ravichander', feat: ['Arijit Singh', 'Shilpa Rao'], album: 'Jawan', year: 2023, genre: 'Bollywood', typeTag: 'Sweeping Romance', bpm: 100, energy: 64, impact: 84, recognition: 86, acclaim: 78, archetypes: ['vibe-shift', 'rnb'], best: { 'vibe-shift': 84, 'melodic-trap': 78 } },
  { title: 'Tum Se Hi', artist: 'Mohit Chauhan', album: 'Jab We Met', year: 2007, genre: 'Bollywood', typeTag: 'Soft Rock Romance', bpm: 88, energy: 50, impact: 86, recognition: 86, acclaim: 84, archetypes: ['introspective'], best: { 'acoustic-unplugged': 90, 'storyteller-cut': 78 } },
  { title: 'Dil Se Re', artist: 'A. R. Rahman', album: 'Dil Se..', year: 1998, genre: 'Bollywood', typeTag: 'Epic Love Cry', bpm: 96, energy: 74, impact: 92, recognition: 84, acclaim: 94, archetypes: ['cinematic', 'experimental'], best: { 'experimental-flex': 88, 'cinematic-intro': 84 } },
  { title: 'Kajra Re', artist: 'Alisha Chinai', feat: ['Shankar Mahadevan', 'Javed Ali'], album: 'Bunty Aur Babli', year: 2005, genre: 'Bollywood', typeTag: 'Qawwali Party', bpm: 120, energy: 86, impact: 90, recognition: 90, acclaim: 86, archetypes: ['club', 'climax'], best: { 'club-bounce': 88, 'apex-climax': 84 } },
  { title: 'Sheila Ki Jawani', artist: 'Sunidhi Chauhan', feat: ['Vishal Dadlani'], album: 'Tees Maar Khan', year: 2010, genre: 'Bollywood Pop', typeTag: 'Item Number Banger', bpm: 128, energy: 92, impact: 84, recognition: 88, acclaim: 66, archetypes: ['club', 'high-energy'], best: { 'club-bounce': 90, 'statement-banger': 80 } },
  { title: 'Kabira', artist: 'Tochi Raina', feat: ['Rekha Bhardwaj'], album: 'Yeh Jawaani Hai Deewani', year: 2013, genre: 'Bollywood', typeTag: 'Folk Farewell', bpm: 80, energy: 40, impact: 86, recognition: 84, acclaim: 88, archetypes: ['introspective', 'storytelling'], best: { 'storyteller-cut': 88, 'cinematic-outro': 84 } },
  { title: 'Zinda', artist: 'Siddharth Mahadevan', album: 'Bhaag Milkha Bhaag', year: 2013, genre: 'Bollywood Rock', typeTag: 'Training Montage', bpm: 140, energy: 94, impact: 82, recognition: 78, acclaim: 84, archetypes: ['street-anthem', 'high-energy'], best: { 'gritty-anthem': 90, 'apex-climax': 80 } },
  { title: 'Dhoom Machale', artist: 'Sunidhi Chauhan', album: 'Dhoom', year: 2004, genre: 'Bollywood Pop', typeTag: 'Chase Scene Anthem', bpm: 132, energy: 92, impact: 86, recognition: 88, acclaim: 74, archetypes: ['high-energy'], best: { 'statement-banger': 84, 'gritty-anthem': 82 } },
  { title: 'Kun Faya Kun', artist: 'A. R. Rahman', feat: ['Javed Ali', 'Mohit Chauhan'], album: 'Rockstar', year: 2011, genre: 'Sufi', typeTag: 'Sufi Devotional', bpm: 72, energy: 34, impact: 92, recognition: 86, acclaim: 96, archetypes: ['introspective', 'experimental'], best: { 'mid-interlude': 88, 'introspective-cut': 86 } },
  { title: 'Nagada Sang Dhol', artist: 'Shreya Ghoshal', feat: ['Osman Mir'], album: 'Goliyon Ki Raasleela Ram-Leela', year: 2013, genre: 'Bollywood', typeTag: 'Garba Festival', bpm: 118, energy: 90, impact: 84, recognition: 84, acclaim: 82, archetypes: ['climax', 'high-energy'], best: { 'apex-climax': 86, 'club-bounce': 80 } },
  { title: 'Lungi Dance', artist: 'Yo Yo Honey Singh', album: 'Chennai Express', year: 2013, genre: 'Punjabi Pop', typeTag: 'Tribute Dance', bpm: 100, energy: 90, impact: 80, recognition: 86, acclaim: 60, archetypes: ['club'], best: { 'club-bounce': 84, 'vibe-shift': 76 } },
  { title: 'Agar Tum Saath Ho', artist: 'Alka Yagnik', feat: ['Arijit Singh'], album: 'Tamasha', year: 2015, genre: 'Bollywood', typeTag: 'Tearjerker Duet', bpm: 76, energy: 34, impact: 88, recognition: 88, acclaim: 88, archetypes: ['introspective', 'rnb'], best: { 'late-night-rnb': 88, 'introspective-cut': 84 } },
]);

export const BEST_OF_2025_SONGS = build('best-2025', [
  { title: 'Abracadabra', artist: 'Lady Gaga', album: 'Mayhem', year: 2025, genre: 'Dance Pop', typeTag: 'Dark Dance Pop', bpm: 117, energy: 88, impact: 88, recognition: 90, acclaim: 86, archetypes: ['club', 'high-energy'], best: { 'club-bounce': 90, 'statement-banger': 84 } },
  { title: 'Manchild', artist: 'Sabrina Carpenter', album: 'Man\'s Best Friend', year: 2025, genre: 'Pop', typeTag: 'Cheeky Country-Pop', bpm: 123, energy: 78, impact: 86, recognition: 92, acclaim: 82, archetypes: ['vibe-shift'], best: { 'statement-banger': 90 } },
  { title: 'Tears', artist: 'Sabrina Carpenter', album: 'Man\'s Best Friend', year: 2025, genre: 'Pop', typeTag: 'Disco Pop', bpm: 117, energy: 74, impact: 80, recognition: 84, acclaim: 80, archetypes: ['club', 'vibe-shift'], best: { 'vibe-shift': 84 } },
  { title: 'Golden', artist: 'HUNTR/X', album: 'KPop Demon Hunters', year: 2025, genre: 'K-Pop', typeTag: 'Soundtrack Power Anthem', bpm: 123, energy: 86, impact: 90, recognition: 94, acclaim: 84, archetypes: ['climax', 'iconic-opener'], best: { 'apex-climax': 94, 'cinematic-intro': 84 } },
  { title: 'Soda Pop', artist: 'Saja Boys', album: 'KPop Demon Hunters', year: 2025, genre: 'K-Pop', typeTag: 'Boy Band Bop', bpm: 120, energy: 84, impact: 80, recognition: 86, acclaim: 72, archetypes: ['club'], best: { 'club-bounce': 82, 'vibe-shift': 78 } },
  { title: 'The Fate of Ophelia', artist: 'Taylor Swift', album: 'The Life of a Showgirl', year: 2025, genre: 'Pop', typeTag: 'Big Pop Return', bpm: 128, energy: 76, impact: 88, recognition: 94, acclaim: 76, archetypes: ['iconic-opener', 'storytelling'], best: { 'cinematic-intro': 90, 'statement-banger': 86 } },
  { title: 'Ordinary', artist: 'Alex Warren', album: 'You\'ll Be Alright, Kid', year: 2025, genre: 'Pop', typeTag: 'Gospel-Tinged Ballad', bpm: 85, energy: 56, impact: 84, recognition: 88, acclaim: 66, archetypes: ['climax', 'introspective'], best: { 'cinematic-outro': 88, 'late-night-rnb': 78 } },
  { title: 'DtMF', artist: 'Bad Bunny', album: 'Debí Tirar Más Fotos', year: 2025, genre: 'Latin', typeTag: 'Nostalgic Plena', bpm: 136, energy: 72, impact: 90, recognition: 90, acclaim: 92, archetypes: ['introspective', 'vibe-shift'], best: { 'vibe-shift': 88, 'cinematic-outro': 84 } },
  { title: 'BAILE INoLVIDABLE', artist: 'Bad Bunny', album: 'Debí Tirar Más Fotos', year: 2025, genre: 'Latin', typeTag: 'Salsa Epic', bpm: 120, energy: 80, impact: 86, recognition: 84, acclaim: 94, archetypes: ['experimental', 'climax'], best: { 'experimental-flex': 90, 'apex-climax': 80 } },
  { title: 'NOKIA', artist: 'Drake', album: 'Some Sexy Songs 4 U', year: 2025, genre: 'Hip-Hop', typeTag: 'Throwback Club Rap', bpm: 128, energy: 84, impact: 82, recognition: 88, acclaim: 66, archetypes: ['club'], best: { 'club-bounce': 88 } },
  { title: 'Daisies', artist: 'Justin Bieber', album: 'Swag', year: 2025, genre: 'Pop', typeTag: 'Lo-Fi Guitar Pop', bpm: 116, energy: 60, impact: 80, recognition: 86, acclaim: 80, archetypes: ['vibe-shift', 'introspective'], best: { 'acoustic-unplugged': 84, 'vibe-shift': 78 } },
  { title: 'Sports car', artist: 'Tate McRae', album: 'So Close to What', year: 2025, genre: 'Pop', typeTag: 'Whisper Pop', bpm: 105, energy: 72, impact: 80, recognition: 86, acclaim: 72, archetypes: ['club', 'rnb'], best: { 'late-night-rnb': 80, 'vibe-shift': 80 } },
  { title: 'What I Want', artist: 'Morgan Wallen', feat: ['Tate McRae'], album: 'I\'m the Problem', year: 2025, genre: 'Country Pop', typeTag: 'Crossover Duet', bpm: 132, energy: 66, impact: 82, recognition: 88, acclaim: 68, archetypes: ['vibe-shift'], best: { 'vibe-shift': 86 } },
  { title: 'Gabriela', artist: 'KATSEYE', album: 'Beautiful Chaos', year: 2025, genre: 'Pop', typeTag: 'Girl Group Breakout', bpm: 100, energy: 80, impact: 80, recognition: 84, acclaim: 74, archetypes: ['club', 'vibe-shift'], best: { 'statement-banger': 80, 'club-bounce': 80 } },
  { title: 'Undressed', artist: 'sombr', album: 'I Barely Know Her', year: 2025, genre: 'Indie Pop', typeTag: 'Bedroom Heartbreak', bpm: 116, energy: 54, impact: 78, recognition: 80, acclaim: 78, archetypes: ['introspective', 'experimental'], best: { 'introspective-cut': 86, 'experimental-flex': 80 } },
  { title: 'Just Keep Watching', artist: 'Tate McRae', album: 'F1 The Album', year: 2025, genre: 'Pop', typeTag: 'Soundtrack Banger', bpm: 125, energy: 86, impact: 74, recognition: 78, acclaim: 66, archetypes: ['high-energy'], best: { 'gritty-anthem': 78 } },
  { title: 'Anxiety', artist: 'Doechii', album: 'Anxiety', year: 2025, genre: 'Hip-Hop', typeTag: 'Viral Rap Breakout', bpm: 100, energy: 78, impact: 84, recognition: 86, acclaim: 86, archetypes: ['lyrical', 'experimental'], best: { 'experimental-flex': 84, 'gritty-anthem': 78 } },
  { title: 'Bad Dreams', artist: 'Teddy Swims', album: 'I\'ve Tried Everything but Therapy (Part 2)', year: 2025, genre: 'Soul Pop', typeTag: 'Big Soul Vocal', bpm: 120, energy: 64, impact: 80, recognition: 82, acclaim: 74, archetypes: ['rnb'], best: { 'late-night-rnb': 84 } },
  { title: 'Sapphire', artist: 'Ed Sheeran', album: 'Play', year: 2025, genre: 'Pop', typeTag: 'Global Pop Fusion', bpm: 116, energy: 76, impact: 78, recognition: 82, acclaim: 70, archetypes: ['vibe-shift'], best: { 'vibe-shift': 82 } },
  { title: 'Dracula', artist: 'Tame Impala', album: 'Deadbeat', year: 2025, genre: 'Psych Pop', typeTag: 'Night Drive Groove', bpm: 118, energy: 70, impact: 80, recognition: 78, acclaim: 84, archetypes: ['experimental', 'vibe-shift'], best: { 'mid-interlude': 82, 'melodic-trap': 80 } },
  { title: 'Your Idol', artist: 'Saja Boys', album: 'KPop Demon Hunters', year: 2025, genre: 'K-Pop', typeTag: 'Villain Anthem', bpm: 120, energy: 88, impact: 80, recognition: 84, acclaim: 74, archetypes: ['street-anthem', 'high-energy'], best: { 'gritty-anthem': 86 } },
  { title: 'How It\'s Done', artist: 'HUNTR/X', album: 'KPop Demon Hunters', year: 2025, genre: 'K-Pop', typeTag: 'Hype Opener', bpm: 130, energy: 90, impact: 80, recognition: 82, acclaim: 74, archetypes: ['iconic-opener', 'high-energy'], best: { 'cinematic-intro': 86, 'statement-banger': 78 } },
  { title: 'Folded', artist: 'Kehlani', album: 'Folded', year: 2025, genre: 'R&B', typeTag: 'Slow-Burn R&B', bpm: 70, energy: 44, impact: 80, recognition: 80, acclaim: 84, archetypes: ['rnb', 'introspective'], best: { 'late-night-rnb': 90 } },
  { title: 'Man I Need', artist: 'Olivia Dean', album: 'The Art of Loving', year: 2025, genre: 'Soul Pop', typeTag: 'Retro Soul Bop', bpm: 108, energy: 62, impact: 80, recognition: 80, acclaim: 86, archetypes: ['rnb', 'vibe-shift'], best: { 'vibe-shift': 82, 'late-night-rnb': 80 } },
  { title: 'Mystical Magical', artist: 'Benson Boone', album: 'American Heart', year: 2025, genre: 'Pop', typeTag: 'Retro Pop Romp', bpm: 125, energy: 80, impact: 74, recognition: 78, acclaim: 62, archetypes: ['vibe-shift'], best: { 'statement-banger': 76 } },
  { title: 'Outside', artist: 'Cardi B', album: 'Am I the Drama?', year: 2025, genre: 'Hip-Hop', typeTag: 'Comeback Rap Single', bpm: 96, energy: 86, impact: 76, recognition: 80, acclaim: 66, archetypes: ['street-anthem'], best: { 'gritty-anthem': 82, 'club-bounce': 76 } },
  { title: 'Cry for Me', artist: 'The Weeknd', album: 'Hurry Up Tomorrow', year: 2025, genre: 'R&B', typeTag: 'Synth-Pop Heartache', bpm: 120, energy: 72, impact: 78, recognition: 80, acclaim: 76, archetypes: ['rnb', 'cinematic'], best: { 'cinematic-outro': 80, 'late-night-rnb': 78 } },
  { title: 'Hard Fought Hallelujah', artist: 'Brandon Lake', feat: ['Jelly Roll'], album: 'King of Hearts', year: 2025, genre: 'Gospel Country', typeTag: 'Gospel Rock Closer', bpm: 76, energy: 74, impact: 76, recognition: 76, acclaim: 72, archetypes: ['climax'], best: { 'apex-climax': 82, 'cinematic-outro': 80 } },
]);

export const CATEGORY_SONGS: Song[] = [...COUNTRY_SONGS, ...EDM_SONGS, ...BOLLYWOOD_SONGS, ...BEST_OF_2025_SONGS];
