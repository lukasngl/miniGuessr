<script lang="ts">
interface Option {
	value: string;
	label: string;
}

interface Props {
	options: Option[];
	value: string;
	placeholder?: string;
	id?: string;
	onchange: (value: string) => void;
}

const { options, value, placeholder = "Search...", id, onchange }: Props = $props();

let search = $state("");
let open = $state(false);
let highlightedIndex = $state(0);
let inputEl: HTMLInputElement;
let dropdownStyle = $state("");

const MAX_VISIBLE = 10;

const filtered = $derived.by(() => {
	const list = search
		? options.filter((o) =>
				o.label.toLowerCase().includes(search.toLowerCase()),
			)
		: options;
	return list.slice(0, MAX_VISIBLE);
});

const selectedLabel = $derived(
	options.find((o) => o.value === value)?.label ?? "",
);

function handleSelect(opt: Option) {
	onchange(opt.value);
	search = "";
	open = false;
}

function handleKeydown(e: KeyboardEvent) {
	if (!open) {
		if (e.key === "ArrowDown" || e.key === "Enter") {
			open = true;
			e.preventDefault();
		}
		return;
	}

	switch (e.key) {
		case "ArrowDown":
			highlightedIndex = Math.min(highlightedIndex + 1, filtered.length - 1);
			e.preventDefault();
			break;
		case "ArrowUp":
			highlightedIndex = Math.max(highlightedIndex - 1, 0);
			e.preventDefault();
			break;
		case "Enter":
			if (filtered[highlightedIndex]) {
				handleSelect(filtered[highlightedIndex]);
			}
			e.preventDefault();
			break;
		case "Escape":
			open = false;
			search = "";
			break;
	}
}

function updateDropdownPosition() {
	if (!inputEl) return;
	const rect = inputEl.getBoundingClientRect();
	dropdownStyle = `top: ${rect.bottom + 4}px; left: ${rect.left}px; width: ${rect.width}px;`;
}

function handleFocus() {
	updateDropdownPosition();
	open = true;
	highlightedIndex = 0;
}

function handleBlur(e: FocusEvent) {
	// Delay to allow click on option
	setTimeout(() => {
		open = false;
		search = "";
	}, 150);
}

$effect(() => {
	// Reset highlight when filtered list changes
	highlightedIndex = 0;
});
</script>

<div class="searchable-select">
	<input
		bind:this={inputEl}
		type="text"
		{id}
		{placeholder}
		value={open ? search : selectedLabel}
		oninput={(e) => (search = e.currentTarget.value)}
		onfocus={handleFocus}
		onblur={handleBlur}
		onkeydown={handleKeydown}
	/>
	<span class="arrow">{open ? "▲" : "▼"}</span>

	{#if open}
		<ul class="dropdown" style={dropdownStyle}>
			{#each filtered as opt, i (opt.value)}
				<li>
					<button
						type="button"
						class:highlighted={i === highlightedIndex}
						class:selected={opt.value === value}
						onmousedown={() => handleSelect(opt)}
						onmouseenter={() => (highlightedIndex = i)}
					>
						{opt.label}
					</button>
				</li>
			{/each}
			{#if filtered.length === 0}
				<li class="no-results">No results</li>
			{/if}
		</ul>
	{/if}
</div>

<style>
	.searchable-select {
		position: relative;
		width: 100%;
	}

	input {
		width: 100%;
		padding: 10px 32px 10px 12px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
		background: white;
	}

	input:focus {
		outline: none;
		border-color: #4285f4;
		box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
	}

	.arrow {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.7rem;
		color: #666;
		pointer-events: none;
	}

	.dropdown {
		position: fixed;
		max-height: 200px;
		overflow-y: auto;
		background: white;
		border: 1px solid #ddd;
		border-radius: 6px;
		padding: 4px 0;
		list-style: none;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 1001;
	}

	.dropdown button {
		width: 100%;
		padding: 8px 12px;
		border: none;
		background: none;
		text-align: left;
		font-size: 0.95rem;
		cursor: pointer;
	}

	.dropdown button:hover,
	.dropdown button.highlighted {
		background: #f0f0f0;
	}

	.dropdown button.selected {
		background: #e8f0fe;
		color: #1a73e8;
	}

	.no-results {
		padding: 8px 12px;
		color: #888;
		font-style: italic;
	}
</style>
