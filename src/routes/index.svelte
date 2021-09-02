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

	const modelTypes = ['Low Back', 'Med Back', 'High Back'];

	let selectedModelType = 0;
	let modelType = modelTypes[selectedModelType].replace(/\s+/g, '');

	let selectedMaterial = 0;
	let modelMaterial = textureVariants[selectedMaterial];

	function updatedSelectedModelType(i) {
		selectedModelType = i;
		modelType = modelTypes[i].replace(/\s+/g, '');
	}

	function updateSelectedMaterial(index) {
		selectedMaterial = index;
		modelMaterial = textureVariants[selectedMaterial];
	}

	let modelViewer;

	$: myModel = cloudinary.image(`Carousel_${modelType}_MaharamMeld-${modelMaterial}`).toURL();

	let isARCompatible;

	onMount(() => {
		modelViewer = document.querySelector('#model-viewer');

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

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:px-12 h-screen w-full mt-10">
	<div class="relative">
		<model-viewer
			id="model-viewer"
			class="relative h-[500px] lg:h-3/4 w-full"
			src={myModel}
			loading="eager"
			alt="A comfy couch"
			ar
			ar-modes="webxr scene-viewer quick-look"
			ar-status
			environment-image="./whiteroom2Windows_512.hdr"
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
	<div class="mx-10">
		<div class="flex flex-col space-y-10 lg:px-12 lg:mt-20 items-center lg:items-start">
			<div class="lg:order-last w-full">
				<h5 class="text-2xl font-headline mb-2 text-primary">Fabric:</h5>
				<div class="dropdown rounded-lg">
					<div tabindex="0" class="btn btn-wide btn-ghost shadow-lg">
						<div class="flex justify-between w-full items-center">
							<h6>
								{modelTypes[selectedModelType]}
							</h6>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-8 w-8"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
					</div>
					<ul tabindex="0" class="p-2 shadow menu dropdown-content bg-base-100 rounded-box w-52">
						{#each modelTypes as mt, i}
							<li>
								<button class="btn btn-ghost" on:click={() => updatedSelectedModelType(i)}
									>{modelTypes[i]}</button
								>
							</li>
						{/each}
					</ul>
				</div>
			</div>
			<div class="lg:order-last lg:mt-20">
				<div class="flex flex-wrap lg:order-last mr-4 items-center">
					{#each textureURLS as url, i}
						<button
							on:click={() => updateSelectedMaterial(i)}
							class="mx-2 shadow-lg h-14 w-14 transform-gpu hover:translate-y-1 ease-in duration-100 mt-4 {selectedMaterial ==
							i
								? 'border-4 border-primary-focus'
								: 'border-none'}"
						>
							<img src={url} alt="Texture" />
						</button>
					{/each}
				</div>
			</div>

			<div class="prose font-paragraph sm:mx-4 lg:mx-2">
				<h2>Maharam Meld Antler</h2>
				<p>
					Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus magni enim accusamus
					tenetur saepe ducimus, blanditiis alias animi fuga quas vitae consectetur obcaecati
					inventore! Iusto autem nemo eius libero molestias?
				</p>
				<div class="py-12" />
			</div>
		</div>
	</div>
</div>
