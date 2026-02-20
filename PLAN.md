# miniGuessr

Minimal, client-side GeoGuessr clone. No server, no ads, no bloat.

## Tech Stack

| Tool | Purpose |
|------|---------|
| Bun | Runtime, bundler, package manager |
| Svelte 5 | UI framework (runes for explicit reactivity) |
| TypeScript | Type safety (strict mode) |
| Biome | Linting + formatting |
| Leaflet | Map (dynamic import) |
| Google Embed API | Street View (iframe) |

## Repository Setup

```bash
# Switch to personal GitHub account
gh auth switch  # Select lukasngl

# Create project
mkdir -p ~/src/miniGuessr && cd ~/src/miniGuessr
bun create svelte@latest . --template minimal --types typescript

# Git config
git config user.email "lukasnagel@fastmail.com"
git config user.name "Lukas Nagel"

# Tooling
bun add -d @biomejs/biome
bunx biome init

# GitHub repo
gh repo create miniGuessr --private --source=. --remote=origin
git remote set-url origin git@me.github.com:lukasngl/miniGuessr.git
```

## Project Structure

```
miniGuessr/
├── src/
│   ├── lib/
│   │   ├── types/
│   │   │   ├── index.ts           # Re-exports
│   │   │   ├── settlement.ts      # Settlement interface
│   │   │   ├── country.ts         # Country/polygon types
│   │   │   └── game.ts            # GameSettings, Location
│   │   ├── data/
│   │   │   ├── asset.svelte.ts    # Asset class (fetch + progress)
│   │   │   ├── settlements.ts     # Settlements class + singleton
│   │   │   ├── countries.ts       # Countries class + singleton
│   │   │   └── starters.ts        # Hardcoded starter locations
│   │   └── util/
│   │       ├── distance.ts        # Haversine calculation
│   │       ├── random.ts          # Random point in polygon
│   │       └── streetview.ts      # SV checker + URL builder
│   ├── components/
│   │   ├── StreetView.svelte      # Google Embed iframe
│   │   ├── GuessMap.svelte        # Leaflet map
│   │   ├── GameUI.svelte          # Buttons overlay
│   │   ├── Settings.svelte        # Settings modal
│   │   ├── ResultCard.svelte      # Distance display
│   │   └── LoadingBar.svelte      # Progress indicator
│   ├── App.svelte
│   └── main.ts
├── public/
│   ├── countries.json             # Lazy-loaded
│   └── settlements.json           # Lazy-loaded
├── scripts/
│   └── process-geonames.ts        # Generate settlements.json
├── biome.json
├── svelte.config.js
├── tsconfig.json
└── package.json
```

## Loading Strategy

**Everything lazy-loaded. Instant start via hardcoded locations.**

```
[0ms]     Skeleton UI + Street View iframe (hardcoded location)
[200ms]   Leaflet loaded → map appears
[500ms]   Street View ready → GAME PLAYABLE (round 1)
[1-2s]    Countries loaded → random country mode works
[3-5s]    Settlements loaded → urban mode + city selector enabled
```

### Initial Bundle (~5-7kb gzipped)
- Svelte runtime
- App skeleton
- Hardcoded starter locations

### Lazy-Loaded Assets
| Asset | Size (gzip) | Enables |
|-------|-------------|---------|
| Leaflet | ~40kb | Interactive map |
| countries.json | ~100kb | Country selector, random mode |
| settlements.json | ~1.5MB | Urban mode, city selector |

## Core Types

```typescript
// lib/types/settlement.ts
export interface Settlement {
  name: string;
  lat: number;
  lon: number;
  pop: number;
}

export type SettlementsData = Record<string, Settlement[]>;
```

```typescript
// lib/types/game.ts
export interface GameSettings {
  country: string;      // 'all' or country code
  city: Settlement | null;
  urbanOnly: boolean;
  minPop: number;
}

export interface Location {
  lat: number;
  lon: number;
}
```

## Asset Class

Generic fetch with progress tracking:

```typescript
// lib/data/asset.svelte.ts
export class Asset {
  url: string;
  data: Blob | null = $state(null);
  ready = $state(false);
  loading = $state(false);
  error: Error | null = $state(null);
  progress = $state({ done: 0, total: 0 });

  constructor(url: string) {
    this.url = url;
  }

  async load(): Promise<Blob> {
    if (this.ready) return this.data!;
    if (this.error) throw this.error;

    this.loading = true;
    this.error = null;

    try {
      const response = await fetch(this.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.progress.total = +response.headers.get('Content-Length') || 0;
      const reader = response.body!.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        this.progress.done += value.length;
      }

      this.data = new Blob(chunks);
      this.ready = true;
      return this.data;
    } catch (e) {
      this.error = e instanceof Error ? e : new Error(String(e));
      throw this.error;
    } finally {
      this.loading = false;
    }
  }

  reset(): void {
    this.data = null;
    this.ready = false;
    this.error = null;
    this.progress = { done: 0, total: 0 };
  }
}
```

## Domain Classes

```typescript
// lib/data/settlements.ts
import { Asset } from './asset.svelte';
import type { Settlement, SettlementsData } from '$lib/types';

export class Settlements {
  private asset = new Asset('/settlements.json');
  private data: SettlementsData | null = null;

  get ready() { return this.asset.ready; }
  get loading() { return this.asset.loading; }
  get error() { return this.asset.error; }
  get progress() { return this.asset.progress; }

  async load(): Promise<this> {
    const blob = await this.asset.load();
    this.data = JSON.parse(await blob.text());
    return this;
  }

  pickRandom(country: string, minPop = 0): Settlement | null {
    const filtered = this.data?.[country]?.filter(s => s.pop >= minPop) ?? [];
    if (!filtered.length) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  getCountries(): string[] {
    return Object.keys(this.data ?? {}).sort();
  }

  getCities(country: string, minPop = 0): Settlement[] {
    return this.data?.[country]?.filter(s => s.pop >= minPop) ?? [];
  }
}

export const settlements = new Settlements();
```

```typescript
// lib/data/countries.ts
import { Asset } from './asset.svelte';
import type { Location } from '$lib/types';

export class Countries {
  private asset = new Asset('/countries.json');
  private data: CountriesData | null = null;

  get ready() { return this.asset.ready; }
  get loading() { return this.asset.loading; }
  get error() { return this.asset.error; }
  get progress() { return this.asset.progress; }

  async load(): Promise<this> {
    const blob = await this.asset.load();
    this.data = JSON.parse(await blob.text());
    return this;
  }

  randomPointIn(country: string): Location {
    // Point-in-polygon random generation
    // Uses rejection sampling within bounding box
  }

  getCodes(): string[] {
    return Object.keys(this.data ?? {}).sort();
  }
}

export const countries = new Countries();
```

## Starter Locations

Hardcoded for instant first round:

```typescript
// lib/data/starters.ts
import type { Location } from '$lib/types';

interface StarterLocation extends Location {
  name: string;
}

export const STARTERS: StarterLocation[] = [
  // Hildesheim
  { lat: 52.15185, lon: 9.95050, name: 'St. Andreas, Hildesheim' },
  { lat: 52.15282, lon: 9.94442, name: 'St. Michaelis, Hildesheim' },
  { lat: 52.15317, lon: 9.95227, name: 'Marktplatz, Hildesheim' },
  { lat: 52.14972, lon: 9.94824, name: 'Dom, Hildesheim' },
  { lat: 52.15939, lon: 9.95279, name: 'Hauptbahnhof, Hildesheim' },
  // World
  { lat: 35.6595, lon: 139.7004, name: 'Shibuya, Tokyo' },
  { lat: 48.8584, lon: 2.2945, name: 'Eiffel Tower, Paris' },
  { lat: 40.7580, lon: -73.9855, name: 'Times Square, NYC' },
  { lat: -33.8568, lon: 151.2153, name: 'Sydney Opera House' },
  { lat: 51.5007, lon: -0.1246, name: 'Big Ben, London' },
];

export function pickStarter(): StarterLocation {
  return STARTERS[Math.floor(Math.random() * STARTERS.length)];
}
```

## App.svelte

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import StreetView from './components/StreetView.svelte';
  import GuessMap from './components/GuessMap.svelte';
  import GameUI from './components/GameUI.svelte';
  import Settings from './components/Settings.svelte';
  import LoadingBar from './components/LoadingBar.svelte';
  import { countries } from '$lib/data/countries';
  import { settlements } from '$lib/data/settlements';
  import { pickStarter } from '$lib/data/starters';
  import { generateLocation } from '$lib/util/location';
  import type { Location, GameSettings } from '$lib/types';

  let L = $state<typeof import('leaflet') | null>(null);
  let location = $state<Location | null>(null);
  let guess = $state<Location | null>(null);
  let showResult = $state(false);
  let showSettings = $state(false);

  let settings = $state<GameSettings>({
    country: 'all',
    city: null,
    urbanOnly: false,
    minPop: 10000,
  });

  async function nextLocation() {
    showResult = false;
    guess = null;

    // Use starter if data not ready, otherwise generate
    if (!countries.ready) {
      location = pickStarter();
    } else {
      location = await generateLocation(settings);
    }
  }

  function submitGuess(latlng: Location) {
    guess = latlng;
    showResult = true;
  }

  onMount(async () => {
    // Start game immediately with hardcoded location
    nextLocation();

    // Load assets in parallel
    L = await import('leaflet');
    countries.load();      // fire and forget
    settlements.load();    // fire and forget
  });
</script>

<div class="game">
  <StreetView {location} />

  {#if L}
    <GuessMap {L} {location} {guess} {showResult} onGuess={submitGuess} />
  {:else}
    <div class="map-skeleton">Loading map...</div>
  {/if}

  <GameUI
    {showResult}
    {location}
    {guess}
    onNext={nextLocation}
    onSkip={nextLocation}
    onSettings={() => (showSettings = true)}
  />

  {#if showSettings}
    <Settings bind:settings onClose={() => (showSettings = false)} />
  {/if}

  <LoadingBar />
</div>
```

## Street View

```svelte
<!-- components/StreetView.svelte -->
<script lang="ts">
  import type { Location } from '$lib/types';

  let { location } = $props<{ location: Location | null }>();

  let src = $derived(
    location
      ? `https://www.google.com/maps/embed/v1/streetview?key=API_KEY&location=${location.lat},${location.lon}&fov=90`
      : ''
  );
</script>

{#if location}
  <iframe class="streetview" {src} allowfullscreen></iframe>
{:else}
  <div class="streetview-skeleton">Loading...</div>
{/if}

<style>
  .streetview {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
</style>
```

## Loading Bar

```svelte
<!-- components/LoadingBar.svelte -->
<script lang="ts">
  import { countries } from '$lib/data/countries';
  import { settlements } from '$lib/data/settlements';

  let totalDone = $derived(countries.progress.done + settlements.progress.done);
  let totalSize = $derived(countries.progress.total + settlements.progress.total);
  let percent = $derived(totalSize > 0 ? Math.round((totalDone / totalSize) * 100) : 0);
  let allReady = $derived(countries.ready && settlements.ready);
</script>

{#if !allReady}
  <div class="loading-bar">
    <div class="progress" style="width: {percent}%"></div>
    <span>{percent}%</span>
  </div>
{/if}

<style>
  .loading-bar {
    position: fixed;
    bottom: 16px;
    left: 16px;
    width: 120px;
    height: 24px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 4px;
    overflow: hidden;
  }
  .progress {
    height: 100%;
    background: #4caf50;
    transition: width 0.2s;
  }
  span {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
  }
</style>
```

## Data Files

### settlements.json (~1.5MB gzipped)
GeoNames cities500 data, grouped by country code:
```json
{
  "DE": [
    { "name": "Berlin", "lat": 52.52, "lon": 13.405, "pop": 3644826 },
    { "name": "Hildesheim", "lat": 52.15, "lon": 9.95, "pop": 103052 }
  ]
}
```

### countries.json (~100kb gzipped)
Simplified country polygons from Natural Earth.

**Attribution**: "City data from [GeoNames](https://geonames.org) under CC BY 4.0"

## Build & Deploy

```bash
# Development
bun dev

# Lint & format
bunx biome check --apply .

# Build
bun run build

# Output: dist/ (static files, deploy anywhere)
```

## Verification

1. `bun dev` starts without errors
2. Game loads in <1s with hardcoded location
3. Leaflet map appears after ~200ms
4. Countries dropdown populates after ~1-2s
5. Urban mode toggle enables after ~3-5s
6. Progress bar shows download progress
7. Guess → distance shown correctly
8. Skip → new location loads
9. Settings persist across rounds
10. `bunx biome check` passes
