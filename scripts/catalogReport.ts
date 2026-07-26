import { SONG_LIBRARY, filterByEra } from '../src/data/songs.ts';
import { EP_SLOTS, ALBUM_SLOTS } from '../src/data/slots.ts';
import type { SlotId, EraFilter } from '../src/types/draft.ts';
import { getSlotAffinity } from '../src/lib/candidateSelector.ts';

function generateReport() {
  console.log('====================================================');
  console.log('        ALBUM ARCHITECT CATALOG AUDIT REPORT        ');
  console.log('====================================================\n');

  console.log(`Total Tracks in Library: ${SONG_LIBRARY.length}`);
  const uniqueArtists = new Set(SONG_LIBRARY.map((s) => s.artist));
  console.log(`Unique Lead Artists: ${uniqueArtists.size}\n`);

  // Check incomplete metadata
  const incomplete = SONG_LIBRARY.filter(
    (s) =>
      s.impact === undefined ||
      s.recognition === undefined ||
      !s.archetypes ||
      s.archetypes.length === 0 ||
      !s.slotAffinity ||
      Object.keys(s.slotAffinity).length === 0
  );
  console.log(`Songs with incomplete metadata: ${incomplete.length}`);
  if (incomplete.length > 0) {
    incomplete.forEach((s) => console.log(`  - [${s.id}] ${s.title} by ${s.artist}`));
  }
  console.log('\n----------------------------------------------------');
  console.log('              SLOT × ERA COVERAGE                   ');
  console.log('----------------------------------------------------\n');

  const allSlots = Array.from(new Set([...EP_SLOTS, ...ALBUM_SLOTS].map((s) => s.id)));
  const eras: EraFilter[] = ['2000s', '2010s', '2020s', 'all'];

  let weakCount = 0;

  for (const slotId of allSlots) {
    const slotName = [...EP_SLOTS, ...ALBUM_SLOTS].find((s) => s.id === slotId)?.name || slotId;
    console.log(`${slotName} (${slotId})`);

    for (const era of eras) {
      const eraPool = filterByEra(SONG_LIBRARY, era);
      const eligible = eraPool.filter((s) => getSlotAffinity(s, slotId) >= 60 || (s.slots && s.slots.includes(slotId as SlotId)));
      const count = eligible.length;

      let status = 'GOOD';
      if (count < 8) {
        status = 'NEEDS WORK';
        weakCount++;
      } else if (count < 12) {
        status = 'MODERATE';
      }

      console.log(`  ${era.padEnd(8)}: ${count.toString().padStart(2)} candidates — ${status}`);
    }
    console.log('');
  }

  console.log('----------------------------------------------------');
  console.log('            QUALITY & DIVERSITY METRICS            ');
  console.log('----------------------------------------------------\n');

  // Actual Openers count
  const actualOpeners = SONG_LIBRARY.filter((s) => s.isActualAlbumOpener || s.originalAlbumTrackNumber === 1);
  console.log(`Actual Album Opener Tracks: ${actualOpeners.length}`);

  // Average Slot Affinity for key slots
  const introAffinityAvg =
    SONG_LIBRARY.reduce((sum, s) => sum + getSlotAffinity(s, 'cinematic-intro'), 0) / SONG_LIBRARY.length;
  console.log(`Avg Cinematic Intro Affinity (Overall): ${introAffinityAvg.toFixed(1)} / 100`);

  // Archetype distribution
  const archetypeCounts: Record<string, number> = {};
  SONG_LIBRARY.forEach((s) => {
    (s.archetypes || []).forEach((a) => {
      archetypeCounts[a] = (archetypeCounts[a] || 0) + 1;
    });
  });

  console.log('\nArchetype Distribution:');
  Object.entries(archetypeCounts).forEach(([arch, count]) => {
    console.log(`  - ${arch.padEnd(16)}: ${count} songs`);
  });

  console.log('\n====================================================');
  console.log(`Audit Summary: ${weakCount} slot-era combinations flagged as NEEDS WORK (<8 candidates).`);
  console.log('====================================================\n');
}

generateReport();
