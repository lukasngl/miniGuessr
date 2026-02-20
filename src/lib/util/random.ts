import type { Polygon, Position } from "$lib/types";

/**
 * Generate a random point within a bounding box
 */
export function randomPointInBbox(
	minLon: number,
	minLat: number,
	maxLon: number,
	maxLat: number,
): Position {
	const lon = minLon + Math.random() * (maxLon - minLon);
	const lat = minLat + Math.random() * (maxLat - minLat);
	return [lon, lat];
}

/**
 * Check if a point is inside a polygon using ray casting algorithm.
 * Polygon is an array of rings, where the first ring is the outer boundary
 * and subsequent rings are holes.
 */
export function pointInPolygon(point: Position, polygon: Polygon): boolean {
	const [x, y] = point;

	// Check outer ring (must be inside)
	if (!pointInRing(x, y, polygon[0])) {
		return false;
	}

	// Check holes (must not be inside any hole)
	for (let i = 1; i < polygon.length; i++) {
		if (pointInRing(x, y, polygon[i])) {
			return false;
		}
	}

	return true;
}

/**
 * Ray casting algorithm to check if point is inside a ring
 */
function pointInRing(x: number, y: number, ring: Position[]): boolean {
	let inside = false;

	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const xi = ring[i][0];
		const yi = ring[i][1];
		const xj = ring[j][0];
		const yj = ring[j][1];

		const intersect =
			yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

		if (intersect) {
			inside = !inside;
		}
	}

	return inside;
}
