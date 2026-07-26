import { Song } from '@/types/draft';

/**
 * Returns a direct YouTube Music web link for a track.
 */
export function getYouTubeMusicUrl(song: Song): string {
  if (song.youtubeUrl) return song.youtubeUrl;
  if (song.youtubeId) {
    return `https://music.youtube.com/watch?v=${song.youtubeId}`;
  }
  const query = encodeURIComponent(`${song.title} ${song.artist}`);
  return `https://music.youtube.com/search?q=${query}`;
}

/**
 * Returns a direct YouTube Video link for a track.
 */
export function getYouTubeVideoUrl(song: Song): string {
  if (song.youtubeUrl) return song.youtubeUrl;
  if (song.youtubeId) {
    return `https://www.youtube.com/watch?v=${song.youtubeId}`;
  }
  const query = encodeURIComponent(`${song.title} ${song.artist}`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

/**
 * Returns a direct Spotify web search or track link.
 */
export function getSpotifyUrl(song: Song): string {
  if (song.spotifyUrl) return song.spotifyUrl;
  if (song.spotifyId) {
    return `https://open.spotify.com/track/${song.spotifyId}`;
  }
  const query = encodeURIComponent(`${song.title} ${song.artist}`);
  return `https://open.spotify.com/search/${query}`;
}

/**
 * Returns an embeddable YouTube IFrame URL for in-app video/audio preview.
 */
export function getYouTubeEmbedUrl(song: Song): string {
  if (song.youtubeId) {
    return `https://www.youtube-nocookie.com/embed/${song.youtubeId}?autoplay=1&enablejsapi=1&rel=0`;
  }
  const searchQuery = encodeURIComponent(`${song.title} ${song.rawArtistString}`);
  return `https://www.youtube-nocookie.com/embed?listType=search&list=${searchQuery}&autoplay=1`;
}

/**
 * Returns an embeddable Spotify IFrame URL if a spotifyId or spotifyUrl is available.
 */
export function getSpotifyEmbedUrl(song: Song): string | null {
  if (song.spotifyId) {
    return `https://open.spotify.com/embed/track/${song.spotifyId}?utm_source=generator&theme=0`;
  }
  if (song.spotifyUrl && song.spotifyUrl.includes('track/')) {
    const match = song.spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
    if (match?.[1]) {
      return `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0`;
    }
  }
  return null;
}

/**
 * Generates a full playlist or search batch URL for a list of drafted songs.
 */
export function generateBulkPlaylistUrl(songs: Song[], platform: 'youtube' | 'spotify'): string {
  if (songs.length === 0) return '#';
  
  if (platform === 'youtube') {
    // If songs have video IDs, construct a YouTube mix playlist URL!
    const videoIds = songs.map((s) => s.youtubeId).filter(Boolean);
    if (videoIds.length > 0) {
      return `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}`;
    }
    const query = encodeURIComponent(songs.map((s) => `${s.title} ${s.artist}`).join(' '));
    return `https://music.youtube.com/search?q=${query}`;
  } else {
    // Spotify search query with track titles
    const trackNames = songs.map((s) => `track:"${s.title}"`).join(' OR ');
    return `https://open.spotify.com/search/${encodeURIComponent(trackNames)}`;
  }
}
