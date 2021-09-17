<script>
	import { onMount } from 'svelte';

	export let text;
	let node;

	onMount(() => {
		const options = {
			text: text,
			// ... your other options
			width: 100,
			height: 100,
			quietZone: 10
		};
		new QRCode(node, options);
	});
</script>

<div bind:this={node} />

<style>
	div {
		/* make QR-wrapper squared */
		width: 100%;
		position: relative;
		padding: 50%;
		z-index: 1;
	}
	div :global(canvas) {
		/* fit QR to wrapper */
		width: 100%;
		height: 100%;
		position: absolute;
		left: 0;
		top: 0;
	}
</style>
