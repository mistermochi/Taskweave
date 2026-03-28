import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Trigger a haptic vibration if supported by the device.
 * @param pattern - 'light' (10ms), 'medium' (20ms), or 'success' ([20ms, 50ms, 20ms])
 */
export function vibrate(pattern: 'light' | 'medium' | 'success' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    switch (pattern) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'success':
        navigator.vibrate([20, 50, 20]);
        break;
    }
  }
}
