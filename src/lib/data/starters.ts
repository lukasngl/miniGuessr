import type { StarterLocation } from "$lib/types";

export const STARTERS: StarterLocation[] = [
	// Hildesheim
	{ lat: 52.15185, lon: 9.9505, name: "St. Andreas, Hildesheim" },
	{ lat: 52.15282, lon: 9.94442, name: "St. Michaelis, Hildesheim" },
	{ lat: 52.15317, lon: 9.95227, name: "Marktplatz, Hildesheim" },
	{ lat: 52.14972, lon: 9.94824, name: "Dom, Hildesheim" },
	{ lat: 52.15939, lon: 9.95279, name: "Hauptbahnhof, Hildesheim" },
	// World
	{ lat: 35.6595, lon: 139.7004, name: "Shibuya, Tokyo" },
	{ lat: 48.8584, lon: 2.2945, name: "Eiffel Tower, Paris" },
	{ lat: 40.758, lon: -73.9855, name: "Times Square, NYC" },
	{ lat: -33.8568, lon: 151.2153, name: "Sydney Opera House" },
	{ lat: 51.5007, lon: -0.1246, name: "Big Ben, London" },
];

export function pickStarter(): StarterLocation {
	return STARTERS[Math.floor(Math.random() * STARTERS.length)];
}
