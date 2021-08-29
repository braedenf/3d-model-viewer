<script>
	import { Cloudinary } from '@cloudinary/base';
	import { onMount } from 'svelte';

	const cloudinary = new Cloudinary({
		cloud: {
			cloudName: 'dbfqxpc2p'
		}
	});

	const textureVariants = [
		'gloss',
		'crater',
		'antler',
		'bare',
		'quill',
		'panda',
		'kiss',
		'seaShell'
	];

	const modelTypes = ['LowBack', 'MedBack', 'HighBack'];

	let selectedModelType = 0;
	let modelType = modelTypes[selectedModelType];

	let selectedMaterial = 0;
	let modelMaterial = textureVariants[selectedMaterial];

	function updatedSelectedModelType(i) {
		selectedModelType = i;
		modelType = modelTypes[i];
	}

	function updateSelectedMaterial(index) {
		selectedMaterial = index;
		modelMaterial = textureVariants[selectedMaterial];
	}

	$: myModel = cloudinary.image(`Carousel_${modelType}_MaharamMeld-${modelMaterial}`).toURL();

	let isARCompatible;

	onMount(() => {
		const modelViewer = document.querySelector('#model-viewer');

		if (modelViewer.getAttribute('ar-status') == 'not-presenting') {
			isARCompatible = false;
		} else {
			isARCompatible = true;
		}
	});

	// load texture swatches

	let textureURLS = [];

	textureVariants.forEach((textureVariant) => {
		let url = cloudinary.image(`Carousel_Swatches/corousel_${textureVariant}`).toURL();
		textureURLS.push(url);
	});
</script>

<div class="pt-6 h-screen">
	<div class="flex justify-between">
		<h1 class="px-4 text-3xl lg:text-4xl font-bold pb-3">Model Viewer</h1>
		<!-- <button
			on:click={loadTestModel}
			class="px-3 m-2 bg-gray-800 hover:bg-gray-600 text-sm text-white font-bold rounded-full"
			>Load Test model</button
		> -->
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:px-12 h-screen w-full mt-10">
		<div class="relative">
			<model-viewer
				id="model-viewer"
				class="relative h-80 lg:h-3/4 w-full"
				src={myModel}
				alt="A comfy couch"
				ar
				ar-modes="webxr scene-viewer quick-look"
				ar-status
				environment-image="./whiteroom_512_offset-100.hdr"
				auto-rotate
				camera-controls
				shadow-intensity="2"
				exposure="2"
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
		<div class="flex flex-col space-y-12 px-4 lg:px-12 items-center lg:mt-20">
			<div class="lg:order-last lg:mt-20">
				<span class="mb-4">
					<ul class="flex lg:space-x-8 space-x-2 justify-center">
						{#each modelTypes as mt, i}
							<li>
								<button
									class="py-1 lg:text-sm px-3 bg-gray-200 hover:bg-gray-400 rounded-lg text-xs text-gray-800 font-semibold {selectedModelType ==
									i
										? 'border-2 border-gray-700'
										: 'border-none'}"
									on:click={() => updatedSelectedModelType(i)}
									>{mt == modelTypes[0]
										? 'Low Back'
										: mt == modelTypes[1]
										? 'Medium Back'
										: 'High Back'}</button
								>
							</li>
						{/each}
					</ul>
				</span>

				<div class="flex flex-wrap lg:order-last justify-items-start">
					{#each textureURLS as url, i}
						<button
							on:click={() => updateSelectedMaterial(i)}
							class="bg-gray-500 shadow-lg h-12 w-12 transform-gpu hover:translate-y-1 ease-in duration-100 mr-4 mt-4 {selectedMaterial ==
							i
								? 'border-2 border-gray-900'
								: 'border-none'}"
						>
							<img src={url} alt="Texture" />
						</button>
					{/each}
				</div>
			</div>

			<div>
				<h2 class="text-2xl font-bold">Maharam Meld Antler</h2>
				<p>
					Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus magni enim accusamus
					tenetur saepe ducimus, blanditiis alias animi fuga quas vitae consectetur obcaecati
					inventore! Iusto autem nemo eius libero molestias?
				</p>
			</div>
		</div>
	</div>
</div>
