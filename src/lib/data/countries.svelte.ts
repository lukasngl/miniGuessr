import type { CountriesData, Country, Location } from "$lib/types";
import { pointInPolygon, randomPointInBbox } from "$lib/util/random";
import { Asset } from "./asset.svelte";

// Countries with no or very limited Street View coverage
const NO_STREETVIEW_COVERAGE = new Set([
	"AF", // Afghanistan
	"BY", // Belarus
	"CN", // China
	"CU", // Cuba
	"IR", // Iran
	"IQ", // Iraq
	"KP", // North Korea
	"LY", // Libya
	"MM", // Myanmar
	"SD", // Sudan
	"SS", // South Sudan
	"SY", // Syria
	"TM", // Turkmenistan
	"UZ", // Uzbekistan
	"YE", // Yemen
	"CF", // Central African Republic
	"TD", // Chad
	"CG", // Congo
	"CD", // DR Congo
	"GQ", // Equatorial Guinea
	"ER", // Eritrea
	"ET", // Ethiopia (limited)
	"NE", // Niger
	"SO", // Somalia
	"TJ", // Tajikistan
	"VE", // Venezuela
]);

export class Countries {
	private asset = new Asset("/countries.json");
	private data: CountriesData | null = null;

	get ready() {
		return this.asset.ready;
	}
	get loading() {
		return this.asset.loading;
	}
	get error() {
		return this.asset.error;
	}
	get progress() {
		return this.asset.progress;
	}

	async load(): Promise<this> {
		const blob = await this.asset.load();
		this.data = JSON.parse(await blob.text());
		return this;
	}

	getCountry(code: string): Country | null {
		return this.data?.[code] ?? null;
	}

	randomPointIn(countryCode: string, maxAttempts = 1000): Location | null {
		const country = this.data?.[countryCode];
		if (!country) return null;

		const [minLon, minLat, maxLon, maxLat] = country.bbox;

		// Rejection sampling within bounding box
		for (let i = 0; i < maxAttempts; i++) {
			const point = randomPointInBbox(minLon, minLat, maxLon, maxLat);

			// Check if point is inside any polygon of the country
			for (const polygon of country.geometry) {
				if (pointInPolygon(point, polygon)) {
					return { lat: point[1], lon: point[0] };
				}
			}
		}

		// Fallback: return center of bbox
		return {
			lat: (minLat + maxLat) / 2,
			lon: (minLon + maxLon) / 2,
		};
	}

	getCodes(): string[] {
		return Object.keys(this.data ?? {}).sort();
	}

	getCodesWithCoverage(): string[] {
		return this.getCodes().filter((code) => !NO_STREETVIEW_COVERAGE.has(code));
	}

	hasCoverage(code: string): boolean {
		return !NO_STREETVIEW_COVERAGE.has(code);
	}

	getName(code: string): string {
		return this.data?.[code]?.name ?? code;
	}

	getAll(): CountriesData | null {
		return this.data;
	}
}

export const countries = new Countries();
