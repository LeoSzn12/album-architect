import type { Song } from '@/types/draft';

export interface SnippetPlayerState {
  song: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  progressPercent: number;
  volume: number;
  isMuted: boolean;
  error: string | null;
}

type StateListener = (state: SnippetPlayerState) => void;

class SnippetAudioController {
  private audio: HTMLAudioElement | null = null;
  private currentSong: Song | null = null;
  private listeners: Set<StateListener> = new Set();
  private volume: number = 0.85;
  private isMuted: boolean = false;
  private isLoading: boolean = false;
  private error: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.volume = this.volume;

    this.audio.addEventListener('timeupdate', () => {
      this.notify();
    });

    this.audio.addEventListener('play', () => {
      this.isLoading = false;
      this.notify();
    });

    this.audio.addEventListener('pause', () => {
      this.notify();
    });

    this.audio.addEventListener('ended', () => {
      this.notify();
    });

    this.audio.addEventListener('error', () => {
      this.isLoading = false;
      this.error = 'Unable to play snippet';
      this.notify();
    });

    this.audio.addEventListener('waiting', () => {
      this.isLoading = true;
      this.notify();
    });

    this.audio.addEventListener('playing', () => {
      this.isLoading = false;
      this.notify();
    });
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  public getState(): SnippetPlayerState {
    const isPlaying = !!(this.audio && !this.audio.paused && !this.audio.ended && this.audio.currentTime > 0);
    const currentTime = this.audio ? this.audio.currentTime : 0;
    const duration = this.audio && !isNaN(this.audio.duration) && this.audio.duration > 0 ? this.audio.duration : 30;
    const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    return {
      song: this.currentSong,
      isPlaying,
      isLoading: this.isLoading,
      currentTime,
      duration,
      progressPercent,
      volume: this.volume,
      isMuted: this.isMuted,
      error: this.error,
    };
  }

  public async playSong(song: Song) {
    this.initAudio();
    if (!this.audio) return;

    // If currently playing the exact same song, toggle play/pause
    if (this.currentSong?.id === song.id) {
      if (this.audio.paused) {
        try {
          await this.audio.play();
        } catch {
          // Autoplay policy fallback
        }
      } else {
        this.audio.pause();
      }
      this.notify();
      return;
    }

    // New song: reset and prepare
    this.audio.pause();
    this.currentSong = song;
    this.error = null;
    this.isLoading = true;
    this.notify();

    let previewUrl = song.appleMusicPreviewUrl;

    // If no preview URL exists on song, fetch dynamically from /api/songs/preview
    if (!previewUrl) {
      try {
        const res = await fetch(`/api/songs/preview?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`);
        if (res.ok) {
          const data = (await res.json()) as { previewUrl?: string | null; artworkUrl?: string | null };
          if (data.previewUrl) {
            previewUrl = data.previewUrl;
            song.appleMusicPreviewUrl = data.previewUrl;
            if (!song.artwork && data.artworkUrl) {
              song.artwork = data.artworkUrl;
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch preview snippet:', err);
      }
    }

    if (!previewUrl) {
      this.isLoading = false;
      this.error = 'No preview snippet available for this track';
      this.notify();
      return;
    }

    try {
      this.audio.src = previewUrl;
      this.audio.currentTime = 0;
      await this.audio.play();
    } catch {
      this.isLoading = false;
      this.notify();
    }
  }

  public pause() {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      this.notify();
    }
  }

  public resume() {
    if (this.audio && this.audio.paused && this.currentSong) {
      this.audio.play().catch(() => {});
      this.notify();
    }
  }

  public togglePlayPause() {
    if (!this.audio || !this.currentSong) return;
    if (this.audio.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  public stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.currentSong = null;
    this.isLoading = false;
    this.error = null;
    this.notify();
  }

  public seek(seconds: number) {
    if (this.audio) {
      this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration || 30));
      this.notify();
    }
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
      if (this.volume > 0) {
        this.audio.muted = false;
        this.isMuted = false;
      }
    }
    this.notify();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.audio) {
      this.audio.muted = this.isMuted;
    }
    this.notify();
  }
}

export const snippetPlayer = new SnippetAudioController();

if (typeof window !== 'undefined') {
  (window as unknown as { __snippetPlayer?: SnippetAudioController }).__snippetPlayer = snippetPlayer;
}
