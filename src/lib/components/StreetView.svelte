<script lang="ts">
import type { Location } from "$lib/types";
import { buildStreetViewUrl } from "$lib/util/streetview";

interface Props {
	location: Location | null;
}

const { location }: Props = $props();

const src = $derived(location ? buildStreetViewUrl(location) : "");
// svelte-ignore non_reactive_update
let iframe: HTMLIFrameElement;

function warpToStart() {
	if (iframe) {
		iframe.src = iframe.src;
	}
}
</script>

{#if location}
	<iframe bind:this={iframe} class="streetview" {src} allowfullscreen title="Street View"></iframe>
	<button class="warp-btn" onclick={warpToStart} title="Return to start">
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
			<path d="M3 3v5h5"/>
		</svg>
	</button>
{:else}
	<div class="streetview-skeleton">Loading...</div>
{/if}

<style>
	.streetview {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: calc(100vh + 300px);
		transform: translateY(-285px);
		border: none;
		z-index: 0;
	}

	.warp-btn {
		position: fixed;
		top: 16px;
		right: 16px;
		width: 44px;
		height: 44px;
		border: none;
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
		transition: background 0.2s;
	}

	.warp-btn:hover {
		background: rgba(0, 0, 0, 0.85);
	}

	.streetview-skeleton {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #1a1a1a;
		color: #888;
		font-size: 1.5rem;
	}
</style>
