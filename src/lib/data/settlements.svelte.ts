import type { Settlement, SettlementsData } from "$lib/types";
import { Asset } from "./asset.svelte";

export class Settlements {
	private asset = new Asset("/settlements.json");
	private data: SettlementsData | null = null;

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

	pickRandom(country: string, minPop = 0): Settlement | null {
		const filtered = this.data?.[country]?.filter((s) => s.pop >= minPop) ?? [];
		if (!filtered.length) return null;
		return filtered[Math.floor(Math.random() * filtered.length)];
	}

	getCountries(): string[] {
		return Object.keys(this.data ?? {}).sort();
	}

	getCities(country: string, minPop = 0): Settlement[] {
		return this.data?.[country]?.filter((s) => s.pop >= minPop) ?? [];
	}
}

export const settlements = new Settlements();
