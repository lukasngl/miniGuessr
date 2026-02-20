<script lang="ts">
import { countries } from "$lib/data/countries.svelte";
import { settlements } from "$lib/data/settlements.svelte";

const totalDone = $derived(countries.progress.done + settlements.progress.done);
const totalSize = $derived(
	countries.progress.total + settlements.progress.total,
);
// Known file sizes (approximate) as fallback when Content-Length not available
const EXPECTED_SIZE = 14_500_000; // ~14MB for settlements + ~400KB for countries
const percent = $derived(
	totalSize > 0
		? Math.round((totalDone / totalSize) * 100)
		: Math.min(99, Math.round((totalDone / EXPECTED_SIZE) * 100))
);
const allReady = $derived(countries.ready && settlements.ready);
const isLoading = $derived(countries.loading || settlements.loading);

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>

{#if !allReady}
	<div class="loading-bar">
		<div class="progress" style="width: {percent}%"></div>
		<span>
			{#if isLoading}
				{formatBytes(totalDone)} {#if totalSize > 0}/ {formatBytes(totalSize)}{/if}
			{:else if !countries.ready || !settlements.ready}
				Starting...
			{/if}
		</span>
	</div>
{/if}

<style>
	.loading-bar {
		position: fixed;
		bottom: 16px;
		left: 16px;
		width: 160px;
		height: 28px;
		background: rgba(0, 0, 0, 0.8);
		border-radius: 6px;
		overflow: hidden;
		z-index: 300;
	}

	.progress {
		position: absolute;
		inset: 0;
		height: 100%;
		background: #4caf50;
		transition: width 0.2s ease;
	}

	span {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 12px;
		font-weight: 500;
		z-index: 1;
	}
</style>
