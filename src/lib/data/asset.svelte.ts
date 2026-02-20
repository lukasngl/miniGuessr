import { base } from "$app/paths";

export class Asset {
	url: string;
	data: Blob | null = $state(null);
	ready = $state(false);
	loading = $state(false);
	error: Error | null = $state(null);
	progress = $state({ done: 0, total: 0 });

	constructor(url: string) {
		this.url = url;
	}

	async load(): Promise<Blob> {
		if (this.ready && this.data) return this.data;
		if (this.error) throw this.error;

		this.loading = true;
		this.error = null;

		try {
			const response = await fetch(`${base}${this.url}`);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			this.progress.total = Number(response.headers.get("Content-Length")) || 0;

			if (!response.body) {
				throw new Error("Response body is null");
			}

			const reader = response.body.getReader();
			const chunks: BlobPart[] = [];

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				chunks.push(value);
				this.progress.done += value.length;
			}

			this.data = new Blob(chunks);
			this.ready = true;
			return this.data;
		} catch (e) {
			this.error = e instanceof Error ? e : new Error(String(e));
			throw this.error;
		} finally {
			this.loading = false;
		}
	}

	reset(): void {
		this.data = null;
		this.ready = false;
		this.error = null;
		this.progress = { done: 0, total: 0 };
	}
}
