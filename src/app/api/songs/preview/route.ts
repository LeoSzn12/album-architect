import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitHeaders, requestRateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';

interface PreviewResponse {
  previewUrl: string | null;
  artworkUrl: string | null;
  title?: string;
  artist?: string;
  album?: string;
  source: 'itunes' | 'deezer' | 'none';
}

// In-memory cache for resolved preview snippets
const previewCache = new Map<string, PreviewResponse>();
const MAX_CACHE_SIZE = 500;

function cacheKey(title: string, artist: string): string {
  return `${title.toLowerCase().trim()}::${artist.toLowerCase().trim()}`;
}

function normalizeStr(str?: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function matchesArtist(candidateArtist?: string, targetArtist?: string): boolean {
  if (!candidateArtist || !targetArtist) return false;
  const c = normalizeStr(candidateArtist);
  const t = normalizeStr(targetArtist);
  if (!c || !t) return false;
  const targetToken = normalizeStr(targetArtist.split(/[\s,&feat\.]+/)[0] || '');
  return c.includes(t) || t.includes(c) || (targetToken.length >= 3 && c.includes(targetToken));
}

async function fetchFromItunes(title: string, artist: string): Promise<PreviewResponse | null> {
  try {
    const query = `${title} ${artist}`.slice(0, 100);
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5&country=US`;
    const res = await fetch(itunesUrl, {
      headers: { 'User-Agent': 'TrackDraft/1.0' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      resultCount: number;
      results: Array<{
        previewUrl?: string;
        artworkUrl100?: string;
        trackName?: string;
        artistName?: string;
        collectionName?: string;
      }>;
    };

    if (!data.results || data.results.length === 0) return null;

    // Must match artist and have valid previewUrl
    const match = data.results.find((r) => r.previewUrl && matchesArtist(r.artistName, artist));
    if (!match || !match.previewUrl) return null;

    const artwork = match.artworkUrl100
      ? match.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
      : null;

    return {
      previewUrl: match.previewUrl,
      artworkUrl: artwork,
      title: match.trackName,
      artist: match.artistName,
      album: match.collectionName,
      source: 'itunes',
    };
  } catch {
    return null;
  }
}

async function fetchFromDeezer(title: string, artist: string): Promise<PreviewResponse | null> {
  try {
    const query = `${title} ${artist}`.slice(0, 100);
    const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=5`;
    const res = await fetch(deezerUrl, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      data?: Array<{
        preview?: string;
        title?: string;
        artist?: { name?: string };
        album?: { title?: string; cover_big?: string; cover_xl?: string };
      }>;
    };

    if (!data.data || data.data.length === 0) return null;

    // Must match artist and have valid preview
    const match = data.data.find((item) => item.preview && matchesArtist(item.artist?.name, artist));
    if (!match || !match.preview) return null;

    return {
      previewUrl: match.preview,
      artworkUrl: match.album?.cover_xl || match.album?.cover_big || null,
      title: match.title,
      artist: match.artist?.name,
      album: match.album?.title,
      source: 'deezer',
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const limiter = rateLimit(requestRateLimitKey(request, 'song-preview'), {
    limit: 120,
    windowMs: 60_000,
  });

  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'Preview resolution rate limit reached. Please wait a moment.' },
      { status: 429, headers: rateLimitHeaders(limiter) }
    );
  }

  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title')?.trim() ?? '';
  const artist = searchParams.get('artist')?.trim() ?? '';

  if (!title) {
    return NextResponse.json({ error: 'title parameter is required' }, { status: 400 });
  }

  const key = cacheKey(title, artist);
  if (previewCache.has(key)) {
    return NextResponse.json(previewCache.get(key), { headers: rateLimitHeaders(limiter) });
  }

  // 1. Try iTunes with raw title
  let resolved = await fetchFromItunes(title, artist);

  // If no match and title has parentheticals or subtitles, strip and retry
  const cleanedTitle = title.replace(/\s*\([^)]*\)\s*$/u, '').trim();
  if ((!resolved || !resolved.previewUrl) && cleanedTitle && cleanedTitle !== title) {
    resolved = await fetchFromItunes(cleanedTitle, artist);
  }

  // 2. Fallback to Deezer
  if (!resolved || !resolved.previewUrl) {
    resolved = await fetchFromDeezer(title, artist);
  }
  if ((!resolved || !resolved.previewUrl) && cleanedTitle && cleanedTitle !== title) {
    resolved = await fetchFromDeezer(cleanedTitle, artist);
  }

  const result: PreviewResponse = resolved ?? {
    previewUrl: null,
    artworkUrl: null,
    source: 'none',
  };

  if (previewCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = previewCache.keys().next().value;
    if (oldestKey) previewCache.delete(oldestKey);
  }
  previewCache.set(key, result);

  return NextResponse.json(result, { headers: rateLimitHeaders(limiter) });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { title?: string; artist?: string } | null;
  if (!body?.title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const fakeUrl = new URL(`http://localhost/api/songs/preview?title=${encodeURIComponent(body.title)}&artist=${encodeURIComponent(body.artist ?? '')}`);
  const getReq = new NextRequest(fakeUrl, {
    headers: request.headers,
  });

  return GET(getReq);
}
