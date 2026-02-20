<script lang="ts">
import { countries } from "$lib/data/countries.svelte";
import { settlements } from "$lib/data/settlements.svelte";
import type { GameSettings, LocationMode } from "$lib/types";
import SearchableSelect from "./SearchableSelect.svelte";

interface Props {
	settings: GameSettings;
	onClose: () => void;
	onApply: (settings: GameSettings) => void;
}

const { settings: initialSettings, onClose, onApply }: Props = $props();

// Work with a local copy so we can discard changes on dismiss
// svelte-ignore state_referenced_locally
let localSettings = $state<GameSettings>({ ...initialSettings, city: initialSettings.city });

const countryOptions = $derived([
	{ value: "all", label: "All Countries" },
	...(countries.ready
		? countries
				.getCodesWithCoverage()
				.map((code) => ({
					value: code,
					label: countries.getName(code),
				}))
				.sort((a, b) => a.label.localeCompare(b.label))
		: []),
]);

const cityOptions = $derived([
	{ value: "", label: "Random" },
	...(localSettings.country !== "all" && settlements.ready
		? settlements
				.getCities(localSettings.country, localSettings.minPop)
				.sort((a, b) => b.pop - a.pop)
				.map((city) => ({
					value: city.name,
					label: `${city.name} (${city.pop.toLocaleString()})`,
				}))
		: []),
]);

function handleCountryChange(value: string) {
	localSettings.country = value;
	localSettings.city = null;
	// City mode requires a specific country
	if (value === "all" && localSettings.mode === "city") {
		localSettings.mode = "random";
	}
}

function handleCityChange(value: string) {
	const cities = settlements.getCities(localSettings.country, localSettings.minPop);
	localSettings.city = value ? (cities.find((c) => c.name === value) ?? null) : null;
}

function handleModeChange(mode: LocationMode) {
	localSettings.mode = mode;
	if (mode !== "city") localSettings.city = null;
}

function handleMinPopChange(e: Event) {
	const target = e.target as HTMLSelectElement;
	localSettings.minPop = Number(target.value);
}

function handleApply() {
	onApply(localSettings);
}

function handleBackdropClick(e: MouseEvent) {
	if (e.target === e.currentTarget) {
		onClose();
	}
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") {
		onClose();
	}
}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-backdrop" onclick={handleBackdropClick} onkeydown={handleKeydown} role="dialog" aria-modal="true" tabindex="-1">
	<div class="modal">
		<div class="modal-header">
			<h2>Settings</h2>
			<button class="close-btn" onclick={onClose} aria-label="Close">×</button>
		</div>

		<div class="modal-body">
			<div class="field">
				<label for="country">Country</label>
				<SearchableSelect
					id="country"
					options={countryOptions}
					value={localSettings.country}
					placeholder="Search countries..."
					onchange={handleCountryChange}
				/>
				{#if !countries.ready}
					<span class="hint">Loading countries...</span>
				{/if}
			</div>

			<fieldset class="mode-group">
				<legend>Location Mode</legend>

				<label class="mode-option" class:active={localSettings.mode === "random"}>
					<input type="radio" name="mode" value="random" checked={localSettings.mode === "random"} onchange={() => handleModeChange("random")} />
					Random
				</label>

				<label class="mode-option" class:active={localSettings.mode === "urban"}>
					<input type="radio" name="mode" value="urban" checked={localSettings.mode === "urban"} onchange={() => handleModeChange("urban")} />
					Urban
					{#if !settlements.ready}
						<span class="hint">Loading...</span>
					{/if}
				</label>

				{#if localSettings.country !== "all"}
					<label class="mode-option" class:active={localSettings.mode === "city"}>
						<input type="radio" name="mode" value="city" checked={localSettings.mode === "city"} onchange={() => handleModeChange("city")} />
						City
					</label>
				{/if}
			</fieldset>

			{#if localSettings.mode === "urban"}
				<div class="field">
					<label for="minPop">Minimum Population</label>
					<select id="minPop" value={localSettings.minPop} onchange={handleMinPopChange}>
						<option value={0}>Any</option>
						<option value={1000}>1,000+</option>
						<option value={10000}>10,000+</option>
						<option value={50000}>50,000+</option>
						<option value={100000}>100,000+</option>
						<option value={500000}>500,000+</option>
						<option value={1000000}>1,000,000+</option>
					</select>
				</div>
			{/if}

			{#if localSettings.mode === "city" && localSettings.country !== "all"}
				<div class="field">
					<label for="city">City</label>
					<SearchableSelect
						id="city"
						options={cityOptions}
						value={localSettings.city?.name ?? ""}
						placeholder="Search cities..."
						onchange={handleCityChange}
					/>
				</div>

				<div class="field">
					<label for="cityRadius">Radius: {localSettings.cityRadius} km</label>
					<input
						type="range"
						id="cityRadius"
						min={1}
						max={50}
						bind:value={localSettings.cityRadius}
					/>
				</div>
			{/if}

			<fieldset class="mode-group">
				<legend>Map Size</legend>
				<div class="field">
					<label for="mapSize">Normal: {localSettings.mapSize}vw</label>
					<input
						type="range"
						id="mapSize"
						min={10}
						max={60}
						bind:value={localSettings.mapSize}
					/>
				</div>
				<div class="field">
					<label for="mapSizeExpanded">Expanded: {localSettings.mapSizeExpanded}vw</label>
					<input
						type="range"
						id="mapSizeExpanded"
						min={20}
						max={90}
						bind:value={localSettings.mapSizeExpanded}
					/>
				</div>
			</fieldset>

			<button class="apply-btn" onclick={handleApply}>Apply</button>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: white;
		border-radius: 12px;
		width: 90%;
		max-width: 400px;
		max-height: 80vh;
		overflow: auto;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		border-bottom: 1px solid #eee;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.75rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
		color: #666;
	}

	.close-btn:hover {
		color: #333;
	}

	.modal-body {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field label {
		font-weight: 500;
		color: #333;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.field select {
		padding: 10px 12px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
		background: white;
	}

	.field select:focus {
		outline: none;
		border-color: #4285f4;
		box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
	}

	.hint {
		font-size: 0.85rem;
		color: #888;
	}

	.mode-group {
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 12px;
		display: flex;
		gap: 8px;
	}

	.mode-group legend {
		font-weight: 500;
		color: #333;
		padding: 0 4px;
	}

	.mode-option {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		border: 1px solid #ddd;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 400;
		transition: border-color 0.15s, background 0.15s;
	}

	.mode-option:hover {
		border-color: #4285f4;
	}

	.mode-option.active {
		border-color: #4285f4;
		background: #e8f0fe;
		color: #1a73e8;
	}

	.mode-option input[type="radio"] {
		display: none;
	}

	.apply-btn {
		margin-top: 8px;
		padding: 12px 24px;
		border: none;
		border-radius: 8px;
		background: #4285f4;
		color: white;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.apply-btn:hover {
		background: #3367d6;
	}
</style>
