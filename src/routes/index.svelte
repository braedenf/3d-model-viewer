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
	import { onMount } from 'svelte';
	import { panSkybox } from '$lib/pan-skybox';

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
	}

	let modelViewer; // Model viewer gets bound to model-viewer web component

	let isARCompatible; // Gets the ar-status and presents alt button if not available

	/* 
		Wait for modelViewer to be mounted
	*/

	onMount(() => {
		if (modelViewer.getAttribute('ar-status') == 'not-presenting') {
			isARCompatible = false;
		} else {
			isARCompatible = true;
		}

		// For some reason I need to crank the exposure here???
		modelViewer.exposure = 1.8;
	});

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
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:px-12 h-screen w-full mt-10">
	<div class="relative">
		<model-viewer
			bind:this={modelViewer}
			use:panSkybox
			class="relative h-[500px] lg:h-3/4 w-full bg-gray-200"
			poster={loadedPoster}
			src={loadedModel}
			loading="auto"
			alt="A comfy couch"
			ar
			ar-modes="webxr scene-viewer quick-look"
			ar-status
			environment-image="./whiteroom2Windows_512.hdr"
			exposure="1"
			auto-rotate
			camera-controls
			yaw="20deg"
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
	<div class="flex flex-wrap space-x-2 lg:order-last mr-4 items-center mb-10 mx-10">
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
				<h6 class="text-sm font-semibold">{product.name.replace(/([A-Z])/g, ' $1').trim()}</h6>
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
								{products[selectedModel].variants[selectedModelType]
									.replace(/([A-Z])/g, ' $1')
									.trim()}
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
									>{modelVariant.replace(/([A-Z])/g, ' $1').trim()}</button
								>
							</li>
						{/each}
					</ul>
				</div>
			</div>
			<div class="lg:order-last lg:mt-20">
				<h5 class="text-2xl font-headline mb-2 text-primary">Material:</h5>
				<div class="flex flex-wrap lg:order-last mr-4 items-center">
					{#each products[selectedModel].materials as _, i}
						<button
							on:click={() => updateSelectedMaterial(i)}
							class="mx-2 shadow-lg h-14 w-14 transform-gpu hover:translate-y-1 ease-in duration-100 mt-4 {selectedMaterial ==
							i
								? 'border-4 border-primary'
								: 'border-none'}"
						>
							<img
								src={cloudinary
									.image(
										`${products[selectedModel].name}/swatches/${products[selectedModel].materials[i]}`
									)
									.toURL()}
								alt={products[selectedModel].materials[i]}
							/>
						</button>
					{/each}
				</div>
			</div>

			<div class="prose font-paragraph sm:mx-4 lg:mx-2">
				<h2>{products[selectedModel].name.replace(/([A-Z])/g, ' $1').trim()}</h2>
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
