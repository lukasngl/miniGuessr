<script lang="ts">
import { onMount } from "svelte";
import GameUI from "$lib/components/GameUI.svelte";
import GuessMap from "$lib/components/GuessMap.svelte";
import LoadingBar from "$lib/components/LoadingBar.svelte";
import Settings from "$lib/components/Settings.svelte";
import StreetView from "$lib/components/StreetView.svelte";
import { countries } from "$lib/data/countries.svelte";
import { settlements } from "$lib/data/settlements.svelte";
import { pickStarter } from "$lib/data/starters";
import type { GameSettings, Location } from "$lib/types";
import { generateLocation } from "$lib/util/location";

let L = $state<typeof import("leaflet") | null>(null);
let location = $state<Location | null>(null);
let guess = $state<Location | null>(null);
let pendingGuess = $state<Location | null>(null);
let showResult = $state(false);
let showSettings = $state(false);
let searching = $state(false);
let attempts = $state(0);

const SETTINGS_KEY = "miniguessr-settings";
const defaultSettings: GameSettings = {
	country: "all",
	mode: "random",
	city: null,
	minPop: 10000,
	cityRadius: 5,
	mapSize: 25,
	mapSizeExpanded: 50,
	mapHeight: 33,
};

function loadSettings(): GameSettings {
	if (typeof localStorage === "undefined") return defaultSettings;
	try {
		const stored = localStorage.getItem(SETTINGS_KEY);
		if (stored) {
			return { ...defaultSettings, ...JSON.parse(stored) };
		}
	} catch {
		// Ignore parse errors
	}
	return defaultSettings;
}

function saveSettings(s: GameSettings) {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
	} catch {
		// Ignore storage errors
	}
}

let settings = $state<GameSettings>(loadSettings());

// Calculate map bounds based on settings
let mapBounds = $derived.by((): [[number, number], [number, number]] | null => {
	// If a city is selected, create bounds around it
	if (settings.mode === "city" && settings.city) {
		const { lat, lon } = settings.city;
		const offset = settings.cityRadius / 111.32;
		return [
			[lat - offset, lon - offset],
			[lat + offset, lon + offset],
		];
	}

	// If a country is selected, use its bounding box
	if (settings.country !== "all" && countries.ready) {
		const country = countries.getCountry(settings.country);
		if (country) {
			const [minLon, minLat, maxLon, maxLat] = country.bbox;
			return [
				[minLat, minLon],
				[maxLat, maxLon],
			];
		}
	}

	// World view
	return null;
});

async function nextLocation() {
	showResult = false;
	guess = null;
	pendingGuess = null;
	searching = true;
	attempts = 0;

	try {
		if (!countries.ready) {
			location = pickStarter();
		} else {
			location = await generateLocation(settings, (n) => { attempts = n; });
		}
	} finally {
		searching = false;
	}
}

function handleGuess(latlng: Location) {
	pendingGuess = latlng;
}

function submitGuess() {
	if (pendingGuess) {
		guess = pendingGuess;
		showResult = true;
	}
}

onMount(async () => {
	// Start game immediately with hardcoded location
	nextLocation();

	// Load Leaflet
	L = await import("leaflet");

	// Load assets in parallel (fire and forget)
	countries.load().catch(console.error);
	settlements.load().catch(console.error);
});
</script>

<div class="game">
	<StreetView {location} />

	{#if searching}
		<div class="search-overlay">
			<div class="search-spinner"></div>
			<span>Finding Street View... attempt {attempts}</span>
		</div>
	{/if}

	<!-- Map and action buttons container - hover expands both -->
	<div class="map-area" style="--map-size: {settings.mapSize}vw; --map-size-expanded: {settings.mapSizeExpanded}vw; --map-height: {settings.mapHeight}vh;">
		{#if L}
			<GuessMap
				{L}
				{location}
				guess={showResult ? guess : pendingGuess}
				{showResult}
				bounds={mapBounds}
				onGuess={handleGuess}
			/>
		{:else}
			<div class="map-skeleton">Loading map...</div>
		{/if}

		<div class="action-buttons">
			{#if showResult}
				<button class="btn primary" onclick={nextLocation}>Next Round</button>
			{:else}
				<button class="btn primary" onclick={submitGuess} disabled={!pendingGuess}>Submit Guess</button>
			{/if}
			<button class="btn secondary" onclick={nextLocation} disabled={showResult}>Skip</button>
		</div>
	</div>

	<GameUI
		{showResult}
		{location}
		{guess}
		onNext={nextLocation}
		onSettings={() => (showSettings = true)}
	/>

	{#if showSettings}
		<Settings
			{settings}
			onClose={() => (showSettings = false)}
			onApply={(newSettings) => {
				settings = newSettings;
				saveSettings(newSettings);
				showSettings = false;
				nextLocation();
			}}
		/>
	{/if}

	<LoadingBar />
</div>

<style>
	.search-overlay {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		font-size: 1.1rem;
		z-index: 500;
	}

	.search-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.game {
		width: 100vw;
		height: 100vh;
		position: relative;
		overflow: hidden;
	}

	.map-area {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		width: var(--map-size);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		z-index: 100;
		transition: width 0.3s ease;
	}

	.map-area:hover {
		width: var(--map-size-expanded);
	}

	.map-skeleton {
		width: 100%;
		height: 200px;
		background: rgba(0, 0, 0, 0.7);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #888;
	}

	.action-buttons {
		display: flex;
		gap: 8px;
	}

	.btn {
		padding: 12px 24px;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.1s, opacity 0.2s;
	}

	.btn:hover {
		transform: scale(1.02);
	}

	.btn:active {
		transform: scale(0.98);
	}

	.btn.primary {
		flex: 2;
		background: #4285f4;
		color: white;
	}

	.btn.primary:disabled {
		background: #7faaf7;
		cursor: not-allowed;
		opacity: 0.7;
	}

	.btn.primary:disabled:hover {
		transform: none;
	}

	.btn.secondary {
		flex: 1;
		background: rgba(255, 255, 255, 0.9);
		color: #333;
	}

	.btn.secondary:disabled {
		background: rgba(255, 255, 255, 0.5);
		color: #999;
		cursor: not-allowed;
		opacity: 0.7;
	}

	.btn.secondary:disabled:hover {
		transform: none;
	}

	@media (max-width: 768px) {
		.map-area {
			position: fixed;
			bottom: 0;
			right: 0;
			left: 0;
			width: 100% !important;
			border-radius: 0;
			gap: 0;
			transition: none;
		}

		.map-area:hover {
			width: 100% !important;
		}

		.action-buttons {
			gap: 0;
		}

		.btn {
			padding: 10px 16px;
			border-radius: 0;
		}

		.btn.primary:disabled {
			opacity: 1;
		}
	}
</style>
