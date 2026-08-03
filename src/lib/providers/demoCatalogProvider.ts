import { SONG_LIBRARY } from '@/data/songs';
import type {
  CatalogProvider,
  ProviderAccountProfile,
  ProviderCapabilities,
  ProviderPlaylist,
  ProviderPlaylistExport,
  ProviderResult,
} from './types';
import { unsupported } from './types';
import type { Song } from '@/types/draft';

const DEMO_CAPABILITIES: ProviderCapabilities = {
  search: { enabled: true },
  importPlaylists: { enabled: false, reason: 'The demo catalog is read-only.' },
  resolveUrl: { enabled: false, reason: 'Demo songs are selected from the seeded catalog.' },
  exportPlaylist: { enabled: false, reason: 'The demo catalog has no external account.' },
  externalPlayback: { enabled: true, reason: 'Uses links already present on a Song when available.' },
  accountProfile: { enabled: false, reason: 'The demo catalog has no account connection.' },
};

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function matches(song: Song, query: string): boolean {
  const haystack = [song.title, song.artist, song.album, song.genre, song.typeTag]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();
  return haystack.includes(query);
}

/** Read-only provider backed by the repository's existing curated catalog. */
export class DemoCatalogProvider implements CatalogProvider {
  readonly id = 'demo' as const;
  readonly name = 'Demo catalog';
  readonly capabilities = DEMO_CAPABILITIES;

  async search(query: string, limit = 20): Promise<ProviderResult<Song[]>> {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return { ok: true, data: SONG_LIBRARY.slice(0, limit) };

    return {
      ok: true,
      data: SONG_LIBRARY.filter((song) => matches(song, normalizedQuery)).slice(0, limit),
    };
  }

  async importPlaylist(): Promise<ProviderResult<ProviderPlaylist>> {
    return unsupported('unsupported', 'The demo catalog does not import playlists.');
  }

  async resolveUrl(): Promise<ProviderResult<Song | null>> {
    return unsupported('unsupported', 'The demo catalog does not resolve external URLs.');
  }

  async exportPlaylist(): Promise<ProviderResult<ProviderPlaylistExport>> {
    return unsupported('unsupported', 'The demo catalog does not export playlists.');
  }

  getExternalPlaybackUrl(song: Song): ProviderResult<string> {
    if (song.youtubeUrl) return { ok: true, data: song.youtubeUrl };
    if (song.spotifyUrl) return { ok: true, data: song.spotifyUrl };
    return unsupported('unavailable', 'This demo song has no external playback link.');
  }

  async getAccountProfile(): Promise<ProviderResult<ProviderAccountProfile>> {
    return unsupported('unsupported', 'The demo catalog has no account profile.');
  }
}
