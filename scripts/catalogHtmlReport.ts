import fs from 'node:fs';
import path from 'node:path';
import { SONG_LIBRARY, filterByEra } from '../src/data/songs.ts';
import { EP_SLOTS, ALBUM_SLOTS } from '../src/data/slots.ts';
import type { SlotId, EraFilter } from '../src/types/draft.ts';
import { getSlotAffinity } from '../src/lib/candidateSelector.ts';

function generateHtmlReport() {
  const allSlots = [...EP_SLOTS, ...ALBUM_SLOTS.filter((s) => !EP_SLOTS.some((ep) => ep.id === s.id))];
  const eras: EraFilter[] = ['2000s', '2010s', '2020s', 'all'];

  // 1. Weak Coverage Diagnostics
  const weakCoverage: { slot: string; era: string; count: number }[] = [];
  allSlots.forEach((slot) => {
    eras.forEach((era) => {
      const eraPool = filterByEra(SONG_LIBRARY, era);
      const eligible = eraPool.filter((song) => {
        const affinity = getSlotAffinity(song, slot.id as SlotId);
        return affinity >= 60 || song.slots.includes(slot.id as SlotId);
      });
      if (eligible.length < 8) {
        weakCoverage.push({ slot: slot.name, era, count: eligible.length });
      }
    });
  });

  // 3. Artist Frequency Distribution
  const artistCounts: Record<string, number> = {};
  SONG_LIBRARY.forEach((song) => {
    artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
  });
  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // 4. Build HTML Output
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Album Architect — Dev Catalog Inspector</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    h1, h2, h3 { color: #f43f5e; margin-bottom: 12px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .badge-danger { background: #991b1b; color: #fca5a5; }
    .badge-warning { background: #854d0e; color: #fef08a; }
    .badge-success { background: #166534; color: #86efac; }
    .card { background: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #334155; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #334155; font-size: 14px; }
    th { background: #0f172a; color: #94a3b8; }
    tr:hover { background: #334155; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
  </style>
</head>
<body>
  <h1>🎵 Album Architect — Development Catalog Inspector</h1>
  <p>Internal audit report detailing track metadata, slot coverage, artist distribution, and structural integrity.</p>

  <div class="grid">
    <div class="card">
      <h3>Library Overview</h3>
      <p><strong>Total Tracks:</strong> ${SONG_LIBRARY.length}</p>
      <p><strong>Unique Lead Artists:</strong> ${Object.keys(artistCounts).length}</p>
      <p><strong>Actual Album Openers:</strong> ${SONG_LIBRARY.filter((s) => s.isActualAlbumOpener).length}</p>
      <p><strong>Actual Album Outros:</strong> ${SONG_LIBRARY.filter((s) => s.isActualAlbumOutro).length}</p>
    </div>

    <div class="card">
      <h3>Weak Slot × Era Combinations (<8 candidates)</h3>
      ${
        weakCoverage.length === 0
          ? '<span class="badge badge-success">All slot-era combinations have ≥ 8 candidates!</span>'
          : `<ul>${weakCoverage
              .map(
                (w) =>
                  `<li><strong>${w.slot}</strong> (${w.era}): <span class="badge badge-danger">${w.count} songs</span> (Auto-substituted with 'all')</li>`
              )
              .join('')}</ul>`
      }
    </div>

    <div class="card">
      <h3>Top Lead Artists</h3>
      <ul>
        ${topArtists.map(([artist, count]) => `<li><strong>${artist}:</strong> ${count} tracks</li>`).join('')}
      </ul>
    </div>
  </div>

  <div class="card">
    <h2>Full Catalog Inspection Table</h2>
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Artist</th>
          <th>Year</th>
          <th>Impact / Rec / Acc</th>
          <th>Opener / Outro</th>
          <th>Archetypes</th>
          <th>Primary Slots</th>
        </tr>
      </thead>
      <tbody>
        ${SONG_LIBRARY.map(
          (song) => `
          <tr>
            <td><strong>${song.title}</strong></td>
            <td>${song.artist}</td>
            <td>${song.year || 'N/A'}</td>
            <td>${song.impact} / ${song.recognition} / ${song.acclaim || 'N/A'}</td>
            <td>
              ${song.isActualAlbumOpener ? '<span class="badge badge-success">Opener</span> ' : ''}
              ${song.isActualAlbumOutro ? '<span class="badge badge-warning">Outro</span>' : ''}
              ${!song.isActualAlbumOpener && !song.isActualAlbumOutro ? '—' : ''}
            </td>
            <td>${song.archetypes.join(', ')}</td>
            <td>${song.slots.join(', ')}</td>
          </tr>`
        ).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  const outputPath = path.join(process.cwd(), 'public', 'catalog-dev-inspector.html');
  fs.writeFileSync(outputPath, htmlContent, 'utf-8');
  console.log(`\n✅ Dev Catalog Inspector HTML generated successfully at:\n   ${outputPath}\n`);
}

generateHtmlReport();
