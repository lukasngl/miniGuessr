<script lang="ts">
import type { Location } from "$lib/types";
import ResultCard from "./ResultCard.svelte";

interface Props {
	showResult: boolean;
	location: Location | null;
	guess: Location | null;
	onNext: () => void;
	onSettings: () => void;
}

const { showResult, location, guess, onNext, onSettings }: Props = $props();
</script>

<div class="game-ui">
	<button class="settings-btn" onclick={onSettings} aria-label="Settings">
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="3"></circle>
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
		</svg>
	</button>

	{#if showResult && location && guess}
		<div class="result-container">
			<ResultCard {location} {guess} />
			<button class="btn primary" onclick={onNext}>Next Round</button>
		</div>
	{/if}
</div>

<style>
	.game-ui {
		position: fixed;
		z-index: 200;
	}

	.settings-btn {
		position: fixed;
		top: 16px;
		left: 16px;
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
		transition: background 0.2s;
	}

	.settings-btn:hover {
		background: rgba(0, 0, 0, 0.85);
	}

	.result-container {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		gap: 16px;
		align-items: center;
	}

	.btn {
		padding: 12px 24px;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.1s;
	}

	.btn:hover {
		transform: scale(1.02);
	}

	.btn:active {
		transform: scale(0.98);
	}

	.btn.primary {
		background: #4285f4;
		color: white;
	}
</style>
