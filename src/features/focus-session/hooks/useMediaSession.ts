'use client';

import { useEffect, useRef } from 'react';
import { SILENT_AUDIO_URI } from '../lib/silent-audio';
import { Task } from '@/entities/task';
import { Tag } from '@/entities/tag';

interface MediaSessionProps {
  task: Task | null;
  isActive: boolean;
  timeLeft: number;
  tags: Tag[];
  onPlay: () => void;
  onPause: () => void;
}

/**
 * Hook to synchronize the Focus Session with the Browser's Media Session API.
 * This enables lock screen and notification shade controls on mobile and desktop.
 */
export function useMediaSession({
  task,
  isActive,
  timeLeft,
  tags,
  onPlay,
  onPause,
}: MediaSessionProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element for background persistence
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio(SILENT_AUDIO_URI);
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Sync Audio Playback with Focus Session State
  useEffect(() => {
    if (!audioRef.current) return;

    if (isActive) {
      audioRef.current.play().catch((err) => {
        // Playback might be blocked by browser policy until user interacts
        console.warn('MediaSession audio play failed:', err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isActive]);

  // Sync Metadata and Actions
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (task) {
      const tag = tags.find(t => t.id === task.category);

      navigator.mediaSession.metadata = new MediaMetadata({
        title: task.title,
        artist: tag?.name || 'Focus Flow',
        album: 'Focus Session',
        artwork: [
          { src: 'icons/manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.playbackState = isActive ? 'playing' : 'paused';

      // Set Position State (helps show progress bar on some platforms)
      if ('setPositionState' in navigator.mediaSession) {
        try {
            const duration = (task.duration || 1) * 60;
            const position = Math.max(0, duration - timeLeft);

            navigator.mediaSession.setPositionState({
                duration: duration,
                playbackRate: isActive ? 1 : 0,
                position: position,
            });
        } catch (e) {
            console.error('Error setting media session position state:', e);
        }
      }

      navigator.mediaSession.setActionHandler('play', onPlay);
      navigator.mediaSession.setActionHandler('pause', onPause);

      // We explicitly don't handle nexttrack/previoustrack as per user request
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
    } else {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    }
  }, [task, isActive, timeLeft, tags, onPlay, onPause]);
}
