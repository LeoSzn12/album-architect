import { NextRequest, NextResponse } from 'next/server';
import { accessTokenFromRequest, createRemoteProvider } from '@/lib/providers/remote';
import type { Song } from '@/types/draft';
import type { ProviderId } from '@/lib/providers/types';

export const runtime = 'nodejs';

function exportSong(value: unknown): Song | null {
  if (!value || typeof value !== 'object') return null;
  const song = value as Record<string, unknown>;
  if (typeof song.id !== 'string' || typeof song.title !== 'string' || typeof song.artist !== 'string') return null;
  return {
    id: song.id,
    title: song.title.slice(0, 160),
    artist: song.artist.slice(0, 120),
    featuredArtists: [],
    rawArtistString: song.artist.slice(0, 160),
    genre: 'Imported',
    typeTag: 'Imported track',
    bpm: 120,
    energy: 55,
    slots: [],
    gradient: 'from-slate-700 to-slate-950',
    audioSynthFreq: 220,
    impact: 50,
    recognition: 50,
    archetypes: ['value-pick'],
    slotAffinity: {},
    spotifyId: typeof song.spotifyId === 'string' ? song.spotifyId : undefined,
    youtubeId: typeof song.youtubeId === 'string' ? song.youtubeId : undefined,
    spotifyUrl: typeof song.spotifyUrl === 'string' ? song.spotifyUrl : undefined,
    youtubeUrl: typeof song.youtubeUrl === 'string' ? song.youtubeUrl : undefined,
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { provider?: ProviderId; name?: string; songs?: unknown[] } | null;
  if ((body?.provider !== 'spotify' && body?.provider !== 'youtube') || typeof body.name !== 'string' || !body.name.trim() || !Array.isArray(body.songs) || body.songs.length > 100) {
    return NextResponse.json({ error: 'Expected a provider, playlist name, and up to 100 songs.' }, { status: 400 });
  }
  const songs = body.songs.map(exportSong);
  if (songs.some((song) => song === null)) return NextResponse.json({ error: 'Every song must include an id, title, and artist.' }, { status: 400 });
  const result = await createRemoteProvider(body.provider, accessTokenFromRequest(request, body.provider)).exportPlaylist(body.name, songs as Song[]);
  return result.ok
    ? NextResponse.json({ provider: body.provider, playlist: result.data })
    : NextResponse.json({ provider: body.provider, error: result.error }, { status: result.error.code === 'invalid-request' ? 400 : 503 });
}
