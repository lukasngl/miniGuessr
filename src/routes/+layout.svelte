<script lang="ts">
import favicon from "$lib/assets/favicon.svg";
import "leaflet/dist/leaflet.css";

const { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>miniGuessr</title>
</svelte:head>

{@render children()}

<style>
	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(html, body) {
		width: 100%;
		height: 100%;
		overflow: hidden;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
			Ubuntu, Cantarell, sans-serif;
	}

	:global(body) {
		background: #1a1a1a;
	}
</style>
