import type { Song } from '@/types/draft';
import { playSongPreview, stopSongPreview } from './audioEngine';

export interface SnippetPlayerState {
  song: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  isSynthetic?: boolean;
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
  private isSynthetic: boolean = false;
  private error: string | null = null;

  // Synthetic preview tracking
  private synthStopFn: (() => void) | null = null;
  private synthTimer: ReturnType<typeof setInterval> | null = null;
  private synthElapsed: number = 0;
  private synthDuration: number = 8;

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
      this.isSynthetic = false;
      this.notify();
    });

    this.audio.addEventListener('pause', () => {
      this.notify();
    });

    this.audio.addEventListener('ended', () => {
      this.notify();
    });

    this.audio.addEventListener('error', () => {
      // Audio element encountered a network or decode error
      if (this.currentSong && !this.isSynthetic) {
        this.fallbackToSynth(this.currentSong);
      } else {
        this.isLoading = false;
        this.error = 'Unable to play snippet';
        this.notify();
      }
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
    if (this.isSynthetic) {
      const currentTime = this.synthElapsed;
      const duration = this.synthDuration;
      const progressPercent = Math.min(100, (currentTime / duration) * 100);
      return {
        song: this.currentSong,
        isPlaying: this.synthTimer !== null,
        isLoading: false,
        isSynthetic: true,
        currentTime,
        duration,
        progressPercent,
        volume: this.volume,
        isMuted: this.isMuted,
        error: this.error,
      };
    }

    const isPlaying = !!(this.audio && !this.audio.paused && !this.audio.ended && this.audio.currentTime > 0);
    const currentTime = this.audio ? this.audio.currentTime : 0;
    const duration = this.audio && !isNaN(this.audio.duration) && this.audio.duration > 0 ? this.audio.duration : 30;
    const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    return {
      song: this.currentSong,
      isPlaying,
      isLoading: this.isLoading,
      isSynthetic: false,
      currentTime,
      duration,
      progressPercent,
      volume: this.volume,
      isMuted: this.isMuted,
      error: this.error,
    };
  }

  private stopSynthetic() {
    if (this.synthTimer) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
    if (this.synthStopFn) {
      try {
        this.synthStopFn();
      } catch {}
      this.synthStopFn = null;
    }
    stopSongPreview();
    this.isSynthetic = false;
    this.synthElapsed = 0;
  }

  private fallbackToSynth(song: Song) {
    this.stopSynthetic();
    if (this.audio) {
      this.audio.pause();
    }
    this.isSynthetic = true;
    this.isLoading = false;
    this.error = null;
    this.synthElapsed = 0;
    this.synthDuration = 8;

    const stopFn = playSongPreview(song.audioSynthFreq || 440, this.synthDuration, true);
    this.synthStopFn = stopFn;

    const interval = 100;
    this.synthTimer = setInterval(() => {
      this.synthElapsed += interval / 1000;
      if (this.synthElapsed >= this.synthDuration) {
        this.stopSynthetic();
        this.notify();
      } else {
        this.notify();
      }
    }, interval);

    this.notify();
  }

  public async playSong(song: Song) {
    this.initAudio();

    // If currently playing the exact same song, toggle play/pause
    if (this.currentSong?.id === song.id) {
      if (this.isSynthetic) {
        if (this.synthTimer) {
          this.stopSynthetic();
        } else {
          this.fallbackToSynth(song);
        }
        this.notify();
        return;
      }

      if (this.audio) {
        if (this.audio.paused) {
          try {
            await this.audio.play();
          } catch {
            this.fallbackToSynth(song);
          }
        } else {
          this.audio.pause();
        }
        this.notify();
        return;
      }
    }

    // New song: reset previous audio and synth
    this.stopSynthetic();
    if (this.audio) {
      this.audio.pause();
    }

    this.currentSong = song;
    this.error = null;
    this.isLoading = true;
    this.isSynthetic = false;
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
      // Fallback to rich synth preview so the user always hears sound
      this.fallbackToSynth(song);
      return;
    }

    if (this.audio) {
      try {
        this.audio.src = previewUrl;
        this.audio.currentTime = 0;
        await this.audio.play();
      } catch (err) {
        console.warn('HTMLAudioElement play failed, falling back to dynamic search or synth:', err);
        // Try dynamic lookup if current URL failed
        try {
          const res = await fetch(`/api/songs/preview?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`);
          if (res.ok) {
            const data = (await res.json()) as { previewUrl?: string | null };
            if (data.previewUrl && data.previewUrl !== previewUrl) {
              this.audio.src = data.previewUrl;
              this.audio.currentTime = 0;
              await this.audio.play();
              return;
            }
          }
        } catch {}

        // If all network sources fail, smoothly synthesize audio preview
        this.fallbackToSynth(song);
      }
    }
  }

  public pause() {
    if (this.isSynthetic) {
      this.stopSynthetic();
      this.notify();
      return;
    }
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      this.notify();
    }
  }

  public resume() {
    if (this.isSynthetic && this.currentSong) {
      this.fallbackToSynth(this.currentSong);
      return;
    }
    if (this.audio && this.audio.paused && this.currentSong) {
      this.audio.play().catch(() => {
        if (this.currentSong) this.fallbackToSynth(this.currentSong);
      });
      this.notify();
    }
  }

  public togglePlayPause() {
    if (!this.currentSong) return;
    if (this.isSynthetic) {
      if (this.synthTimer) {
        this.pause();
      } else {
        this.resume();
      }
      return;
    }
    if (!this.audio) return;
    if (this.audio.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  public stop() {
    this.stopSynthetic();
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
    if (this.isSynthetic) {
      this.synthElapsed = Math.max(0, Math.min(seconds, this.synthDuration));
      this.notify();
      return;
    }
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
