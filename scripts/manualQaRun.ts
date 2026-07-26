import { EP_SLOTS } from '../src/data/slots.ts';
import { generateCandidatePool } from '../src/lib/candidateSelector.ts';
import { generateEraSequence } from '../src/lib/eraSequence.ts';
import type { CandidateContext } from '../src/types/draft.ts';

function runManualQa() {
  console.log('====================================================');
  console.log('        HUMAN GAMEPLAY QA (10 SOLO EP DRAFTS)        ');
  console.log('====================================================\n');

  let recentlyShownSongIds: string[] = [];
  let recentlyShownArtists: string[] = [];

  for (let draftIdx = 1; draftIdx <= 10; draftIdx++) {
    console.log(`--- DRAFT #${draftIdx} (EP MODE) ---`);
    const slots = EP_SLOTS;
    const eraSeq = generateEraSequence(slots, null);
    const draftedSongIds: string[] = [];
    const draftedArtists: string[] = [];

    for (let roundIdx = 0; roundIdx < slots.length; roundIdx++) {
      const slot = slots[roundIdx];
      const era = eraSeq[roundIdx];

      const context: CandidateContext = {
        slotId: slot.id,
        era,
        seed: null,
        rerollIndex: draftIdx * 10 + roundIdx,
        draftedSongIds,
        draftedArtists,
        recentlyShownSongIds,
        recentlyShownArtists,
      };

      const candidates = generateCandidatePool(context, 4);
      console.log(
        `Round ${roundIdx + 1}: ${slot.name} [${era}]`
      );
      candidates.forEach((c, idx) => {
        const bucket = c.debugInfo?.bucket || `Bucket ${idx + 1}`;
        console.log(`  Card ${idx + 1} (${bucket}): "${c.title}" — ${c.artist} (Impact: ${c.impact}, Fit: ${c.debugInfo?.slotAffinity})`);
      });

      // Pick first candidate as player pick
      const picked = candidates[0];
      draftedSongIds.push(picked.id);
      draftedArtists.push(picked.artist);
      console.log(`  -> Picked: "${picked.title}" by ${picked.artist}\n`);
    }

    // Update history
    const allShown = draftedSongIds;
    recentlyShownSongIds = Array.from(new Set([...allShown, ...recentlyShownSongIds])).slice(0, 80);
    recentlyShownArtists = Array.from(new Set([...draftedArtists, ...recentlyShownArtists])).slice(0, 40);
  }
}

runManualQa();
