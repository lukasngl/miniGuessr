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

let cbCounter = 0;

/** Execute a JSONP request, returning the raw callback argument. */
function jsonp(url: string, timeout = 5000): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const name = `_sv_cb_${cbCounter++}`;
		const script = document.createElement("script");

		const cleanup = () => {
			delete (window as unknown as Record<string, unknown>)[name];
			script.remove();
		};

		const timer = setTimeout(() => {
			cleanup();
			reject(new Error("JSONP timeout"));
		}, timeout);

		(window as unknown as Record<string, unknown>)[name] = (data: unknown) => {
			clearTimeout(timer);
			cleanup();
			resolve(data);
		};

		script.src = `${url}&callback=${name}`;
		script.onerror = () => {
			clearTimeout(timer);
			cleanup();
			reject(new Error("JSONP script error"));
		};
		document.head.appendChild(script);
	});
}

/**
 * Check Street View coverage at a location using the unofficial GeoPhotoService endpoint.
 * Uses JSONP to bypass CORS — no proxy needed, works on static hosting.
 * Returns the actual panorama coordinates if coverage exists, or null if not.
 */
export async function checkCoverage(
	lat: number,
	lon: number,
	radius = 1000,
): Promise<Location | null> {
	const pb = `!1m5!1sapiv3!5sUS!11m2!1m1!1b0!2m4!1m2!3d${lat}!4d${lon}!2d${radius}!3m18!2m2!1sen!2sUS!9m1!1e2!11m12!1m3!1e2!2b1!3e2!1m3!1e3!2b1!3e2!1m3!1e10!2b1!3e2!4m6!1e1!1e2!1e3!1e4!1e8!1e6`;
	const url = `https://maps.googleapis.com/maps/api/js/GeoPhotoService.SingleImageSearch?pb=${encodeURIComponent(pb)}`;

	let data: unknown;
	try {
		data = await jsonp(url);
	} catch {
		return null;
	}

	// Response is a nested array; verify it has a valid description
	try {
		const arr = data as Array<unknown>;
		const description = (arr as any)[1]?.[3]?.[2]?.[1]?.[0];
		if (!description) return null;
	} catch {
		return null;
	}

	// Extract panorama coordinates from the nested structure
	// Serialize and scan for coordinate pairs close to the input
	const text = JSON.stringify(data);
	const parts = text
		.split(",")
		.map((x) => x.match(/-?\d+(\.\d+)?/g))
		.filter(Boolean)
		.flat()
		.map((x) => Number.parseFloat(x!));

	const nearby = parts.filter(
		(x) => Math.abs(x - lat) < 1 || Math.abs(x - lon) < 1,
	);

	for (let i = 0; i < nearby.length - 1; i++) {
		if (
			Math.abs(nearby[i] - lat) < 0.1 &&
			Math.abs(nearby[i + 1] - lon) < 0.1
		) {
			return { lat: nearby[i], lon: nearby[i + 1] };
		}
	}

	return null;
}
