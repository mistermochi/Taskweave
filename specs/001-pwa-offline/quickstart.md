# Quickstart: PWA Offline Support

## Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project configured
- Existing Taskweave app running

## Steps to Enable PWA

### 1. Install Dependencies

```bash
npm install next-pwa
# or
npm install workbox-precaching workbox-routing workbox-strategies
```

### 2. Configure PWA Manifest

Create `public/manifest.json`:
```json
{
  "name": "Taskweave",
  "short_name": "Taskweave",
  "description": "Holistic productivity and wellness application",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 3. Add Manifest to Layout

In `src/app/layout.tsx`, add:
```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#000000" />
```

### 4. Enable Firebase Offline Persistence

In `src/lib/firebase.ts`, add:
```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore'

// After firebase app initialization
enableIndexedDbPersistence(firestore).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence failed: multiple tabs open')
  } else if (err.code === 'unimplemented') {
    console.warn('Persistence not supported in this browser')
  }
})
```

### 5. Generate PWA Icons

Generate icons from `public/logo.svg`:
```bash
npx pwa-asset-generator public/logo.svg public/icons
```

### 6. Configure Next.js PWA

In `next.config.js`:
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

module.exports = withPWA({
  // your existing config
})
```

## Verification

1. Run `npm run dev`
2. Open http://localhost:4246
3. Open DevTools → Application → Service Workers to verify registration
4. Check Manifest in DevTools to verify PWA properties
5. Test offline: Go to Network tab → set to "Offline" → refresh → app should still load

## Testing

```bash
npm test
```

Run offline behavior tests to verify data persistence.
