# Data Model: PWA Offline Support

## PWA Configuration Entities

### 1. PWA Manifest

The web app manifest defines how the app appears and behaves when installed.

**Fields**:
- `name`: Full application name (string, required)
- `short_name`: Short name for home screen (string, required)
- `description`: App description (string)
- `start_url`: URL to load when app starts (string, default: "/")
- `display`: Display mode (string: "fullscreen", "standalone", "minimal-ui", "browser")
- `background_color`: Background color (hex string)
- `theme_color`: Theme color for browser chrome (hex string)
- `icons`: Array of icon objects with src, sizes, type

### 2. Service Worker Registration

Configuration for service worker behavior.

**Fields**:
- `scope`: Service worker scope (string)
- `update_via_cache`: Cache headers for service worker (string: "all", "none", "importe")
- `caching_strategies`: Map of routes to strategies

### 3. Firebase Offline Settings

Configuration for Firestore offline persistence.

**Fields**:
- `persistence_enabled`: Boolean to enable/disable (default: true)
- `cache_size_bytes`: Cache size limit (number, default: 40MB)

## Validation Rules

- Manifest must have at least one icon
- Icon sizes must include 192x192 and 512x512 for PWA compliance
- Display mode must be one of the four valid values
- start_url must be a valid relative or absolute URL
