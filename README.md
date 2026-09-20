# frshly

> **Deploy. Open tabs update themselves. No hard refresh. No "please clear your cache".**

[![npm version](https://badge.fury.io/js/frshly.svg)](https://www.npmjs.com/package/frshly)
[![CI](https://github.com/yourusername/frshly/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/frshly/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`frshly` automatically detects when you deploy a new build and updates open tabs — no more stale JavaScript, no more "works on my machine" bugs, no more asking users to hard-refresh.

## The Problem

A React SPA ships as static files. Once a tab is open, the JavaScript running in it is frozen in time:

```
10:00  user opens app        → build A loaded
10:30  you deploy build B    → CDN now serves B
10:31  user keeps clicking   → STILL running A
11:00  user hits a bug       → "works on my machine"
11:05  support says          → "can you clear your cache?"
```

**The tab has no mechanism to learn that build B exists.**

`frshly` solves this by:
1. Emitting a lightweight `version.json` at build time
2. Polling that manifest from the running app
3. Detecting mismatches with defensive confirmation
4. Triggering a reload (auto, prompt, or manual)

## Quick Start

### 1. Install

```bash
npm install frshly
```

### 2. Add to your bundler

#### Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import frshly from 'frshly/vite';

export default defineConfig({
  plugins: [react(), frshly()],
});
```

#### Webpack

```js
// webpack.config.js
const FrshlyPlugin = require('frshly/webpack').default;

module.exports = {
  plugins: [
    new FrshlyPlugin(),
  ],
};
```

#### Craco (Create React App)

```js
// craco.config.js
const { frshly } = require('frshly/craco');

module.exports = {
  webpack: {
    plugins: {
      add: [frshly()],
    },
  },
};
```

### 3. Wrap your app

```tsx
// main.tsx
import { Frshly } from 'frshly';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <Frshly>
    <App />
  </Frshly>
);
```

**That's it.** Your app now reloads automatically when you deploy.

## How It Works

### Build Time

The bundler plugin:
1. Resolves a build ID from git SHA, content hash, or timestamp
2. Injects `__FRSHLY_VERSION__` and `__FRSHLY_BUILT_AT__` constants
3. Emits `version.json` to your output directory

```json
{
  "version": "a1b2c3d",
  "builtAt": "2026-09-20T10:15:00.000Z"
}
```

### Runtime

The React provider:
1. Polls `/version.json` every 60 seconds (configurable)
2. Also checks on focus, visibility change, and network reconnect
3. Requires **consecutive mismatches** (default: 2) to confirm an update
4. Guards against reload loops using `sessionStorage`
5. Coordinates across tabs via `BroadcastChannel`

## Modes

| Mode | Behavior |
|------|----------|
| `auto` (default) | Reloads automatically when update is confirmed |
| `prompt` | Shows a banner, waits for user to click "Reload" |
| `manual` | Detects and exposes update, you decide what to do |

### Auto Mode

```tsx
<Frshly mode="auto">
  <App />
</Frshly>
```

Best for: dashboards, admin tools, internal apps where fresh data matters more than unsaved work.

### Prompt Mode

```tsx
<Frshly mode="prompt">
  <App />
</Frshly>
```

Best for: apps with forms or unsaved state. User clicks "Reload" when ready.

### Manual Mode

```tsx
<FrshlyProvider mode="manual">
  <App />
</FrshlyProvider>

function App() {
  const { updateAvailable, latestVersion, reload } = useFrshly();

  return (
    <div>
      {updateAvailable && (
        <button onClick={reload}>
          Update to {latestVersion}
        </button>
      )}
      {/* your app */}
    </div>
  );
}
```

Best for: custom UI, non-standard reload flows.

## API

### `<Frshly>`

Zero-config wrapper. Combines `FrshlyProvider` + `UpdateBanner`.

```tsx
<Frshly
  mode="auto"              // 'auto' | 'prompt' | 'manual'
  pollInterval={60_000}    // ms between checks
  checkOnFocus={true}      // check when tab gains focus
  checkOnVisibilityChange={true}  // check when tab becomes visible
  checkOnOnline={true}     // check when network reconnects
  requireConsecutiveMismatches={2}  // confirmations needed
  fetchTimeout={8_000}     // fetch timeout in ms
  maxReloadAttempts={1}    // reload loop guard limit
  debug={false}            // enable console logging
  shouldReload={() => true}  // gate for auto-reload
  onCheck={(result) => {}}
  onUpdateDetected={(version) => {}}
  onReload={(version) => {}}
  onError={(error) => {}}
>
  <App />
</Frshly>
```

### `<FrshlyProvider>`

Advanced usage without the banner.

```tsx
<FrshlyProvider mode="prompt">
  <App />
</FrshlyProvider>
```

### `useFrshly()`

Hook for accessing state.

```tsx
const {
  updateAvailable,   // boolean
  currentVersion,    // string
  latestVersion,     // string | null
  builtAt,           // string | null
  status,            // FrshlyStatus
  lastCheckedAt,     // number | null
  check,             // () => Promise<void>
  reload,            // () => void
  dismiss,           // () => void (prompt mode)
} = useFrshly();
```

### `<UpdateBanner>`

Customizable banner (used by `<Frshly>` in prompt/manual modes).

```tsx
<UpdateBanner
  message="A new version is available."
  reloadLabel="Reload"
  dismissLabel="Dismiss"
  position="top"  // 'top' | 'bottom'
/>
```

Themed via CSS variables:

```css
:root {
  --frshly-banner-bg: #1f2937;
  --frshly-banner-color: #ffffff;
  --frshly-button-primary-bg: #3b82f6;
  --frshly-button-primary-color: #ffffff;
}
```

Custom render:

```tsx
<UpdateBanner
  render={({ message, onReload, onDismiss, latestVersion }) => (
    <div className="my-custom-banner">
      <p>{message} (v{latestVersion})</p>
      <button onClick={onReload}>Update Now</button>
      <button onClick={onDismiss}>Later</button>
    </div>
  )}
/>
```

### `<VersionInfo>`

Debug component for showing version details.

```tsx
<VersionInfo />
```

## Advanced

### Guarding Auto-Reload

Prevent reload when user has unsaved work:

```tsx
<Frshly
  mode="auto"
  shouldReload={async () => {
    if (formHasUnsavedChanges()) {
      return confirm('You have unsaved changes. Reload anyway?');
    }
    return true;
  }}
>
  <App />
</Frshly>
```

### Multi-Tab Coordination

When one tab confirms an update, all tabs are notified via `BroadcastChannel`. Each applies its own `shouldReload` gate, so you can centralize the logic.

### Route-Based Checking

Trigger a check on navigation:

```tsx
// In your router
const location = useLocation();

<FrshlyProvider
  checkOnRouteChange={true}
  routeKey={location.pathname}
>
  <App />
</FrshlyProvider>
```

### Custom Version URL

If `version.json` lives elsewhere:

```tsx
<Frshly versionUrl="https://cdn.example.com/app/version.json">
  <App />
</Frshly>
```

## Deployment: Cache Headers

`frshly` does **not** set HTTP cache headers. You must configure your CDN/server correctly:

```
index.html       → Cache-Control: no-cache
version.json     → Cache-Control: no-store, no-cache, must-revalidate
assets/*.hash.js → Cache-Control: public, max-age=31536000, immutable
assets/*.hash.css → Cache-Control: public, max-age=31536000, immutable
```

**Why?** Hashed assets (e.g., `main.a1b2c3d.js`) should be cached aggressively — the hash is the cache key. Only the HTML entry and version manifest must revalidate.

### Nginx

```nginx
location = /version.json {
  add_header Cache-Control "no-store, no-cache, must-revalidate";
}

location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}

location / {
  try_files $uri /index.html;
  add_header Cache-Control "no-cache";
}
```

### Netlify

Create `public/_headers`:

```
/version.json
  Cache-Control: no-store, no-cache, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*
  Cache-Control: no-cache
```

### Vercel

```json
{
  "headers": [
    {
      "source": "/version.json",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, no-cache, must-revalidate" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### CloudFront

Use cache behaviors:
- Path `/version.json`: TTL 0, no caching
- Path `/assets/*`: TTL 1 year
- Default: Forward `Cache-Control` from origin

### Azure Static Web Apps

Create `staticwebapp.config.json`:

```json
{
  "globalHeaders": {
    "Cache-Control": "no-cache"
  },
  "routes": [
    {
      "route": "/version.json",
      "headers": {
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    },
    {
      "route": "/assets/*",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    }
  ]
}
```

## Service Workers

If your app registers a service worker, the worker may serve a cached shell and short-circuit the reload. You must handle the update flow in your SW:

- **Workbox**: Use [`skipWaiting` + `clientsClaim`](https://developer.chrome.com/docs/workbox/handling-service-worker-updates/)
- **Manual SW**: Listen for `updatefound` on the registration and call `skipWaiting()`

`frshly` detects mismatches at the application level. If the SW serves stale HTML, the bundle version won't change and `frshly` will halt (via the reload-loop guard).

## What `frshly` Does NOT Do

- ❌ Set cache headers (documented only)
- ❌ Manage service-worker caches (point to Workbox)
- ❌ Rollback or version pinning (read-only detection)
- ❌ Require a backend, database, or hosted service
- ❌ "Clear the browser cache" (it makes that unnecessary)

## Detection Correctness

### State Machine

```
CURRENT → same version         → CURRENT
CURRENT → different X          → MISMATCH(X, 1)
MISMATCH(X,n) → X              → MISMATCH(X, n+1) | CONFIRMED if n+1 >= threshold
MISMATCH(X,n) → current        → CURRENT (reset)
MISMATCH(X,n) → different Y    → MISMATCH(Y, 1) (reset counter)
ANY → fetch failure            → UNKNOWN (no state change, no reload)
```

**Never false-positive on network trouble.** Timeout, 404, 500, invalid JSON, CORS failure → all treated as `UNKNOWN`, never "new version."

### Reload-Loop Guard

Scenario to defend:

```
bundle=A, manifest=B → reload → CDN still serves A → bundle=A, manifest=B → reload → ∞
```

Guard in `sessionStorage`:

```ts
{ attemptedVersion: 'B', attempts: 1, attemptedAt: 1758… }
```

If after reload the bundle is still A and manifest still says B, and `attempts >= maxReloadAttempts`, **stop reloading** and fire `onError` with `STALE_AFTER_RELOAD`.

## Bundle Size

Runtime: **< 2 KB gzipped** (excluding React).

## TypeScript

Full TypeScript support with exported types:

```ts
import type {
  FrshlyMode,
  FrshlyStatus,
  FrshlyOptions,
  FrshlyState,
  CheckResult,
  FrshlyError,
} from 'frshly';
```

## Browser Support

Requires:
- `fetch` API
- `sessionStorage`
- `BroadcastChannel` (gracefully degrades if unavailable)

Tested in Chrome, Firefox, Safari, Edge.

## FAQ

### Does this work with server-side rendering (SSR)?

Yes, but the provider should only run on the client. The bundler plugin runs at build time regardless.

### What if my CDN caches `version.json`?

Set `Cache-Control: no-store` on `/version.json`. If your CDN ignores origin headers, purge the file on deploy or serve it from a separate non-cached path.

### Can I test this locally?

Yes! The example app includes a `simulate-deploy` script:

```bash
cd example
npm run build
npm run dev
# In another terminal:
npm run simulate-deploy
```

Watch the app detect the simulated update.

### What happens if the user is offline?

Fetch fails → treated as `UNKNOWN` → no reload. When they come back online, the `online` event triggers a check.

### Can I use this with React Router or other routers?

Yes. Pass `checkOnRouteChange={true}` and `routeKey={location.pathname}` to trigger checks on navigation.

### What if I deploy multiple times per minute?

The consecutive-mismatch threshold (default: 2) ensures rapid flapping doesn't trigger a reload. Only a stable candidate version confirms.

## Contributing

Contributions welcome! Please open an issue before submitting a PR for new features.

## License

MIT © frshly contributors

---

**Made with ❤️ for developers tired of "did you hard-refresh?"**
