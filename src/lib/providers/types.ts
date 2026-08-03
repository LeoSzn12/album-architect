import type { Song } from '@/types/draft';

/** Provider identifiers used by the adapter boundary. */
export type ProviderId = 'demo' | 'spotify' | 'youtube';

export type ProviderCapability =
  | 'search'
  | 'importPlaylists'
  | 'resolveUrl'
  | 'exportPlaylist'
  | 'externalPlayback'
  | 'accountProfile';

export interface CapabilityDescriptor {
  enabled: boolean;
  reason?: string;
}

export type ProviderCapabilities = Record<ProviderCapability, CapabilityDescriptor>;

export type ProviderErrorCode =
  | 'disabled'
  | 'not-configured'
  | 'unsupported'
  | 'invalid-request'
  | 'unavailable';

export interface ProviderError {
  code: ProviderErrorCode;
  message: string;
}

export type ProviderResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ProviderError };

export interface ProviderPlaylist {
  id: string;
  name: string;
  songs: Song[];
}

export interface ProviderAccountProfile {
  id: string;
  displayName?: string;
}

export interface ProviderPlaylistExport {
  id: string;
  url?: string;
}

export interface CatalogProvider {
  readonly id: ProviderId;
  readonly name: string;
  readonly capabilities: ProviderCapabilities;

  search(query: string, limit?: number): Promise<ProviderResult<Song[]>>;
  importPlaylist(reference: string): Promise<ProviderResult<ProviderPlaylist>>;
  resolveUrl(url: string): Promise<ProviderResult<Song | null>>;
  exportPlaylist(name: string, songs: Song[]): Promise<ProviderResult<ProviderPlaylistExport>>;
  getExternalPlaybackUrl(song: Song): ProviderResult<string>;
  getAccountProfile(): Promise<ProviderResult<ProviderAccountProfile>>;
}

export const DISABLED_PROVIDER_REASON =
  'This provider adapter is scaffolded but not configured for this app yet.';

export function disabledCapabilities(reason = DISABLED_PROVIDER_REASON): ProviderCapabilities {
  return {
    search: { enabled: false, reason },
    importPlaylists: { enabled: false, reason },
    resolveUrl: { enabled: false, reason },
    exportPlaylist: { enabled: false, reason },
    externalPlayback: { enabled: false, reason },
    accountProfile: { enabled: false, reason },
  };
}

export function unsupported<T>(
  code: ProviderErrorCode,
  message: string
): ProviderResult<T> {
  return { ok: false, error: { code, message } };
}
