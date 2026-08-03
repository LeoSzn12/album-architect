import { createHash, randomBytes } from 'node:crypto';
import type { ProviderId } from './types';

export interface OAuthProviderConfig {
  provider: Exclude<ProviderId, 'demo'>;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  authorizationEndpoint: string;
  scopes: string[];
}

export interface PkceRequest {
  provider: Exclude<ProviderId, 'demo'>;
  state: string;
  codeVerifier: string;
  authorizationUrl: string;
}

const configs: Record<Exclude<ProviderId, 'demo'>, Omit<OAuthProviderConfig, 'clientId' | 'redirectUri'>> = {
  spotify: {
    provider: 'spotify',
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
    scopes: ['playlist-read-private', 'playlist-modify-public', 'playlist-modify-private', 'user-read-private'],
  },
  youtube: {
    provider: 'youtube',
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: ['https://www.googleapis.com/auth/youtube.force-ssl'],
  },
};

function env(name: string) {
  return process.env[name]?.trim() ?? '';
}

export function getOAuthProviderConfig(provider: Exclude<ProviderId, 'demo'>): OAuthProviderConfig | null {
  const prefix = provider === 'spotify' ? 'SPOTIFY' : 'YOUTUBE';
  const clientId = env(`${prefix}_CLIENT_ID`);
  const redirectUri = env(`${prefix}_REDIRECT_URI`);
  if (!clientId || !redirectUri) return null;
  const clientSecret = env(`${prefix}_CLIENT_SECRET`);
  return { ...configs[provider], clientId, redirectUri, ...(clientSecret ? { clientSecret } : {}) };
}

function base64Url(value: Buffer) {
  return value.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

export function createPkceRequest(provider: Exclude<ProviderId, 'demo'>): PkceRequest | null {
  const config = getOAuthProviderConfig(provider);
  if (!config) return null;

  const state = base64Url(randomBytes(24));
  const codeVerifier = base64Url(randomBytes(48));
  const challenge = base64Url(createHash('sha256').update(codeVerifier).digest());
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    scope: config.scopes.join(' '),
  });
  if (provider === 'youtube') params.set('access_type', 'offline');

  return { provider, state, codeVerifier, authorizationUrl: `${config.authorizationEndpoint}?${params}` };
}
