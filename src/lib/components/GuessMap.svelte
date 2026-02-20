<script lang="ts">
import type { Map as LeafletMap, Marker, Polyline, TileLayer } from "leaflet";
import { onDestroy, onMount } from "svelte";
import type { Location } from "$lib/types";

interface Props {
	L: typeof import("leaflet");
	location: Location | null;
	guess: Location | null;
	showResult: boolean;
	bounds: [[number, number], [number, number]] | null; // [[south, west], [north, east]]
	onGuess: (latlng: Location) => void;
}

const { L, location, guess, showResult, bounds, onGuess }: Props = $props();

type MapType = "m" | "y" | "p";
const MAP_TYPES: { value: MapType; label: string }[] = [
	{ value: "m", label: "Map" },
	{ value: "y", label: "Hybrid" },
	{ value: "p", label: "Terrain" },
];

let mapContainer: HTMLDivElement;
let map: LeafletMap | null = null;
let tileLayer: TileLayer | null = null;
let guessMarker: Marker | null = null;
let targetMarker: Marker | null = null;
let line: Polyline | null = null;
let mapType = $state<MapType>("m");

function getTileUrl(type: MapType): string {
	return `https://mt{s}.google.com/vt/lyrs=${type}&x={x}&y={y}&z={z}&scale=2`;
}

function updateTileLayer() {
	if (!map) return;
	if (tileLayer) {
		tileLayer.remove();
	}
	tileLayer = L.tileLayer(getTileUrl(mapType), {
		maxZoom: 22,
		subdomains: ["0", "1", "2", "3"],
	}).addTo(map);
}

onMount(() => {
	map = L.map(mapContainer, {
		center: [20, 0],
		zoom: 2,
		zoomControl: false,
		attributionControl: false,
	});

	updateTileLayer();

	L.control.zoom({ position: "topright" }).addTo(map);

	map.on("click", (e) => {
		if (showResult) return;

		const latlng: Location = { lat: e.latlng.lat, lon: e.latlng.lng };

		if (guessMarker) {
			guessMarker.setLatLng([latlng.lat, latlng.lon]);
		} else if (map) {
			guessMarker = L.marker([latlng.lat, latlng.lon], {
				icon: L.divIcon({
					className: "guess-marker",
					html: '<div class="marker-dot guess"></div>',
					iconSize: [20, 20],
					iconAnchor: [10, 10],
				}),
			}).addTo(map);
		}

		onGuess(latlng);
	});
});

onDestroy(() => {
	map?.remove();
});

$effect(() => {
	if (!map || !showResult || !location || !guess) {
		// Clean up result markers when not showing result
		if (!showResult) {
			targetMarker?.remove();
			targetMarker = null;
			line?.remove();
			line = null;
		}
		return;
	}

	// Show target marker
	targetMarker = L.marker([location.lat, location.lon], {
		icon: L.divIcon({
			className: "target-marker",
			html: '<div class="marker-dot target"></div>',
			iconSize: [20, 20],
			iconAnchor: [10, 10],
		}),
	}).addTo(map);

	// Draw line between guess and target
	line = L.polyline(
		[
			[guess.lat, guess.lon],
			[location.lat, location.lon],
		],
		{
			color: "#ff4444",
			weight: 2,
			dashArray: "5, 10",
		},
	).addTo(map);

	// Fit bounds to show both markers
	map.fitBounds(
		[
			[guess.lat, guess.lon],
			[location.lat, location.lon],
		],
		{ padding: [50, 50] },
	);
});

// Clean up guess marker when starting new round
$effect(() => {
	if (!showResult && guessMarker) {
		guessMarker.remove();
		guessMarker = null;
	}
});

// Zoom to bounds when they change (and not showing result)
$effect(() => {
	if (!map || showResult || !bounds) return;
	map.fitBounds(bounds, { padding: [20, 20], maxZoom: 12 });
});

// Update tile layer when map type changes
$effect(() => {
	if (map && mapType) {
		updateTileLayer();
	}
});

function handleMouseEnter() {
	setTimeout(() => map?.invalidateSize(), 300);
}
</script>

<div class="map-wrapper" onmouseenter={handleMouseEnter} role="application">
	<div class="map-type-switcher">
		{#each MAP_TYPES as { value, label } (value)}
			<button
				class="map-type-btn"
				class:active={mapType === value}
				onclick={() => (mapType = value)}
			>
				{label}
			</button>
		{/each}
	</div>
	<div class="map" bind:this={mapContainer}></div>
</div>

<style>
	.map-wrapper {
		position: relative;
		width: 100%;
		height: min(200px, 25vh);
		border-radius: 0.5rem;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		transition: height 0.3s ease;
	}

	/* Height grows when parent .map-area is hovered */
	:global(.map-area:hover) .map-wrapper {
		height: min(350px, 50vh);
	}

	.map-type-switcher {
		position: absolute;
		top: 8px;
		left: 8px;
		z-index: 1000;
		display: flex;
		gap: 2px;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 4px;
		padding: 4px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	}

	.map-type-btn {
		padding: 4px 8px;
		border: none;
		border-radius: 3px;
		background: transparent;
		color: #333;
		font-size: 11px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.map-type-btn:hover {
		background: rgba(66, 133, 244, 0.1);
	}

	.map-type-btn.active {
		background: #4285f4;
		color: white;
	}

	.map {
		width: 100%;
		height: 100%;
	}

	:global(.marker-dot) {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 3px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	:global(.marker-dot.guess) {
		background: #4285f4;
	}

	:global(.marker-dot.target) {
		background: #34a853;
	}

	@media (max-width: 768px) {
		.map-wrapper {
			height: var(--map-height, 33vh);
			border-radius: 0;
			transition: none;
		}

		:global(.map-area:hover) .map-wrapper {
			height: var(--map-height, 33vh);
		}
	}
</style>
