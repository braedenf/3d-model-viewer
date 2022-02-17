<script context="module">
	export async function load({ fetch }) {
		const productData = await (await fetch('/products.json')).json();

		return {
			props: {
				productData
			}
		};
	}
</script>

<script>
	import { Cloudinary } from '@cloudinary/url-gen';
	import { panSkybox } from '$lib/pan-skybox';
	import QrCode from '$lib/qrcode.svelte';
	import Modal from '$lib/modal.svelte';

	/* 
		Product Data is loaded from a local endpoint in json format
	*/
	export let productData;
	let products = productData.products;

	const cloudinary = new Cloudinary({
		cloud: {
			cloudName: 'dbfqxpc2p'
		}
	});

	/* 
		Selected model and selected model type for loading in from cloudinary dynamically
	*/
	let selectedModel = 0; // This is the product that gets loaded from cloudinary
	let selectedModelType = 0; // This is the product variant
	let selectedMaterial = 0; // This is the material
	let modelMaterial = products[selectedModel].materials[selectedMaterial];

	function updatedSelectedModelType(i) {
		selectedModelType = i;
	}

	function updateSelectedMaterial(i) {
		selectedMaterial = i;
		modelMaterial = products[selectedModel].materials[selectedMaterial];
	}

	function changeProduct(i) {
		selectedModel = i;
		selectedModelType = 0;
		selectedMaterial = 0;
		modelMaterial = products[selectedModel].materials[selectedMaterial];

		// changeCameraOrbit();
	}

	// Adds spaces between capital letters
	function addSpaceBetweenCapitals(word) {
		return word.replace(/([A-Z])/g, ' $1').trim();
	}

	let modelViewer; // Model viewer gets bound to model-viewer web component
	let cameraOrbit;

	/* 
		Wait for modelViewer to be mounted
	*/
	let isARAvailable;
	let qrModalOpen = false;

	/* 
		Update the model to load reactivly when any of the customisation options change
	*/

	$: loadedModel = cloudinary
		.image(
			`${products[selectedModel].name}/${products[selectedModel].variants[selectedModelType]}/${products[selectedModel].name}_${products[selectedModel].variants[selectedModelType]}_${modelMaterial}`
		)
		.toURL();

	$: loadedPoster = cloudinary
		.image(
			`${products[selectedModel].name}/${products[selectedModel].variants[selectedModelType]}/${products[selectedModel].name}_${products[selectedModel].variants[selectedModelType]}_${modelMaterial}.png`
		)
		.toURL();

	function setupModelViewer() {
		// For some reason I need to crank the exposure here???
		modelViewer.exposure = 0.5;

		// Gets the ar-status and presents alt button if not available
		if (modelViewer) {
			if (modelViewer.getAttribute('ar-status') == 'not-presenting') {
				isARAvailable = false;
			} else {
				isARAvailable = true;
			}
		}

		console.log(modelViewer.getAttribute('ar-status'));
	}
</script>

{#if qrModalOpen}
	<Modal>
		<h3 class="text-2xl text-center pt-3 font-headline">Scan to view in AR</h3>
		<div class="w-full flex justify-center p-6">
			<div class="h-60 w-60">
				<QrCode text="https://determined-mirzakhani-828e94.netlify.app/" />
			</div>
		</div>
		<div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
			<button
				on:click={() => (qrModalOpen = false)}
				type="button"
				class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
			>
				Exit
			</button>
		</div>
	</Modal>
{/if}

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:px-12 w-full lg:mt-24">
	<div class="relative">
		<model-viewer
			on:load={setupModelViewer}
			bind:this={modelViewer}
			use:panSkybox
			class="relative h-[30em] lg:h-full w-full bg-gray-200"
			poster={loadedPoster}
			src={loadedModel}
			loading="auto"
			alt="3D Model Viewer"
			ar
			ar-modes="webxr scene-viewer quick-look"
			ar-status
			environment-image="https://res.cloudinary.com/residentnz/raw/upload/v1643421221/Resident/HDR/christmas_photo_studio_05_1k_topLightDots.hdr"
			bounds="tight"
			exposure="1"
			camera-controls
			camera-orbit={products[selectedModel].type == 'seat' ? '0 60deg 7m' : '0 120deg 3m'}
			min-camera-orbit={products[selectedModel].type == 'seat'
				? // Seat
				  'auto 40deg auto'
				: // Light
				  'auto 80deg auto'}
			max-camera-orbit={products[selectedModel].type == 'seat'
				? // Seat
				  'auto 80deg auto'
				: // Light
				  'auto 120deg auto'}
			camera-target={products[selectedModel].type == 'seat' ? '' : 'auto 1.65m auto'}
			interpolation-decay="200"
			shadow-intensity="1"
			interaction-prompt="none"
			field-of-view="20deg"
			min-field-of-view="20deg"
			max-field-of-view="20deg"
		>
			<button
				slot="ar-button"
				on:click={() => (qrModalOpen = true)}
				class="w-8 h-8 flex justify-center items-center absolute top-0 right-0 mr-4 mt-4"
			>
				<img src="/ARicon.png" alt="AR icon" />
			</button>
		</model-viewer>
		<!-- Only show QR code AR button if not on a ar compatible device -->
		{#if !isARAvailable}
			<button
				on:click={() => (qrModalOpen = true)}
				class="w-8 h-8 flex justify-center items-center absolute top-0 right-0 mr-4 mt-4"
			>
				<img src="/ARicon.png" alt="AR icon" />
			</button>
		{/if}
	</div>

	<div class="flex flex-wrap gap-2 lg:order-last mr-4 items-center mb-10 mx-10">
		{#each products as product, i}
			<div class="flex flex-col space-y-2 content-center text-center">
				<button on:click={() => changeProduct(i)} class=" bg-gray-200 w-32 h-32">
					<img
						src={cloudinary
							.image(
								`${product.name}/${product.variants[0]}/${product.name}_${product.variants[0]}_${product.materials[0]}.png`
							)
							.toURL()}
						alt={product.name}
					/>
				</button>
				<h6 class="text-sm font-semibold">{addSpaceBetweenCapitals(product.name)}</h6>
			</div>
		{/each}
	</div>
	<div class="mx-10">
		<div class="flex flex-col space-y-10 lg:px-12 lg:items-start">
			<div class="lg:order-last w-full">
				<h5 class="text-2xl font-headline mb-2 text-primary">Type:</h5>
				<div class="dropdown rounded-lg">
					<div tabindex="0" class="btn btn-wide btn-ghost shadow-lg">
						<div class="flex justify-between w-full items-center">
							<h6>
								{addSpaceBetweenCapitals(products[selectedModel].variants[selectedModelType])}
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
						{#each products[selectedModel].variants as modelVariant, i}
							<li>
								<button class="btn btn-ghost" on:click={() => updatedSelectedModelType(i)}
									>{addSpaceBetweenCapitals(modelVariant)}</button
								>
							</li>
						{/each}
					</ul>
				</div>
			</div>
			<div class="lg:order-last lg:mt-20">
				<h5 class="text-2xl font-headline mb-2 text-primary">Material:</h5>
				<div class="flex flex-wrap gap-4 lg:order-last items-center">
					{#each products[selectedModel].materials as material, i}
						<div class="flex flex-col justify-center mx-1 gap-1">
							<button
								on:click={() => updateSelectedMaterial(i)}
								class="shadow-lg h-14 w-14 mx-auto transform-gpu hover:translate-y-1 ease-in duration-100 mt-4 {selectedMaterial ==
								i
									? 'border-4 border-primary'
									: 'border-none'}"
							>
								<img
									id="material"
									src={cloudinary
										.image(
											`${products[selectedModel].name}/swatches/${products[selectedModel].materials[i]}`
										)
										.toURL()}
									alt={products[selectedModel].materials[i]}
								/>
							</button>
							<label class="text-sm font-paragraph text-center" for="material">{material}</label>
						</div>
					{/each}
				</div>
			</div>

			<div class="prose font-paragraph">
				<h2>{addSpaceBetweenCapitals(products[selectedModel].name)}</h2>
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
