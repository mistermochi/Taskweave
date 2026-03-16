/**
 * A tiny, base64-encoded silent WAV file.
 * Used to keep the Media Session API active on mobile devices
 * which requires an active audio/video element to show lock screen controls.
 * WAV is used here for maximum compatibility across browsers, including Firefox.
 */
export const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
