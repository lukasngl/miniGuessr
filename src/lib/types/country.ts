export type Position = [number, number];
export type Ring = Position[];
export type Polygon = Ring[];
export type MultiPolygon = Polygon[];

export interface Country {
	name: string;
	bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
	geometry: MultiPolygon;
}

export type CountriesData = Record<string, Country>;
