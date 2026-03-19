'use client';

import { useEffect } from 'react';
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
  // Sync Metadata and Actions
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (task) {
      const tag = tags.find(t => t.id === task.category);
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

      navigator.mediaSession.metadata = new MediaMetadata({
        title: task.title,
        artist: tag?.name || 'Focus Flow',
        album: 'Focus Session',
        artwork: [
          { src: `${basePath}/icons/manifest-icon-192.maskable.png`, sizes: '192x192', type: 'image/png' },
          { src: `${basePath}/icons/manifest-icon-512.maskable.png`, sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', onPlay);
      navigator.mediaSession.setActionHandler('pause', onPause);

      // We explicitly don't handle nexttrack/previoustrack as per user request
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
    } else {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
    }

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
      }
    };
  }, [task, tags, onPlay, onPause]);

  // Sync Playback State and Position
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !task) return;

    navigator.mediaSession.playbackState = isActive ? 'playing' : 'paused';

    if ('setPositionState' in navigator.mediaSession) {
      try {
        const duration = (task.duration || 1) * 60;
        // Clamp position between 0 and duration to avoid errors during overtime
        const position = Math.min(duration, Math.max(0, duration - timeLeft));

        navigator.mediaSession.setPositionState({
          duration: duration,
          // MediaSession API requires playbackRate > 0.
          // The browser uses this rate to estimate position when playbackState is 'playing'.
          playbackRate: 1.0,
          position: position,
        });
      } catch (e) {
        console.error('Error setting media session position state:', e);
      }
    }
  }, [isActive, timeLeft, task]);
}
