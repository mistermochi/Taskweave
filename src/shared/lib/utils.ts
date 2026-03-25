import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Standardized haptic feedback patterns using the Web Vibration API.
 * Patterns:
 * - 'light': 10ms (subtle interaction)
 * - 'medium': 20ms (standard interaction)
 * - 'success': [20ms, 50ms, 20ms] (confirmation)
 */
export function vibrate(pattern: 'light' | 'medium' | 'success') {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    switch (pattern) {
      case 'light':
        window.navigator.vibrate(10);
        break;
      case 'medium':
        window.navigator.vibrate(20);
        break;
      case 'success':
        window.navigator.vibrate([20, 50, 20]);
        break;
    }
  }
}
