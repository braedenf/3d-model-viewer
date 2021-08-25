<script>
	import { Cloudinary } from '@cloudinary/base';

	const cloudinary = new Cloudinary({
		cloud: {
			cloudName: 'dbfqxpc2p'
		}
	});

	let modelType = 'LowBack';

	$: myModel = cloudinary.image(`Carousel_${modelType}_Default`).toURL();
</script>

<div class="pt-20 h-screen">
	<h1 class="px-12 text-4xl font-bold pb-6">Model Viewer</h1>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 px-12 lg:h-3/4 h-full">
		<model-viewer
			class="relative h-full w-full"
			src={myModel}
			alt="A comfy couch"
			ar
			ar-modes="webxr scene-viewer quick-look"
			environment-image="neutral"
			auto-rotate
			camera-controls
			shadow-intensity="1"
		/>

		<div class="flex flex-col space-y-2">
			<span class="mb-4 lg:order-last lg:mt-20">
				<ul class="flex space-x-6 justify-center">
					<li>
						<button
							class="py-2 px-6 bg-gray-200 hover:bg-gray-400 rounded-lg text-gray-800 font-semibold"
							on:click={() => (modelType = 'LowBack')}>Low Back</button
						>
					</li>
					<li>
						<button
							class="py-2 px-6 bg-gray-200 hover:bg-gray-400 rounded-lg text-gray-800 font-semibold"
							on:click={() => (modelType = 'MedBack')}>Medium Back</button
						>
					</li>
					<li>
						<button
							class="py-2 px-6 bg-gray-200 hover:bg-gray-400 rounded-lg text-gray-800 font-semibold"
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
