import type { Location } from "$lib/types";

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate the great-circle distance between two points using the Haversine formula.
 * @returns Distance in kilometers
 */
export function haversineDistance(a: Location, b: Location): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;

	const dLat = toRad(b.lat - a.lat);
	const dLon = toRad(b.lon - a.lon);

	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);

	const sinDLat = Math.sin(dLat / 2);
	const sinDLon = Math.sin(dLon / 2);

	const h =
		sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

	return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
	if (km < 1) {
		return `${Math.round(km * 1000)} m`;
	}
	if (km < 10) {
		return `${km.toFixed(1)} km`;
	}
	return `${Math.round(km)} km`;
}
