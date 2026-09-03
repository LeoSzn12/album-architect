'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Spotify Web Playback SDK integration for full-track in-browser playback.
 *
 * Requires:
 *  - User has granted `streaming` scope via the existing OAuth flow
 *  - User has Spotify Premium
 *  - A server route serving the access token (see
 *    /api/auth/provider/spotify/playback-token) so the raw token never lives
 *    in a publicly-readable client bundle.
 *
 * The SDK script is loaded lazily on first connect. The hook exposes a small
 * player API (playTrack / pause / resume / seek / volume) plus status flags
 * (isReady, isPremium, error) for graceful UI degradation.
 */

// ---------------------------------------------------------------------------
// Minimal inline types for the Spotify Web Playback SDK.
// No @types dependency required — the SDK is loaded via <script> tag.
// ---------------------------------------------------------------------------
interface RawSpotifyTrack {
  name?: string;
  artists?: Array<{ name?: string }>;
}

interface RawSpotifyPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window?: { current_track?: RawSpotifyTrack };
}

interface SpotifyPlayerInstance {
  _options?: { id?: string };
  connect(): Promise<boolean>;
  disconnect(): void;
  activateElement(): Promise<void>;
  getCurrentState(): Promise<RawSpotifyPlaybackState | null>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  togglePlay(): Promise<void>;
  addListener(event: 'ready' | 'not_ready' | 'player_state_changed' | 'authentication_error' | 'account_error' | 'initialization_error', callback: (state?: unknown) => void): boolean;
  removeListener(event: string, callback?: (state?: unknown) => void): boolean;
}

interface SpotifyPlayerConstructor {
  new (options: {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume?: number;
  }): SpotifyPlayerInstance;
}

interface SpotifyNamespace {
  Player: SpotifyPlayerConstructor;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSdkReady?: () => void;
    Spotify?: SpotifyNamespace;
  }
}

// ---------------------------------------------------------------------------
// Module-level SDK loader (single script tag, shared across hook instances)
// ---------------------------------------------------------------------------
const readyHandlers: Array<() => void> = [];
let sdkLoadPromise: Promise<void> | null = null;
let sdkResolved = false;

function handleSdkReady() {
  sdkResolved = true;
  readyHandlers.splice(0).forEach((handler) => handler());
}

function ensureSdkLoaded(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Spotify Web Playback SDK requires a browser.'));
  }
  if (window.Spotify || sdkResolved) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise<void>((resolve, reject) => {
    readyHandlers.push(resolve);
    // Assign the ready callback once. Subsequent resolutions flow through the
    // readyHandlers array above.
    window.onSpotifyWebPlaybackSdkReady = handleSdkReady;

    if (!document.getElementById('spotify-player-sdk')) {
      const script = document.createElement('script');
      script.id = 'spotify-player-sdk';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      script.onerror = () => {
        sdkLoadPromise = null;
        readyHandlers.length = 0;
        reject(new Error('Failed to load the Spotify Web Playback SDK script.'));
      };
      document.head.appendChild(script);
    }
  });
  return sdkLoadPromise;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
export type SpotifyPlayerStatus =
  | 'idle'
  | 'loading-token'
  | 'loading-sdk'
  | 'connecting'
  | 'ready'
  | 'not-ready'
  | 'error';

export interface SpotifyPlaybackSnapshot {
  paused: boolean;
  positionMs: number;
  durationMs: number;
  trackName?: string;
  artistName?: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useSpotifyPlayer() {
  const [status, setStatus] = useState<SpotifyPlayerStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [currentState, setCurrentState] = useState<SpotifyPlaybackSnapshot | null>(null);

  const playerRef = useRef<SpotifyPlayerInstance | null>(null);
  const tokenRef = useRef<string | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const statusRef = useRef<SpotifyPlayerStatus>('idle');
  const errorRef = useRef<string | null>(null);

  const updateStatus = (next: SpotifyPlayerStatus) => {
    statusRef.current = next;
    setStatus(next);
  };

  const updateError = (message: string | null) => {
    errorRef.current = message;
    setError(message);
  };

  const refreshPlaybackState = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      const state = await player.getCurrentState();
      if (state) {
        const track = state.track_window?.current_track;
        setCurrentState({
          paused: state.paused,
          positionMs: state.position || 0,
          durationMs: state.duration || 0,
          trackName: track?.name,
          artistName: track?.artists?.map((artist) => artist.name).join(', '),
        });
      }
    } catch {
      // State unavailable — ignore.
    }
  }, []);

  const disconnect = useCallback(() => {
    const player = playerRef.current;
    if (player) {
      try {
        player.disconnect();
      } catch {
        // Already disconnected.
      }
    }
    playerRef.current = null;
    tokenRef.current = null;
    deviceIdRef.current = null;
    setIsReady(false);
    setIsPremium(false);
    setCurrentState(null);
    updateError(null);
    updateStatus('idle');
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined') return;
    // Already connected or mid-connection.
    if (statusRef.current === 'ready' || statusRef.current === 'connecting') return;

    updateError(null);

    // 1) Fetch the access token from the httpOnly session (server-side).
    updateStatus('loading-token');
    const tokenResponse = await fetch('/api/auth/provider/spotify/playback-token');
    if (!tokenResponse.ok) {
      const body = (await tokenResponse.json().catch(() => null)) as { error?: string } | null;
      updateError(
        body?.error ??
          'Not connected to Spotify. Connect your Spotify account in Setup first.',
      );
      updateStatus('error');
      return;
    }
    const { accessToken } = (await tokenResponse.json()) as { accessToken?: string };
    if (!accessToken) {
      updateError('Spotify did not return a playback token.');
      updateStatus('error');
      return;
    }
    tokenRef.current = accessToken;

    // 2) Load the SDK (idempotent — shares the script tag).
    updateStatus('loading-sdk');
    try {
      await ensureSdkLoaded();
    } catch (err) {
      updateError(err instanceof Error ? err.message : 'Failed to load Spotify SDK.');
      updateStatus('error');
      return;
    }
    if (!window.Spotify) {
      updateError('Spotify SDK loaded but is unavailable.');
      updateStatus('error');
      return;
    }

    // 3) Create the player.
    updateStatus('connecting');
    const player = new window.Spotify.Player({
      name: 'Album Architect',
      getOAuthToken: (callback: (token: string) => void) => callback(tokenRef.current ?? ''),
      volume: 0.8,
    });
    playerRef.current = player;

    player.addListener('ready', async (arg) => {
      const { device_id } = (arg ?? {}) as { device_id?: string };
      if (device_id) deviceIdRef.current = device_id;
      try {
        await player.activateElement();
      } catch {
        // Element activation can fail if no user gesture — non-fatal.
      }
      setIsPremium(true);
      setIsReady(true);
      updateStatus('ready');
      void refreshPlaybackState();
    });

    player.addListener('not_ready', (arg) => {
      const { device_id } = (arg ?? {}) as { device_id?: string };
      if (device_id) deviceIdRef.current = device_id;
      setIsReady(false);
      updateStatus('not-ready');
    });

    player.addListener('player_state_changed', (state) => {
      const raw = state as RawSpotifyPlaybackState | null;
      if (!raw) return;
      const track = raw.track_window?.current_track;
      setCurrentState({
        paused: raw.paused,
        positionMs: raw.position || 0,
        durationMs: raw.duration || 0,
        trackName: track?.name,
        artistName: track?.artists?.map((artist) => artist.name).join(', '),
      });
    });

    player.addListener('authentication_error', () => {
      updateError('Spotify authentication failed. Re-connect your Spotify account.');
      updateStatus('error');
    });

    player.addListener('account_error', () => {
      updateError('Spotify account error — Web Playback requires Spotify Premium.');
      setIsPremium(false);
      updateStatus('error');
    });

    player.addListener('initialization_error', () => {
      updateError('Spotify Web Playback SDK failed to initialize.');
      updateStatus('error');
    });

    try {
      const connected = await player.connect();
      if (!connected) {
        updateError('Spotify player could not connect. Open your Spotify app to enable the device.');
        updateStatus('not-ready');
      }
    } catch {
      updateError('Spotify player connection failed.');
      updateStatus('error');
    }
  }, [refreshPlaybackState]);

  const playTrack = useCallback(async (spotifyId: string) => {
    const token = tokenRef.current;
    if (!token || !spotifyId) {
      updateError('Connect Spotify and pick a track first.');
      return;
    }

    // Activate the device (must originate from a user gesture to autoplay).
    if (playerRef.current) {
      try {
        await playerRef.current.activateElement();
      } catch {
        // Non-fatal — REST transfer below still selects this device.
      }
    }

    const deviceId = deviceIdRef.current;
    if (!deviceId) {
      updateError('No active Spotify device yet — try again in a moment.');
      return;
    }

    // REST transfer: tell Spotify to play this track on the SDK device.
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [`spotify:track:${spotifyId}`] }),
      },
    );
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      updateError(body?.error?.message ?? 'Spotify could not start playback.');
      updateStatus('error');
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      await playerRef.current?.pause();
    } catch {
      // Ignore.
    }
  }, []);

  const resume = useCallback(async () => {
    try {
      await playerRef.current?.resume();
    } catch {
      // Ignore.
    }
  }, []);

  const togglePlay = useCallback(async () => {
    try {
      await playerRef.current?.togglePlay();
    } catch {
      // Ignore.
    }
  }, []);

  const seek = useCallback(async (positionMs: number) => {
    try {
      await playerRef.current?.seek(positionMs);
    } catch {
      // Ignore.
    }
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    try {
      await playerRef.current?.setVolume(Math.max(0, Math.min(1, volume)));
    } catch {
      // Ignore.
    }
  }, []);

  // Clean up the SDK player on unmount.
  useEffect(() => {
    return () => {
      const player = playerRef.current;
      if (player) {
        try {
          player.disconnect();
        } catch {
          // Already disconnected.
        }
      }
    };
  }, []);

  return {
    status,
    error,
    isReady,
    isPremium,
    currentState,
    connect,
    disconnect,
    playTrack,
    pause,
    resume,
    togglePlay,
    seek,
    setVolume,
  };
}
