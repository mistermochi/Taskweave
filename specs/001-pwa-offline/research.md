# Research: PWA Offline Support

## Decision: PWA Implementation Approach

### Chosen: Next.js with Workbox/next-pwa

**Rationale**: Next.js has established patterns for PWA implementation. The `next-pwa` plugin or manual Workbox integration provides:
- Automatic service worker registration
- Asset caching strategies (cache-first for static, network-first for dynamic)
- Easy configuration via next.config.js

**Alternatives considered**:
- Manual service worker: More control but higher complexity
- Third-party PWA tools: Additional dependencies, less control

## Decision: Icon Generation

### Chosen: Generate multiple sizes from logo.svg

**Rationale**: PWA requires multiple icon sizes (72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512). Use `pwa-asset-generator` or similar to generate from the SVG source.

**Alternative**: Manual creation - too time-consuming

## Decision: Firebase Offline Persistence

### Chosen: Enable Firestore persistence with default settings

**Rationale**: Firebase Firestore has built-in offline persistence that:
- Automatically caches data locally
- Queues writes when offline
- Syncs automatically on reconnect
- Handles conflict resolution with last-write-wins

**Configuration**:
```typescript
enableIndexedDbPersistence(firestore)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab
    } else if (err.code === 'unimplemented') {
      // Current browser does not support persistence
    }
  })
```

## Decision: Service Worker Caching Strategy

### Chosen: Stale-while-revalidate for dynamic content

**Rationale**: 
- App shell: Cache-first (instant load)
- API/data: Stale-while-revalidate (show cached, update in background)
- This ensures offline functionality while keeping data fresh

## Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PWA Framework | next-pwa or Workbox | Best Next.js integration |
| Icons | Generate from logo.svg | Automated, all sizes |
| Offline Data | Firebase built-in | Already handles everything |
| Caching | Stale-while-revalidate | Balance freshness and offline |
