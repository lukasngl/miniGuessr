<script lang="ts">
import type { Location } from "$lib/types";
import { formatDistance, haversineDistance } from "$lib/util/distance";

interface Props {
	location: Location;
	guess: Location;
}

const { location, guess }: Props = $props();

const distance = $derived(haversineDistance(location, guess));
const formattedDistance = $derived(formatDistance(distance));
</script>

<div class="result-card">
	<div class="distance">{formattedDistance}</div>
</div>

<style>
	.result-card {
		background: rgba(0, 0, 0, 0.85);
		color: white;
		padding: 16px 24px;
		border-radius: 12px;
		text-align: center;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
	}

	.distance {
		font-size: 2rem;
		font-weight: bold;
	}
</style>
