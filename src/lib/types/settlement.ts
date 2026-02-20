export interface Settlement {
	name: string;
	lat: number;
	lon: number;
	pop: number;
}

export type SettlementsData = Record<string, Settlement[]>;
