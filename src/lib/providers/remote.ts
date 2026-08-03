import type { Song, SongArchetype, SlotId } from '../../types/draft.ts';
import type {
  CatalogProvider,
  ProviderAccountProfile,
  ProviderCapabilities,
  ProviderPlaylist,
  ProviderPlaylistExport,
  ProviderResult,
} from './types.ts';
import { disabledCapabilities, unsupported } from './types.ts';
import { openProviderSession, providerCookieName } from './session.ts';

type RemoteProviderId = 'spotify' | 'youtube';

const ALL_SLOTS: SlotId[] = [
  'cinematic-intro', 'statement-banger', 'gritty-anthem', 'introspective-cut', 'vibe-shift',
  'mid-interlude', 'club-bounce', 'late-night-rnb', 'experimental-flex', 'apex-climax',
  'acoustic-unplugged', 'melodic-trap', 'storyteller-cut', 'cinematic-outro',
];

const DEFAULT_ARCHETYPES: SongArchetype[] = ['value-pick'];

interface RemoteResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

function errorCode(status: number): 'disabled' | 'invalid-request' | 'unavailable' {
  if (status === 401 || status === 403) return 'disabled';
  if (status >= 400 && status < 500) return 'invalid-request';
  return 'unavailable';
}

function providerError(status: number, provider: string, detail?: string) {
  const suffix = detail ? `: ${detail}` : '';
  return { code: errorCode(status), message: `${provider} request failed (${status})${suffix}.` } as const;
}

function cleanText(value: unknown, fallback: string, max = 160) {
  return typeof value === 'string' ? value.replace(/[<>]/g, '').trim().slice(0, max) || fallback : fallback;
}

function yearFromDate(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const year = Number(value.slice(0, 4));
  return Number.isInteger(year) && year > 1900 ? year : undefined;
}

function songFromRemote(input: {
  provider: RemoteProviderId;
  id: string;
  title: unknown;
  artists: unknown;
  album?: unknown;
  year?: unknown;
  spotifyId?: string;
  youtubeId?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
}): Song {
  const artistNames = Array.isArray(input.artists)
    ? input.artists.map((artist) => cleanText((artist as { name?: unknown })?.name, 'Unknown Artist', 80))
    : [cleanText(input.artists, 'Unknown Artist', 80)];
  const artist = artistNames[0] || 'Unknown Artist';
  const featuredArtists = artistNames.slice(1);
  const rawArtistString = featuredArtists.length
    ? `${artist} feat. ${featuredArtists.join(', ')}`
    : artist;
  const title = cleanText(input.title, 'Untitled track');
  const id = `${input.provider}:${input.id}`;

  return {
    id,
    title,
    artist,
    featuredArtists,
    rawArtistString,
    album: cleanText(input.album, 'Imported collection'),
    year: yearFromDate(input.year),
    genre: 'Imported',
    typeTag: `Imported from ${input.provider === 'spotify' ? 'Spotify' : 'YouTube'}`,
    bpm: 120,
    energy: 55,
    slots: ALL_SLOTS,
    gradient: 'from-slate-700 via-purple-800 to-slate-950',
    audioSynthFreq: 220,
    spotifyId: input.spotifyId,
    youtubeId: input.youtubeId,
    spotifyUrl: input.spotifyUrl,
    youtubeUrl: input.youtubeUrl,
    impact: 50,
    recognition: 50,
    acclaim: 50,
    archetypes: DEFAULT_ARCHETYPES,
    slotAffinity: {},
  };
}

abstract class RemoteProvider implements CatalogProvider {
  abstract readonly id: RemoteProviderId;
  abstract readonly name: string;
  abstract readonly capabilities: ProviderCapabilities;
  protected readonly accessToken: string | null;

  protected constructor(accessToken: string | null) {
    this.accessToken = accessToken;
  }

  protected async json<T>(url: string, init: RequestInit = {}): Promise<ProviderResult<T>> {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
          ...(init.headers ?? {}),
        },
      }) as RemoteResponse;
      const body = await response.json().catch(() => null) as { error?: { message?: unknown } | string } | null;
      if (!response.ok) {
        const detail = typeof body?.error === 'string' ? body.error : body?.error?.message;
        return { ok: false, error: providerError(response.status, this.name, typeof detail === 'string' ? detail : undefined) };
      }
      return { ok: true, data: body as T };
    } catch {
      return { ok: false, error: { code: 'unavailable', message: `${this.name} could not be reached.` } };
    }
  }

  protected unavailable<T>(message: string): ProviderResult<T> {
    return unsupported('not-configured', message);
  }

  abstract search(query: string, limit?: number): Promise<ProviderResult<Song[]>>;
  abstract importPlaylist(reference: string): Promise<ProviderResult<ProviderPlaylist>>;
  abstract resolveUrl(url: string): Promise<ProviderResult<Song | null>>;
  abstract exportPlaylist(name: string, songs: Song[]): Promise<ProviderResult<ProviderPlaylistExport>>;
  abstract getAccountProfile(): Promise<ProviderResult<ProviderAccountProfile>>;

  getExternalPlaybackUrl(song: Song): ProviderResult<string> {
    const url = this.id === 'spotify' ? song.spotifyUrl : song.youtubeUrl;
    return url ? { ok: true, data: url } : unsupported('unavailable', `No ${this.name} playback URL is available.`);
  }
}

function spotifyIdFromReference(reference: string) {
  const trimmed = reference.trim();
  if (/^[A-Za-z0-9]{22}$/u.test(trimmed)) return trimmed;
  const uriMatch = trimmed.match(/^spotify:playlist:([A-Za-z0-9]{22})$/u);
  if (uriMatch) return uriMatch[1];
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/playlist\/([A-Za-z0-9]{22})/u);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function youtubeIdFromReference(reference: string) {
  const trimmed = reference.trim();
  if (/^[A-Za-z0-9_-]{11}$/u.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).match(/^[A-Za-z0-9_-]{11}$/u)?.[0] ?? null;
    return url.searchParams.get('v')?.match(/^[A-Za-z0-9_-]{11}$/u)?.[0] ?? null;
  } catch {
    return null;
  }
}

function youtubePlaylistIdFromReference(reference: string) {
  try {
    const url = new URL(reference.trim());
    return url.searchParams.get('list')?.match(/^[A-Za-z0-9_-]+$/u)?.[0] ?? null;
  } catch {
    return null;
  }
}

export class SpotifyRemoteProvider extends RemoteProvider {
  readonly id = 'spotify' as const;
  readonly name = 'Spotify';
  readonly capabilities = this.accessToken
    ? {
        search: { enabled: true }, importPlaylists: { enabled: true }, resolveUrl: { enabled: true },
        exportPlaylist: { enabled: true }, externalPlayback: { enabled: true }, accountProfile: { enabled: true },
      }
    : disabledCapabilities('Set a server-side Spotify access token after OAuth before using this provider.');

  async search(query: string, limit = 10): Promise<ProviderResult<Song[]>> {
    if (!this.accessToken) return this.unavailable('Spotify search needs an authenticated access token.');
    const params = new URLSearchParams({ q: query.trim().slice(0, 120), type: 'track', limit: String(Math.min(Math.max(limit, 1), 10)) });
    const result = await this.json<{ tracks?: { items?: Array<Record<string, unknown>> } }>(`https://api.spotify.com/v1/search?${params}`);
    if (!result.ok) return result;
    return {
      ok: true,
      data: (result.data.tracks?.items ?? []).flatMap((track) => {
        const id = typeof track.id === 'string' ? track.id : null;
        if (!id) return [];
        const external = track.external_urls as { spotify?: unknown } | undefined;
        const album = track.album as { name?: unknown; release_date?: unknown } | undefined;
        return [songFromRemote({ provider: 'spotify', id, title: track.name, artists: track.artists, album: album?.name, year: album?.release_date, spotifyId: id, spotifyUrl: typeof external?.spotify === 'string' ? external.spotify : `https://open.spotify.com/track/${id}` })];
      }),
    };
  }

  async importPlaylist(reference: string): Promise<ProviderResult<ProviderPlaylist>> {
    if (!this.accessToken) return this.unavailable('Spotify playlist import needs an authenticated access token.');
    const playlistId = spotifyIdFromReference(reference);
    if (!playlistId) return unsupported('invalid-request', 'Enter a Spotify playlist URL, URI, or playlist ID.');
    const result = await this.json<{ name?: unknown; items?: { items?: Array<Record<string, unknown>>; next?: string | null } }>(`https://api.spotify.com/v1/playlists/${playlistId}?fields=name,items.items(item),items.next`);
    if (!result.ok) return result;
    const tracks = result.data.items?.items ?? [];
    const songs = tracks.flatMap((entry) => {
      const track = (entry.item ?? entry.track) as Record<string, unknown> | undefined;
      const id = typeof track?.id === 'string' ? track.id : null;
      if (!id) return [];
      const external = track.external_urls as { spotify?: unknown } | undefined;
      const album = track.album as { name?: unknown; release_date?: unknown } | undefined;
      return [songFromRemote({ provider: 'spotify', id, title: track.name, artists: track.artists, album: album?.name, year: album?.release_date, spotifyId: id, spotifyUrl: typeof external?.spotify === 'string' ? external.spotify : `https://open.spotify.com/track/${id}` })];
    });
    return { ok: true, data: { id: playlistId, name: cleanText(result.data.name, 'Imported Spotify playlist'), songs } };
  }

  async resolveUrl(url: string): Promise<ProviderResult<Song | null>> {
    if (!this.accessToken) return this.unavailable('Spotify URL resolution needs an authenticated access token.');
    const id = url.match(/\/track\/([A-Za-z0-9]{22})/u)?.[1] ?? null;
    if (!id) return unsupported('invalid-request', 'Enter an official Spotify track URL.');
    const result = await this.json<Record<string, unknown>>(`https://api.spotify.com/v1/tracks/${id}`);
    if (!result.ok) return result;
    const external = result.data.external_urls as { spotify?: unknown } | undefined;
    const album = result.data.album as { name?: unknown; release_date?: unknown } | undefined;
    return { ok: true, data: songFromRemote({ provider: 'spotify', id, title: result.data.name, artists: result.data.artists, album: album?.name, year: album?.release_date, spotifyId: id, spotifyUrl: typeof external?.spotify === 'string' ? external.spotify : url }) };
  }

  async exportPlaylist(name: string, songs: Song[]): Promise<ProviderResult<ProviderPlaylistExport>> {
    if (!this.accessToken) return this.unavailable('Spotify playlist export needs an authenticated access token.');
    const create = await this.json<{ id?: string; external_urls?: { spotify?: string } }>('https://api.spotify.com/v1/me/playlists', { method: 'POST', body: JSON.stringify({ name: name.trim().slice(0, 100) || 'TrackDraft playlist', public: false, collaborative: false }) });
    if (!create.ok) return create;
    if (!create.data.id) return unsupported('unavailable', 'Spotify did not return a playlist ID.');
    const uris = songs.flatMap((song) => song.spotifyId ? [`spotify:track:${song.spotifyId}`] : []).slice(0, 100);
    if (uris.length) {
      const add = await this.json('https://api.spotify.com/v1/playlists/' + create.data.id + '/items', { method: 'POST', body: JSON.stringify({ uris }) });
      if (!add.ok) return add;
    }
    return { ok: true, data: { id: create.data.id, url: create.data.external_urls?.spotify ?? `https://open.spotify.com/playlist/${create.data.id}` } };
  }

  async getAccountProfile(): Promise<ProviderResult<ProviderAccountProfile>> {
    if (!this.accessToken) return this.unavailable('Spotify profile access needs an authenticated access token.');
    const result = await this.json<{ id?: string; display_name?: string }>('https://api.spotify.com/v1/me');
    if (!result.ok) return result;
    return { ok: true, data: { id: result.data.id ?? 'spotify-user', displayName: result.data.display_name } };
  }
}

export class YouTubeRemoteProvider extends RemoteProvider {
  readonly id = 'youtube' as const;
  readonly name = 'YouTube';
  private readonly apiKey: string | null;
  readonly capabilities: ProviderCapabilities;

  constructor(accessToken: string | null, apiKey: string | null) {
    super(accessToken);
    this.apiKey = apiKey;
    const readable = Boolean(accessToken || apiKey);
    this.capabilities = readable
      ? { search: { enabled: true }, importPlaylists: { enabled: Boolean(accessToken) }, resolveUrl: { enabled: true }, exportPlaylist: { enabled: Boolean(accessToken) }, externalPlayback: { enabled: true }, accountProfile: { enabled: Boolean(accessToken) } }
      : disabledCapabilities('Set a YouTube Data API key or OAuth access token before using this provider.');
  }

  private endpoint(path: string, params: Record<string, string>) {
    const query = new URLSearchParams(params);
    if (this.apiKey) query.set('key', this.apiKey);
    return `https://www.googleapis.com/youtube/v3/${path}?${query}`;
  }

  async search(query: string, limit = 10): Promise<ProviderResult<Song[]>> {
    if (!this.accessToken && !this.apiKey) return this.unavailable('YouTube search needs a Data API key or OAuth access token.');
    const result = await this.json<{ items?: Array<{ id?: { videoId?: string }; snippet?: Record<string, unknown> }> }>(this.endpoint('search', { part: 'snippet', type: 'video', maxResults: String(Math.min(Math.max(limit, 1), 50)), q: query.trim().slice(0, 120) }));
    if (!result.ok) return result;
    return { ok: true, data: (result.data.items ?? []).flatMap((item) => item.id?.videoId ? [songFromRemote({ provider: 'youtube', id: item.id.videoId, title: item.snippet?.title, artists: item.snippet?.channelTitle, year: item.snippet?.publishedAt, youtubeId: item.id.videoId, youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}` })] : []) };
  }

  async importPlaylist(reference: string): Promise<ProviderResult<ProviderPlaylist>> {
    if (!this.accessToken) return this.unavailable('YouTube playlist import needs an authenticated OAuth token.');
    const playlistId = youtubePlaylistIdFromReference(reference);
    if (!playlistId) return unsupported('invalid-request', 'Enter an official YouTube playlist URL.');
    const result = await this.json<{ items?: Array<{ contentDetails?: { videoId?: string }; snippet?: Record<string, unknown> }>; pageInfo?: { totalResults?: number } }>(this.endpoint('playlistItems', { part: 'snippet,contentDetails', playlistId, maxResults: '50' }));
    if (!result.ok) return result;
    const songs = (result.data.items ?? []).flatMap((item) => {
      const id = item.contentDetails?.videoId;
      return id ? [songFromRemote({ provider: 'youtube', id, title: item.snippet?.title, artists: item.snippet?.videoOwnerChannelTitle ?? item.snippet?.channelTitle, year: item.snippet?.publishedAt, youtubeId: id, youtubeUrl: `https://www.youtube.com/watch?v=${id}` })] : [];
    });
    return { ok: true, data: { id: playlistId, name: 'Imported YouTube playlist', songs } };
  }

  async resolveUrl(url: string): Promise<ProviderResult<Song | null>> {
    if (!this.accessToken && !this.apiKey) return this.unavailable('YouTube URL resolution needs a Data API key or OAuth access token.');
    const id = youtubeIdFromReference(url);
    if (!id) return unsupported('invalid-request', 'Enter an official YouTube video URL.');
    const result = await this.json<{ items?: Array<{ snippet?: Record<string, unknown> }> }>(this.endpoint('videos', { part: 'snippet', id }));
    if (!result.ok) return result;
    const snippet = result.data.items?.[0]?.snippet;
    return { ok: true, data: snippet ? songFromRemote({ provider: 'youtube', id, title: snippet.title, artists: snippet.channelTitle, year: snippet.publishedAt, youtubeId: id, youtubeUrl: url }) : null };
  }

  async exportPlaylist(name: string, songs: Song[]): Promise<ProviderResult<ProviderPlaylistExport>> {
    if (!this.accessToken) return this.unavailable('YouTube playlist export needs an authenticated OAuth token.');
    const create = await this.json<{ id?: string }>(this.endpoint('playlists', { part: 'snippet,status' }), { method: 'POST', body: JSON.stringify({ snippet: { title: name.trim().slice(0, 150) || 'TrackDraft playlist', description: 'Created by TrackDraft' }, status: { privacyStatus: 'private' } }) });
    if (!create.ok) return create;
    if (!create.data.id) return unsupported('unavailable', 'YouTube did not return a playlist ID.');
    for (const song of songs.slice(0, 100)) {
      if (!song.youtubeId) continue;
      const add = await this.json(this.endpoint('playlistItems', { part: 'snippet' }), { method: 'POST', body: JSON.stringify({ snippet: { playlistId: create.data.id, resourceId: { kind: 'youtube#video', videoId: song.youtubeId } } }) });
      if (!add.ok) return add;
    }
    return { ok: true, data: { id: create.data.id, url: `https://www.youtube.com/playlist?list=${create.data.id}` } };
  }

  async getAccountProfile(): Promise<ProviderResult<ProviderAccountProfile>> {
    if (!this.accessToken) return this.unavailable('YouTube profile access needs an authenticated OAuth token.');
    const result = await this.json<{ items?: Array<{ id?: string; snippet?: { title?: string } }> }>(this.endpoint('channels', { part: 'snippet', mine: 'true' }));
    if (!result.ok) return result;
    const channel = result.data.items?.[0];
    return { ok: true, data: { id: channel?.id ?? 'youtube-user', displayName: channel?.snippet?.title } };
  }
}

export function createRemoteProvider(provider: RemoteProviderId, requestToken?: string | null): CatalogProvider {
  const token = requestToken?.trim() || process.env[provider === 'spotify' ? 'SPOTIFY_ACCESS_TOKEN' : 'YOUTUBE_ACCESS_TOKEN']?.trim() || null;
  if (provider === 'spotify') return new SpotifyRemoteProvider(token);
  return new YouTubeRemoteProvider(token, process.env.YOUTUBE_DATA_API_KEY?.trim() || null);
}

export function providerHasCredentials(provider: RemoteProviderId) {
  if (provider === 'spotify') return Boolean(process.env.SPOTIFY_ACCESS_TOKEN?.trim());
  return Boolean(process.env.YOUTUBE_ACCESS_TOKEN?.trim() || process.env.YOUTUBE_DATA_API_KEY?.trim());
}

export function accessTokenFromRequest(request: Request, provider: RemoteProviderId) {
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/iu)?.[1]?.trim();
  if (bearer) return bearer;
  const cookie = request.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${providerCookieName(provider)}=([^;]+)`))?.[1];
  const sealed = openProviderSession(cookie);
  if (!sealed) return undefined;
  try {
    const parsed = JSON.parse(sealed) as { accessToken?: unknown };
    return typeof parsed.accessToken === 'string' ? parsed.accessToken : undefined;
  } catch {
    return undefined;
  }
}
