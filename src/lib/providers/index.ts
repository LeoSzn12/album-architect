import { DemoCatalogProvider } from './demoCatalogProvider';
import type { CatalogProvider, ProviderId } from './types';
import { disabledCapabilities, DISABLED_PROVIDER_REASON, unsupported } from './types';
import type { ProviderAccountProfile, ProviderPlaylist, ProviderPlaylistExport, ProviderResult } from './types';
import type { Song } from '@/types/draft';

class DisabledProvider implements CatalogProvider {
  readonly capabilities = disabledCapabilities();

  constructor(
    readonly id: Exclude<ProviderId, 'demo'>,
    readonly name: string
  ) {}

  search(): Promise<ProviderResult<Song[]>> {
    return Promise.resolve(unsupported('disabled', DISABLED_PROVIDER_REASON));
  }

  importPlaylist(): Promise<ProviderResult<ProviderPlaylist>> {
    return Promise.resolve(unsupported('disabled', DISABLED_PROVIDER_REASON));
  }

  resolveUrl(): Promise<ProviderResult<Song | null>> {
    return Promise.resolve(unsupported('disabled', DISABLED_PROVIDER_REASON));
  }

  exportPlaylist(): Promise<ProviderResult<ProviderPlaylistExport>> {
    return Promise.resolve(unsupported('disabled', DISABLED_PROVIDER_REASON));
  }

  getExternalPlaybackUrl(): ProviderResult<string> {
    return unsupported('disabled', DISABLED_PROVIDER_REASON);
  }

  getAccountProfile(): Promise<ProviderResult<ProviderAccountProfile>> {
    return Promise.resolve(unsupported('disabled', DISABLED_PROVIDER_REASON));
  }
}

/** Capability-only scaffold; OAuth and API calls are intentionally not enabled. */
export class SpotifyProvider extends DisabledProvider {
  constructor() {
    super('spotify', 'Spotify');
  }
}

/** Capability-only scaffold; Google/YouTube API calls are intentionally not enabled. */
export class YouTubeProvider extends DisabledProvider {
  constructor() {
    super('youtube', 'YouTube');
  }
}

export const demoCatalogProvider = new DemoCatalogProvider();
export const spotifyProvider = new SpotifyProvider();
export const youtubeProvider = new YouTubeProvider();

export const providers: readonly CatalogProvider[] = [
  demoCatalogProvider,
  spotifyProvider,
  youtubeProvider,
];

export function getProvider(id: ProviderId): CatalogProvider {
  return providers.find((provider) => provider.id === id) ?? demoCatalogProvider;
}
