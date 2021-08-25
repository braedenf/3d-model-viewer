<script>
	import { Cloudinary } from '@cloudinary/base';
	import { onMount } from 'svelte';

	const cloudinary = new Cloudinary({
		cloud: {
			cloudName: 'dbfqxpc2p'
		}
	});

	let modelType = 'LowBack';

	$: myModel = cloudinary.image(`Carousel_${modelType}_Default`).toURL();

	let isARCompatible;

	onMount(() => {
		const modelViewer = document.querySelector('#model-viewer');

		if (modelViewer.getAttribute('ar-status') == 'not-presenting') {
			isARCompatible = false;
		} else {
			isARCompatible = true;
		}
	});
</script>

<div class="pt-6 h-screen">
	<h1 class="px-4 text-3xl lg:text-4xl font-bold pb-3">Model Viewer</h1>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:px-12 lg:h-3/4 h-full w-full">
		<div class="relative">
			<model-viewer
				id="model-viewer"
				class="relative h-full w-full"
				src={myModel}
				alt="A comfy couch"
				ar
				ar-modes="webxr scene-viewer quick-look"
				ar-status
				environment-image="neutral"
				auto-rotate
				camera-controls
				shadow-intensity="2"
			/>
			<!-- Only show QR code AR button if not on a ar compatible device -->
			{#if !isARCompatible}
				<button
					on:click={() => alert('TODO: Add QR Code for AR')}
					class="rounded-full bg-gray-800 hover:bg-gray-600 w-8 h-8 flex justify-center items-center absolute top-0 right-0 mr-4 mt-4 shadow"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-gray-300"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
						/>
					</svg>
				</button>
			{/if}
		</div>
		<div class="flex flex-col space-y-2 px-4 lg:px-12">
			<span class="mb-4 lg:order-last lg:mt-20">
				<ul class="flex space-x-2 justify-center">
					<li>
						<button
							class="py-1 lg:text-sm px-6 bg-gray-200 hover:bg-gray-400 rounded-lg text-xs text-gray-800 font-semibold"
							on:click={() => (modelType = 'LowBack')}>Low Back</button
						>
					</li>
					<li>
						<button
							class="py-1 lg:text-sm px-6 bg-gray-200 hover:bg-gray-400 rounded-lg text-xs text-gray-800 font-semibold"
							on:click={() => (modelType = 'MedBack')}>Medium Back</button
						>
					</li>
					<li>
						<button
							class="py-1 lg:text-sm px-6 bg-gray-200 hover:bg-gray-400 rounded-lg text-xs text-gray-800 font-semibold"
							on:click={() => (modelType = 'HighBack')}>High Back</button
						>
					</li>
				</ul>
			</span>

			<h2 class="text-2xl font-bold">Maharam Meld Antler</h2>
			<p>
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus magni enim accusamus tenetur
				saepe ducimus, blanditiis alias animi fuga quas vitae consectetur obcaecati inventore! Iusto
				autem nemo eius libero molestias?
			</p>
		</div>
	</div>
</div>
