import { countries } from "$lib/data/countries.svelte";
import { settlements } from "$lib/data/settlements.svelte";
import { pickStarter } from "$lib/data/starters";
import type { GameSettings, Location } from "$lib/types";
import { checkCoverage } from "./streetview";

const MAX_ATTEMPTS = 20;

/**
 * Generate a candidate location based on game settings (no coverage check).
 */
function generateCandidate(settings: GameSettings): Location {
	switch (settings.mode) {
		case "city":
			if (settings.city) {
				return randomPointInRadius(settings.city.lat, settings.city.lon, settings.cityRadius);
			}
			break;

		case "urban":
			if (settlements.ready) {
				const country =
					settings.country === "all"
						? pickRandomCountry(settlements.getCountries())
						: settings.country;

				const settlement = settlements.pickRandom(country, settings.minPop);
				if (settlement) {
					return { lat: settlement.lat, lon: settlement.lon };
				}
			}
			break;

		case "random":
			if (countries.ready && settings.country !== "all") {
				const point = countries.randomPointIn(settings.country);
				if (point) return point;
			}
			break;
	}

	return pickStarter();
}

/**
 * Generate a location with Street View coverage.
 * Retries up to MAX_ATTEMPTS times, calling onAttempt with the current attempt number.
 * Returns the snapped panorama coordinates for accurate scoring.
 */
export async function generateLocation(
	settings: GameSettings,
	onAttempt?: (attempt: number) => void,
): Promise<Location> {
	for (let i = 1; i <= MAX_ATTEMPTS; i++) {
		onAttempt?.(i);
		const candidate = generateCandidate(settings);
		const snapped = await checkCoverage(candidate.lat, candidate.lon);
		if (snapped) return snapped;
	}

	// Fallback to a starter location (known to have coverage)
	return pickStarter();
}

function pickRandomCountry(codes: string[]): string {
	return codes[Math.floor(Math.random() * codes.length)];
}

/** Pick a uniformly random point within a circle of given radius (km). */
function randomPointInRadius(lat: number, lon: number, radiusKm: number): Location {
	const r = radiusKm * Math.sqrt(Math.random());
	const theta = Math.random() * 2 * Math.PI;
	// 1 degree latitude ~= 111.32 km
	const dLat = (r * Math.cos(theta)) / 111.32;
	const dLon = (r * Math.sin(theta)) / (111.32 * Math.cos((lat * Math.PI) / 180));
	return { lat: lat + dLat, lon: lon + dLon };
}
