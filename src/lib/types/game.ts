import type { Settlement } from "./settlement";

export type LocationMode = "random" | "urban" | "city";

export interface GameSettings {
	country: string; // 'all' or country code
	mode: LocationMode;
	city: Settlement | null;
	minPop: number;
	cityRadius: number; // km radius around city center
}

export interface Location {
	lat: number;
	lon: number;
}

export interface StarterLocation extends Location {
	name: string;
}
