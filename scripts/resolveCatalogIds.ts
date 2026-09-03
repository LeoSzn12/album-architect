/**
 * Catalog ID Resolution Script
 * ----------------------------
 * Resolves missing/placeholder provider IDs for every song in the catalog:
 *
 *  1. iTunes Search API  (ALWAYS runs — free, no API key)
 *     → appleMusicId, appleMusicPreviewUrl (official 30–90s .m4a audio),
 *       appleMusicUrl
 *  2. YouTube Data API   (runs when YOUTUBE_DATA_API_KEY is set)
 *     → youtubeId (full-song embed)
 *  3. Spotify Web API    (runs when SPOTIFY_ACCESS_TOKEN is set — obtained
 *     after the OAuth flow in Phase 2)
 *     → spotifyId (30s snippet embed)
 *
 * Writes resolved IDs directly back into src/data/songs.ts.
 *
 * Usage:
 *   node --experimental-strip-types scripts/resolveCatalogIds.ts [--dry-run]
 *   node --experimental-strip-types scripts/resolveCatalogIds.ts --only-youtube 25
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SONGS_PATH = resolve(ROOT, 'src/data/songs.ts');
const ITUNES_SEARCH = 'https://itunes.apple.com/search';
const YT_SEARCH = 'https://www.googleapis.com/youtube/v3/search';
const SPOTIFY_SEARCH = 'https://api.spotify.com/v1/search';

const USE_DRY_RUN = process.argv.includes('--dry-run');
const onlyIndex = process.argv.findIndex((a) => a === '--only-youtube');
const ONLY_YOUTUBE_LIMIT = onlyIndex !== -1 ? Number(process.argv[onlyIndex + 1]) || 25 : Number.POSITIVE_INFINITY;

// ---------------------------------------------------------------------------
// Normalization helpers for fuzzy matching
// ---------------------------------------------------------------------------
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Strip common parenthetical suffixes like "(Acoustic)", "(Interlude)"
  const strip = (s: string) => s.replace(/\s*\([^)]*\)\s*$/u, '').trim();
  const sa = strip(na);
  const sb = strip(nb);
  return sa.length >= 4 && (sa === sb || sa.includes(sb) || sb.includes(sa));
}

function artistMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na.length >= 3 && (na === nb || na.includes(nb) || nb.includes(na));
}

function scoreResult(title: string, artist: string, result: { trackName?: string; artistName?: string }): number {
  let score = 0;
  if (titleMatch(title, result.trackName ?? '')) score += 60;
  if (artistMatch(artist, result.artistName ?? '')) score += 40;
  return score;
}

// ---------------------------------------------------------------------------
// Source fetching
// ---------------------------------------------------------------------------
interface Resolved {
  source: string;
  id?: string;
  url?: string;
  previewUrl?: string;
  artworkUrl?: string;
}

async function resolveFromItunes(title: string, artist: string): Promise<{ ok: boolean; match: Resolved | null }> {
  const params = new URLSearchParams({
    term: `${title} ${artist}`.slice(0, 200),
    entity: 'song',
    limit: '8',
    country: 'US',
  });
  try {
    const response = await fetch(`${ITUNES_SEARCH}?${params}`);
    if (!response.ok) return { ok: false, match: null };
    const body = (await response.json()) as {
      resultCount?: number;
      results?: Array<{
        trackId: number;
        trackName?: string;
        artistName?: string;
        previewUrl?: string;
        trackViewUrl?: string;
        artworkUrl100?: string;
      }>;
    };
    const best = (body.results ?? [])
      .map((r) => ({ r, score: scoreResult(title, artist, r) }))
      .sort((a, b) => b.score - a.score)[0];
    if (!best || best.score < 60) return { ok: true, match: null };
    // Upgrade the 100×100 thumbnail to a larger square for UI display.
    const artworkUrl = best.r.artworkUrl100?.replace('100x100', '300x300');
    return {
      ok: true,
      match: {
        source: 'itunes',
        id: String(best.r.trackId),
        previewUrl: best.r.previewUrl,
        url: best.r.trackViewUrl,
        artworkUrl,
      },
    };
  } catch {
    return { ok: false, match: null };
  }
}

async function resolveFromYouTube(title: string, artist: string, apiKey: string): Promise<{ ok: boolean; match: Resolved | null }> {
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '5',
    q: `${title} ${artist} official audio`,
    key: apiKey,
  });
  try {
    const response = await fetch(`${YT_SEARCH}?${params}`);
    if (!response.ok) return { ok: false, match: null };
    const body = (await response.json()) as {
      items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string } }>;
    };
    const best = (body.items ?? [])
      .map((item) => ({
        id: item.id?.videoId,
        score: scoreResult(title, artist, {
          trackName: item.snippet?.title,
          artistName: item.snippet?.channelTitle,
        }) + (item.snippet?.title?.toLowerCase().includes('official') ? 5 : 0),
      }))
      .filter((c) => c.id && /^[A-Za-z0-9_-]{11}$/u.test(c.id))
      .sort((a, b) => b.score - a.score)[0];
    if (!best || best.score < 50) return { ok: true, match: null };
    return { ok: true, match: { source: 'youtube', id: best.id, url: `https://www.youtube.com/watch?v=${best.id}` } };
  } catch {
    return { ok: false, match: null };
  }
}

async function resolveFromSpotify(title: string, artist: string, token: string): Promise<{ ok: boolean; match: Resolved | null }> {
  const params = new URLSearchParams({ q: `track:"${title}" artist:"${artist}"`.slice(0, 200), type: 'track', limit: '5' });
  try {
    const response = await fetch(`${SPOTIFY_SEARCH}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return { ok: false, match: null };
    const body = (await response.json()) as {
      tracks?: { items?: Array<{ id?: string; name?: string; artists?: Array<{ name?: string }>; external_urls?: { spotify?: string } }> };
    };
    const best = (body.tracks?.items ?? [])
      .map((t) => ({
        id: t.id,
        score: scoreResult(title, artist, {
          trackName: t.name,
          artistName: (t.artists ?? []).map((a) => a.name).join(' '),
        }),
        url: t.external_urls?.spotify,
      }))
      .filter((c) => c.id && /^[A-Za-z0-9]{22}$/u.test(c.id))
      .sort((a, b) => b.score - a.score)[0];
    if (!best || best.score < 60) return { ok: true, match: null };
    return { ok: true, match: { source: 'spotify', id: best.id, url: best.url } };
  } catch {
    return { ok: false, match: null };
  }
}

// ---------------------------------------------------------------------------
// Source text patching
// ---------------------------------------------------------------------------
function patchSongsSource(
  source: string,
  patches: Map<string, { field: string; value: string }[]>
): { updated: string; applied: number } {
  const lines = source.split('\n');
  let applied = 0;
  let currentId: string | null = null;
  // Regexes: field name + optional whitespace + string value
  const fieldValue = (line: string, field: string) => {
    const match = line.match(new RegExp(`^\\s*${field}:\\s*'([^']*)',?\\s*$`));
    return match ? match[1] : null;
  };

  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    out.push(lines[i]);
    const idMatch = lines[i].match(/^\s*id:\s*'([^']+)',$/u);
    if (idMatch) {
      currentId = idMatch[1];
      continue;
    }
    if (!currentId) continue;
    const patchList = patches.get(currentId);
    if (!patchList || patchList.length === 0) continue;
    for (const patch of patchList) {
      const existing = fieldValue(lines[i], patch.field);
      if (existing !== null) {
        out[out.length - 1] = lines[i].replace(new RegExp(`(${patch.field}:\\s*')([^']*)(')`, 'u'), `$1${patch.value}$3`);
        applied++;
      }
    }
  }
  return { updated: out.join('\n'), applied };
}

function insertMissingFields(
  source: string,
  patches: Map<string, Array<{ field: string; value: string }>>
): { updated: string; applied: number } {
  const lines = source.split('\n');
  let applied = 0;
  let currentId: string | null = null;
  const out: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    out.push(line);
    const idMatch = line.match(/^\s*id:\s*'([^']+)',$/u);
    if (idMatch) {
      currentId = idMatch[1];
      seen.clear();
      continue;
    }
    if (!currentId) continue;
    const patchList = patches.get(currentId);
    if (!patchList || patchList.length === 0) continue;

    const field = fieldOnLine(line);
    if (field) seen.add(field);

    // Insert after the audioSynthFreq line (end of the audio block), before impact/recognition
    if (/^\s*audioSynthFreq:\s*\d+,?\s*$/u.test(line)) {
      const toAdd = patchList.filter((p) => !seen.has(p.field));
      if (toAdd.length > 0) {
        const indent = line.match(/^\s*/u)?.[0] ?? '  ';
        for (const p of toAdd) {
          out.push(`${indent}${p.field}: '${p.value}',`);
          applied++;
        }
      }
    }
  }
  return { updated: out.join('\n'), applied };
}

function fieldOnLine(line: string): string | null {
  const match = line.match(/^\s*([a-zA-Z][a-zA-Z0-9]*):\s*'/u);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const source = readFileSync(SONGS_PATH, 'utf8');
  // Pull song metadata: id, title, artist with a lightweight block scanner
  const idPattern = /^\s*id:\s*'([^']+)',$/gmu;
  const titlePattern = /^\s*title:\s*'((?:[^'\\]|\\.)*)',?$/mu;
  const artistPattern = /^\s*artist:\s*'((?:[^'\\]|\\.)*)',?$/mu;

  interface Meta { id: string; title: string; artist: string }
  const metas: Meta[] = [];
  const idMatches = [...source.matchAll(idPattern)].map((m) => m.index!);
  idMatches.forEach((start, idx) => {
    const end = idx + 1 < idMatches.length ? idMatches[idx + 1] : source.length;
    const block = source.slice(start, end);
    const title = block.match(titlePattern)?.[1]?.replace(/\\'/g, "'") ?? '';
    const artist = block.match(artistPattern)?.[1]?.replace(/\\'/g, "'") ?? '';
    const id = block.match(/^\s*id:\s*'([^']+)',$/u)?.[1] ?? '';
    if (id) metas.push({ id, title, artist });
  });
  // Fallback: also scan full-file for ids if block approach fails
  if (metas.length === 0) {
    for (const m of source.matchAll(/\bid:\s*'([^']+)',\s*\n\s*title:\s*'((?:[^'\\]|\\.)*)',\s*\n\s*artist:\s*'((?:[^'\\]|\\.)*)',/gu)) {
      metas.push({ id: m[1], title: m[2].replace(/\\'/g, "'"), artist: m[3].replace(/\\'/g, "'") });
    }
  }

  console.log(`Loaded ${metas.length} songs from catalog.\n`);

  const hasYoutubeKey = Boolean(process.env.YOUTUBE_DATA_API_KEY?.trim());
  const spotifyToken = process.env.SPOTIFY_ACCESS_TOKEN?.trim();

  const patches = new Map<string, Array<{ field: string; value: string }>>();
  let itunesHit = 0;
  let itunesMiss = 0;
  let youtubeHit = 0;
  let spotifyHit = 0;

  for (let i = 0; i < metas.length; i++) {
    const song = metas[i];
    const all: Array<{ field: string; value: string }> = [];

    // 1) iTunes (free, always)
    const it = await resolveFromItunes(song.title, song.artist);
    if (it.ok && it.match) {
      all.push({ field: 'appleMusicId', value: it.match.id! });
      if (it.match.previewUrl) all.push({ field: 'appleMusicPreviewUrl', value: it.match.previewUrl });
      if (it.match.url) all.push({ field: 'appleMusicUrl', value: it.match.url });
      if (it.match.artworkUrl) all.push({ field: 'artwork', value: it.match.artworkUrl });
      itunesHit++;
    } else {
      itunesMiss++;
    }

    // 2) YouTube
    if (hasYoutubeKey && i < ONLY_YOUTUBE_LIMIT) {
      const yt = await resolveFromYouTube(song.title, song.artist, process.env.YOUTUBE_DATA_API_KEY!.trim());
      if (yt.ok && yt.match) {
        all.push({ field: 'youtubeId', value: yt.match.id! });
        if (yt.match.url) all.push({ field: 'youtubeUrl', value: yt.match.url });
        youtubeHit++;
      }
    }

    // 3) Spotify
    if (spotifyToken) {
      const sp = await resolveFromSpotify(song.title, song.artist, spotifyToken);
      if (sp.ok && sp.match) {
        all.push({ field: 'spotifyId', value: sp.match.id! });
        if (sp.match.url) all.push({ field: 'spotifyUrl', value: sp.match.url });
        spotifyHit++;
      }
    }

    if (all.length > 0) patches.set(song.id, all);

    if ((i + 1) % 10 === 0) {
      console.log(`Progress: ${i + 1}/${metas.length} · iTunes hits ${itunesHit} · YouTube hits ${youtubeHit} · Spotify hits ${spotifyHit}`);
    }
    // polite pacing for the free iTunes API
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\nResolution summary:`);
  console.log(`  iTunes : ${itunesHit} resolved, ${itunesMiss} unmatched`);
  console.log(`  YouTube: ${youtubeHit} resolved${hasYoutubeKey ? '' : ' (set YOUTUBE_DATA_API_KEY to enable)'}`);
  console.log(`  Spotify: ${spotifyHit} resolved${spotifyToken ? '' : ' (set SPOTIFY_ACCESS_TOKEN to enable)'}`);
  console.log(`  Songs with ≥1 patch: ${patches.size}`);

  if (USE_DRY_RUN) {
    console.log('\nDry run — no file written. Sample patches:');
    const sample = [...patches.entries()].slice(0, 5);
    for (const [id, fields] of sample) {
      console.log(`  ${id}: ${fields.map((f) => `${f.field}='${f.value.slice(0, 60)}'`).join(', ')}`);
    }
    return;
  }

  // Patch existing fields first (replace placeholders), then insert missing fields
  let updated = source;
  const { updated: patched, applied } = patchSongsSource(updated, patches);
  updated = patched;
  const insertResult = insertMissingFields(updated, patches);
  updated = insertResult.updated;
  const totalApplied = applied + insertResult.applied;

  writeFileSync(SONGS_PATH, updated, 'utf8');
  console.log(`\nWrote ${totalApplied} field updates to src/data/songs.ts`);
}

main().catch((err) => {
  console.error('Resolution failed:', err);
  process.exit(1);
});
