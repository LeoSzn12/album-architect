'use client';

import { useState, useEffect } from 'react';
import { snippetPlayer, type SnippetPlayerState } from '@/lib/snippetPlayer';
import type { Song } from '@/types/draft';

export function useSnippetAudio() {
  const [state, setState] = useState<SnippetPlayerState>(() => snippetPlayer.getState());

  useEffect(() => {
    return snippetPlayer.subscribe((nextState) => {
      setState(nextState);
    });
  }, []);

  const playSong = (song: Song) => {
    void snippetPlayer.playSong(song);
  };

  const toggleSong = (song: Song) => {
    if (state.song?.id === song.id) {
      snippetPlayer.togglePlayPause();
    } else {
      void snippetPlayer.playSong(song);
    }
  };

  const pause = () => snippetPlayer.pause();
  const resume = () => snippetPlayer.resume();
  const stop = () => snippetPlayer.stop();
  const seek = (seconds: number) => snippetPlayer.seek(seconds);
  const setVolume = (vol: number) => snippetPlayer.setVolume(vol);
  const toggleMute = () => snippetPlayer.toggleMute();

  const isSongPlaying = (songId: string) => {
    return state.song?.id === songId && state.isPlaying;
  };

  const isSongActive = (songId: string) => {
    return state.song?.id === songId;
  };

  return {
    ...state,
    playSong,
    toggleSong,
    pause,
    resume,
    stop,
    seek,
    setVolume,
    toggleMute,
    isSongPlaying,
    isSongActive,
  };
}
