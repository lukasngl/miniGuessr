import { PUBLIC_GOOGLE_MAPS_API_KEY } from "$env/static/public";
import type { Location } from "$lib/types";

/**
 * Build a Google Street View Embed URL
 */
export function buildStreetViewUrl(location: Location): string {
	const params = new URLSearchParams({
		key: PUBLIC_GOOGLE_MAPS_API_KEY,
		location: `${location.lat},${location.lon}`,
		fov: "90",
	});

	return `https://www.google.com/maps/embed/v1/streetview?${params}`;
}

/**
 * Check if the API key is configured
 */
export function isApiKeyConfigured(): boolean {
	return PUBLIC_GOOGLE_MAPS_API_KEY.length > 0;
}

const SINGLE_IMAGE_SEARCH_URL =
	"https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/SingleImageSearch";

/**
 * Check Street View coverage at a location using the unofficial maps.js
 * internal SingleImageSearch endpoint (the grpc-web call the embed API makes).
 * POST + CORS works from the browser directly, no JSONP or proxy needed.
 * Returns the actual panorama coordinates if coverage exists, or null if not.
 */
export async function checkCoverage(
	lat: number,
	lon: number,
	radius = 1000,
): Promise<Location | null> {
	let data: unknown;
	try {
		const response = await fetch(SINGLE_IMAGE_SEARCH_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json+protobuf",
				"X-User-Agent": "grpc-web-javascript/0.1",
			},
			body: buildSingleImageSearchBody(lat, lon, radius),
		});
		if (!response.ok) return null;
		data = await response.json();
	} catch {
		return null;
	}

	return findPanoPosition(data);
}

/** Encode the request in the JSON+protobuf wire format the endpoint expects. */
function buildSingleImageSearchBody(
	lat: number,
	lon: number,
	radius: number,
): string {
	return JSON.stringify([
		["apiv3", null, null, null, "US", null, null, null, null, null, [[0]]],
		[[null, null, lat, lon], radius],
		[
			null,
			["en"],
			null,
			null,
			null,
			null,
			null,
			null,
			[2],
			null,
			[[[2, 1, 2], [3, 1, 2], [10, 1, 2]]],
		],
		[[1, 2, 3, 4, 8, 6]],
		null,
		null,
		null,
		null,
		"https://www.google.com/maps/embed/v1/streetview",
	]);
}

/**
 * Find the snapped panorama position in the response: a depth-first search
 * for a [null, null, lat, lon] array, the format of every pano position.
 * A no-coverage response ([[5,"generic","Search returned no images."]])
 * contains none, so the search returns null.
 */
function findPanoPosition(data: unknown): Location | null {
	if (!Array.isArray(data)) return null;

	for (const item of data) {
		if (
			Array.isArray(item) &&
			item.length === 4 &&
			item[0] === null &&
			item[1] === null
		) {
			const panoLat = item[2];
			const panoLon = item[3];
			if (typeof panoLat === "number" && typeof panoLon === "number") {
				return { lat: panoLat, lon: panoLon };
			}
		}

		const nested = findPanoPosition(item);
		if (nested) return nested;
	}

	return null;
}
