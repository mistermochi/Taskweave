import { ContextSnapshot } from '@/entities/context';

/**
 * Represents a user biological or focus log entry.
 */
export interface UserVital {
  id: string;
  timestamp: number;
  type: 'mood' | 'focus' | 'journal' | 'breathe';
  value: string | number; // Stores mood score (1-5), focus text, journal text, or breathe duration
  metadata?: Record<string, unknown>;         // Optional extra data
  context?: ContextSnapshot; // Context at the time of recording
}
