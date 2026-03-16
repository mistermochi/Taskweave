/**
 * A robust, base64-encoded silent WAV file (100ms).
 * Used to keep the Media Session API active on mobile devices
 * which requires an active audio/video element to show lock screen controls.
 * WAV format provides maximum compatibility across browsers, including Firefox.
 */
export const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQYAAAAAAAAAAAAAAAAA';
