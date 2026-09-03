import type { DraftedTrack, Song } from '@/types/draft';

export interface CuratorPersona {
  id: string;
  title: string;
  tagline: string;
  iconName: string;
  gradient: string;
  borderClass: string;
  traits: string[];
  crowdReputation: string;
}

/**
 * Analyzes the drafted tracks and derives a distinctive "Curator DNA" DJ Persona.
 */
export function deriveCuratorPersona(draftedTracks: DraftedTrack[]): CuratorPersona {
  if (draftedTracks.length === 0) {
    return {
      id: 'rookie-selector',
      title: 'The Crate Novice',
      tagline: 'Just beginning the journey of sonic architecture.',
      iconName: 'Headphones',
      gradient: 'from-slate-700 to-slate-900',
      borderClass: 'border-slate-600',
      traits: ['Curious Ear', 'Fresh Perspective'],
      crowdReputation: 'Warming up the turntables',
    };
  }

  const songs: Song[] = draftedTracks.map((dt) => dt.song);

  // Metrics
  const avgEnergy = Math.round(songs.reduce((acc, s) => acc + s.energy, 0) / songs.length);
  const avgImpact = Math.round(songs.reduce((acc, s) => acc + s.impact, 0) / songs.length);
  const avgRecognition = Math.round(songs.reduce((acc, s) => acc + s.recognition, 0) / songs.length);

  // Genre counts
  const rnbCount = songs.filter((s) => s.genre === 'R&B' || s.archetypes.includes('rnb')).length;
  const trapCount = songs.filter(
    (s) => s.typeTag.toLowerCase().includes('trap') || s.typeTag.toLowerCase().includes('bounce')
  ).length;

  // Era counts
  const vintageCount = songs.filter((s) => (s.year && s.year < 2010) || s.archetypes.includes('lyrical')).length;
  const modernCount = songs.filter((s) => s.year && s.year >= 2020).length;

  // Archetypes
  const sleeperCount = songs.filter(
    (s) => s.archetypes.includes('value-pick') || s.recognition < 80 || s.budgetCost === 1
  ).length;

  // Diversity
  const uniqueArtists = new Set(songs.map((s) => s.artist)).size;
  const isHighDiversity = uniqueArtists === songs.length && songs.length >= 6;

  // 1. Crate Digger (2+ Sleeper / underground gems)
  if (sleeperCount >= 2) {
    return {
      id: 'crate-digger',
      title: 'Certified Crate Digger 💎',
      tagline: 'Unearths underground gems and rare deep cuts that algorithms overlook.',
      iconName: 'Disc',
      gradient: 'from-amber-600 via-yellow-600 to-amber-900',
      borderClass: 'border-amber-500/60 shadow-amber-950/40',
      traits: ['Deep Catalog IQ', 'Taste Over Hype', 'Sleeper Value Savant'],
      crowdReputation: 'Respect from true vinyl heads across the room',
    };
  }

  // 2. The 808 Architect (High Energy + Trap)
  if (avgEnergy >= 84 || trapCount >= 3) {
    return {
      id: '808-architect',
      title: 'The 808 Architect ⚡',
      tagline: 'Unrelenting sub-bass pressure, explosive drops, and festival main-stage anthems.',
      iconName: 'Flame',
      gradient: 'from-rose-600 via-red-600 to-zinc-950',
      borderClass: 'border-rose-500/60 shadow-rose-950/50',
      traits: ['Maximum Voltage', 'Sub-Bass Dominance', 'Mosh Pit Catalyst'],
      crowdReputation: 'The floor is shaking, nobody can stand still',
    };
  }

  // 3. Golden Era Purist (Boom Bap / Vintage / 90s-2000s)
  if (vintageCount >= 3) {
    return {
      id: 'golden-era-purist',
      title: 'The Golden Era Purist 👑',
      tagline: 'Timeless lyricism, immaculate boom-bap cadences, and legendary hip-hop royalty.',
      iconName: 'Crown',
      gradient: 'from-amber-600 via-yellow-700 to-stone-950',
      borderClass: 'border-amber-500/60 shadow-amber-950/40',
      traits: ['Lyrical Density', 'Boom-Bap Reverence', 'Classic Storytelling'],
      crowdReputation: 'Solemn head nods from elder hip-hop purists',
    };
  }

  // 4. Late-Night Cruise Specialist (R&B / Introspective / Mellow)
  if (rnbCount >= 2 || avgEnergy <= 68) {
    return {
      id: 'late-night-specialist',
      title: 'Late Night Cruise Specialist 🌙',
      tagline: 'Silky smooth progressions, nocturnal ambiance, and emotive headphone grooves.',
      iconName: 'Moon',
      gradient: 'from-sky-700 via-blue-800 to-zinc-950',
      borderClass: 'border-sky-500/60 shadow-sky-950/40',
      traits: ['Velvet Transitions', 'Nocturnal Ambiance', 'R&B Sensibility'],
      crowdReputation: 'Windows down, cool breeze, everyone gazing out the car',
    };
  }

  // 5. The Renaissance A&R (Broad Eclectic Balance)
  if (isHighDiversity) {
    return {
      id: 'renaissance-ar',
      title: 'The Renaissance A&R ✨',
      tagline: 'Surgical curatorial balance weaving distinct eras and subgenres into one coherent masterpiece.',
      iconName: 'Sparkles',
      gradient: 'from-emerald-600 via-teal-700 to-zinc-950',
      borderClass: 'border-emerald-500/60 shadow-emerald-950/40',
      traits: ['Eclectic Mastery', 'Zero Monopoly', 'Surgical Flow'],
      crowdReputation: 'The critics and casual listeners are in rare unison',
    };
  }

  // 6. Default: Hitmaker Executive (Big Acclaim & Stadium Bangers)
  return {
    id: 'hitmaker-executive',
    title: 'The Hitmaker Executive 🎯',
    tagline: 'Stadium-filling anthems, platinum records, and undeniable aux cord dominance.',
    iconName: 'Trophy',
    gradient: 'from-rose-600 via-red-700 to-zinc-950',
    borderClass: 'border-rose-500/60 shadow-rose-950/40',
    traits: ['Stadium Anthems', 'Platinum Instincts', 'Crowd Singalongs'],
    crowdReputation: 'Whole room shouting every chorus word-for-word',
  };
}
