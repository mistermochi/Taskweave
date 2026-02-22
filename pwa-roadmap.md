# Roadmap: Progressive Web App (PWA) Transformation

This document outlines the strategic plan to evolve Taskweave into a full-fledged Progressive Web App (PWA). The primary goal is to provide a seamless offline experience and enable native-like application behavior on supported platforms, using only client-side technologies.

---

## 1. PWA Impact Analysis

Transforming Taskweave into a PWA will have the following key benefits:

*   **Reliability (Offline First):** The app will load reliably, regardless of network conditions. Thanks to Firebase's offline persistence and a service worker, users can view, create, and edit tasks even when offline. Changes will sync automatically when a connection is re-established.
*   **Installability:** Users will be prompted to "install" Taskweave to their home screen on mobile or as a desktop app. This provides a native, single-window experience without browser UI, making the app feel more integrated into the user's workflow.
*   **Enhanced Performance:** A service worker will cache the application's shell (HTML, CSS, JS) and other static assets, leading to significantly faster load times on repeat visits.
*   **Native Capabilities:** PWAs unlock access to a suite of client-side features traditionally reserved for native apps, such as a robust offline mode and system share intents.

---

## 2. PWA Implementation Plan

### Epic 1: Foundational PWA Setup

This epic establishes the core requirements that allow the browser to recognize Taskweave as an installable PWA.

-   [x] **Create Web App Manifest:**
    -   [x] **Sub-task:** Create a new file at `public/manifest.json`.
    -   [x] **Sub-task:** Populate the manifest with essential metadata:
        -   `name`: "Taskweave"
        -   `short_name`: "Taskweave"
        -   `description`: "A holistic productivity and wellness companion."
        -   `start_url`: "/"
        -   `display`: "standalone"
        -   `background_color`: A color matching the app's loading screen.
        -   `theme_color`: A color matching the app's primary header.
        -   `icons`: An array of icon objects.

-   [x] **Add High-Resolution Application Icons:**
    -   [x] **Sub-task:** Add a `192x192` pixel icon to `public/icons/`. This is the minimum for installability.
    -   [x] **Sub-task:** Add a `512x512` pixel icon to `public/icons/`. This is used for the splash screen on Android devices.
    -   [x] **Sub-task:** Add a "maskable" icon. This special icon format ensures the app icon looks great on all Android devices, which may apply different shapes (masks) to icons.

-   [x] **Link Manifest in App Layout:**
    -   [x] **Sub-task:** Modify the main `app/layout.tsx` file.
    -   [x] **Sub-task:** Add a `<link rel="manifest" href="/manifest.json" />` tag to the `<head>` of the document.

### Epic 2: The Service Worker & Offline Experience

This epic focuses on creating a service worker to handle caching and provide a true offline-first experience.

-   [x] **Implement and Register the Service Worker:**
    -   [x] **Sub-task:** Create a new service worker file at `public/sw.js`.
    -   [x] **Sub-task:** In `app/page.tsx` (or a root client component), add a `useEffect` hook to register the service worker: `navigator.serviceWorker.register('/sw.js')`.

-   [x] **Implement Caching for the App Shell:**
    -   [x] **Sub-task:** Inside `sw.js`, add an `install` event listener.
    -   [x] **Sub-task:** Within the `install` event, use the Cache API to download and store the core application files (the "app shell"), including the main HTML page, essential CSS, and JavaScript bundles. This ensures the app loads instantly on subsequent visits, even without a network connection.

-   [x] **Intercept Network Requests:**
    -   [x] **Sub-task:** Add a `fetch` event listener to `sw.js`.
    -   [x] **Sub-task:** Implement a "cache-first" strategy. For any request, the service worker will first check if the response is in the cache. If it is, it serves the cached version immediately. If not, it fetches it from the network, serves it to the app, and adds it to the cache for next time.

-   [x] **Create a Custom Offline Fallback Page:**
    -   [x] **Sub-task:** Create a simple, static HTML page at `public/offline.html`.
    -   [x] **Sub-task:** Add `offline.html` to the list of files to be cached during the service worker's `install` event.
    -   [x] **Sub-task:** Update the `fetch` event handler. If a network request for a page fails and the page is not in the cache, the service worker will intercept the error and serve the cached `offline.html` instead of a browser error page.

### Epic 3: Advanced Client-Side Integrations

This epic leverages PWA features for a more premium, native-like experience on supporting platforms.

-   [ ] **Leverage Firestore's Built-in Offline Sync:**
    -   [ ] **Sub-task:** Audit all Firestore write operations (`setDoc`, `updateDoc`, `addDoc`).
    -   [ ] **Sub-task:** Confirm that `enableIndexedDbPersistence` is correctly configured in our `firebase.ts` file. This is the key to Firebase's offline magic.
    -   [ ] **Details:** With persistence enabled, any failed writes to Firestore are automatically queued by the Firebase SDK. It will retry these writes in the background as soon as a network connection is detected, ensuring no data is lost. This requires no extra code beyond the initial setup.

-   [ ] **Implement App Shortcuts (Chrome/Android):**
    -   [ ] **Sub-task:** Add a `shortcuts` member to the `public/manifest.json` file.
    -   [ ] **Sub-task:** Define at least two shortcuts, such as:
        -   `{ "name": "New Task", "url": "/?action=new-task", "description": "Quickly add a new task to your inbox." }`
        -   `{ "name": "Start Focus", "url": "/?action=start-focus", "description": "Start an unplanned focus session." }`
    -   [ ] **Sub-task:** Update the root page logic to handle these URL query parameters and trigger the appropriate action (e.g., opening the quick-add modal).

-   [ ] **Implement Share Target (Chrome/Android):**
    -   [ ] **Sub-task:** Add a `share_target` member to the `public/manifest.json`.
    -   [ ] **Sub-task:** Configure the `share_target` object to accept shared text/URLs:
        ```json
        "share_target": {
          "action": "/share-target",
          "method": "GET",
          "params": {
            "title": "title",
            "text": "text",
            "url": "url"
          }
        }
        ```
    -   [ ] **Sub-task:** Create a new client-side route (e.g., `app/share-target/page.tsx`) that reads the `title`, `text`, and `url` from the URL search parameters.
    -   [ ] **Sub-task:** Implement logic on this page to automatically create a new task in the user's Inbox using the shared data and then redirect them to the main app view.
