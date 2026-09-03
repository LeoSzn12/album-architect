import type { AudioSourcePreference, Song } from '@/types/draft';

// ---------------------------------------------------------------------------
// ID Validators
// ---------------------------------------------------------------------------

/**
 * YouTube video IDs are exactly 11 characters: alphanumeric, dash, underscore.
 * Returns true only for valid IDs — not search terms or playlist IDs.
 * Used to gate iframe embed rendering to prevent broken iframes.
 */
export function isValidYouTubeId(id: string | undefined): id is string {
  if (!id) return false;
  return /^[A-Za-z0-9_-]{11}$/.test(id);
}

/**
 * Spotify track IDs are 22-character base62 strings (no dashes).
 */
export function isValidSpotifyId(id: string | undefined): id is string {
  if (!id) return false;
  return /^[A-Za-z0-9]{22}$/.test(id);
}

/**
 * Apple Music track IDs are numeric (e.g. "1440843554").
 * The embed + preview URL both key off this ID.
 */
export function isValidAppleMusicId(id: string | undefined): id is string {
  if (!id) return false;
  return /^[0-9]{6,12}$/.test(id);
}

// ---------------------------------------------------------------------------
// External Link Helpers (always return a usable URL)
// ---------------------------------------------------------------------------

/**
 * Returns a YouTube Music link — opens search if no valid ID is available.
 */
export function getYouTubeMusicUrl(song: Song): string {
  if (song.youtubeUrl) return song.youtubeUrl;
  if (isValidYouTubeId(song.youtubeId)) {
    return `https://music.youtube.com/watch?v=${song.youtubeId}`;
  }
  const query = encodeURIComponent(`${song.title} ${song.artist}`);
  return `https://music.youtube.com/search?q=${query}`;
}

/**
 * Returns a YouTube video link — opens search if no valid ID is available.
 */
export function getYouTubeVideoUrl(song: Song): string {
  if (song.youtubeUrl) return song.youtubeUrl;
  if (isValidYouTubeId(song.youtubeId)) {
    return `https://www.youtube.com/watch?v=${song.youtubeId}`;
  }
  const query = encodeURIComponent(`${song.title} ${song.artist}`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

/**
 * Returns a Spotify link — opens search if no valid ID is available.
 */
export function getSpotifyUrl(song: Song): string {
  if (song.spotifyUrl) return song.spotifyUrl;
  if (isValidSpotifyId(song.spotifyId)) {
    return `https://open.spotify.com/track/${song.spotifyId}`;
  }
  const query = encodeURIComponent(`${song.title} ${song.artist}`);
  return `https://open.spotify.com/search/${query}`;
}

/**
 * Returns an Apple Music / iTunes link — opens search if no valid ID is available.
 */
export function getAppleMusicUrl(song: Song): string {
  if (song.appleMusicUrl) return song.appleMusicUrl;
  if (isValidAppleMusicId(song.appleMusicId)) {
    return `https://music.apple.com/us/song/${song.appleMusicId}`;
  }
  const query = encodeURIComponent(`${song.title} ${song.artist}`);
  return `https://music.apple.com/us/search?term=${query}`;
}

/**
 * Returns a free 30–90 second official preview audio URL (`.m4a` file from the
 * iTunes Search API) — plays in a native <audio> element. No login, no
 * subscription, works for the general public. Returns null when unavailable.
 */
export function getAppleMusicPreviewUrl(song: Song): string | null {
  if (song.appleMusicPreviewUrl && /^https?:\/\//u.test(song.appleMusicPreviewUrl)) {
    return song.appleMusicPreviewUrl;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Source availability helpers (smart default / auto-fallback)
// ---------------------------------------------------------------------------

/**
 * Returns the ordered list of playback sources actually available for a song.
 * Fallback order: YouTube (full embed) → Spotify (30s snippet) → Apple Music
 * (30–90s official clip) → Synth (always works).
 */
export function getAvailableSources(song: Song): AudioSourcePreference[] {
  const sources: AudioSourcePreference[] = [];
  if (getAppleMusicPreviewUrl(song)) sources.push('apple');
  if (isValidSpotifyId(song.spotifyId)) sources.push('spotify');
  if (isValidYouTubeId(song.youtubeId)) sources.push('youtube');
  sources.push('synth'); // always available
  return sources;
}

/**
 * Client-side helper to dynamically fetch a 30s preview snippet and artwork
 * from /api/songs/preview if not already present on the song object.
 */
export async function fetchSongPreviewSnippet(song: Song): Promise<{ previewUrl: string | null; artworkUrl: string | null }> {
  if (song.appleMusicPreviewUrl) {
    return { previewUrl: song.appleMusicPreviewUrl, artworkUrl: song.artwork ?? null };
  }
  try {
    const res = await fetch(`/api/songs/preview?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`);
    if (!res.ok) return { previewUrl: null, artworkUrl: null };
    const data = (await res.json()) as { previewUrl?: string | null; artworkUrl?: string | null };
    return {
      previewUrl: data.previewUrl ?? null,
      artworkUrl: data.artworkUrl ?? null,
    };
  } catch {
    return { previewUrl: null, artworkUrl: null };
  }
}

/**
 * Resolves which source should actively play for a song given the user's
 * preference. Falls back to the first available source when the preferred one
 * has no embed/preview for this song. Returns 'synth' as a last resort.
 */
export function resolveBestSource(
  song: Song,
  preference?: AudioSourcePreference | null,
): AudioSourcePreference {
  const available = getAvailableSources(song);
  if (preference && available.includes(preference)) return preference;
  return available[0] ?? 'synth';
}

// ---------------------------------------------------------------------------
// Embed URL Helpers (return null when no valid provider ID is available)
// ---------------------------------------------------------------------------

/**
 * Returns an embeddable YouTube iframe src — or null if no valid YouTube ID.
 *
 * ⚠️ NEVER use YouTube's search embed URL (listType=search). That API was
 * deprecated in 2023 and renders a blank / broken iframe. Only embed
 * individual videos by ID (11-char format).
 */
export function getYouTubeEmbedUrl(song: Song): string | null {
  if (!isValidYouTubeId(song.youtubeId)) return null;
  return `https://www.youtube-nocookie.com/embed/${song.youtubeId}?autoplay=1&enablejsapi=1&rel=0`;
}

/**
 * Returns an embeddable Spotify iframe src — or null if no valid Spotify ID.
 */
export function getSpotifyEmbedUrl(song: Song): string | null {
  if (isValidSpotifyId(song.spotifyId)) {
    return `https://open.spotify.com/embed/track/${song.spotifyId}?utm_source=generator&theme=0`;
  }
  if (song.spotifyUrl && song.spotifyUrl.includes('track/')) {
    const match = song.spotifyUrl.match(/track\/([A-Za-z0-9]{22})/);
    if (match?.[1]) {
      return `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0`;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Batch Helpers
// ---------------------------------------------------------------------------

/**
 * Generates a bulk playlist / search URL for a list of drafted songs.
 * Uses validated IDs where available; falls back to a search query.
 */
export function generateBulkPlaylistUrl(songs: Song[], platform: 'youtube' | 'spotify'): string {
  if (songs.length === 0) return '#';

  if (platform === 'youtube') {
    const videoIds = songs.map((s) => s.youtubeId).filter(isValidYouTubeId);
    if (videoIds.length > 0) {
      return `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}`;
    }
    const query = encodeURIComponent(songs.map((s) => `${s.title} ${s.artist}`).join(' '));
    return `https://music.youtube.com/search?q=${query}`;
  } else {
    const trackNames = songs.map((s) => `track:"${s.title}"`).join(' OR ');
    return `https://open.spotify.com/search/${encodeURIComponent(trackNames)}`;
  }
}
