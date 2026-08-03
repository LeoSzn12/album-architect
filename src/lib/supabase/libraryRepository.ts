import type { Song } from '@/types/draft';
import { createSupabaseServerClient } from './server';

type ProviderId = 'spotify' | 'youtube';

function normalizedSongKey(song: Song) {
  return `${song.title}::${song.rawArtistString}`.toLowerCase().replace(/[^a-z0-9:]+/g, '-').slice(0, 240);
}

async function context() {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client.auth.getClaims();
  const userId = !error && data?.claims?.sub ? String(data.claims.sub) : null;
  return userId ? { client, userId } : null;
}

/** Persists an imported playlist as user-owned song snapshots and library items. */
export async function persistImportedPlaylist(input: {
  provider: ProviderId;
  playlistId: string;
  songs: Song[];
}) {
  const active = await context();
  if (!active) return { configured: false as const, persistedCount: 0 };
  const authUser = await active.client.auth.getUser();
  const profile = await active.client.from('users').upsert({
    id: active.userId,
    email: authUser.data.user?.email ?? null,
    display_name: authUser.data.user?.user_metadata?.full_name ?? authUser.data.user?.email?.split('@')[0] ?? 'Executive Architect',
  }, { onConflict: 'id' });
  if (profile.error) return { configured: true as const, persistedCount: 0, error: profile.error.message };

  let persistedCount = 0;
  for (const song of input.songs.slice(0, 100)) {
    const songError = await active.client.from('songs').upsert({
      id: song.id,
      canonical_title: song.title,
      canonical_artist_text: song.rawArtistString,
      release_year: song.year ?? null,
      normalized_key: normalizedSongKey(song),
      metadata_json: song,
    }, { onConflict: 'id' });
    if (songError.error) continue;

    const providerItemId = input.provider === 'spotify' ? song.spotifyId : song.youtubeId;
    if (providerItemId) {
      const ref = await active.client.from('song_provider_refs').upsert({
        song_id: song.id,
        provider: input.provider,
        provider_item_id: providerItemId,
        canonical_url: input.provider === 'spotify' ? song.spotifyUrl ?? null : song.youtubeUrl ?? null,
        raw_metadata_json: song,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'provider,provider_item_id' });
      if (ref.error) continue;
    }

    const libraryItem = await active.client.from('library_items').upsert({
      user_id: active.userId,
      song_id: song.id,
      source: 'import',
      source_playlist_id: `${input.provider}:${input.playlistId}`,
    }, { onConflict: 'user_id,song_id,source_playlist_id' });
    if (!libraryItem.error) persistedCount += 1;
  }
  return { configured: true as const, persistedCount };
}
