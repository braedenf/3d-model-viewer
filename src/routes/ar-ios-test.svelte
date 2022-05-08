<script>
  import { panSkybox } from '$lib/pan-skybox';
</script>

<div class="container px-2 max-w-5xl mx-auto mt-20">
  <h1 class="py-3 text-2xl font-bold font-headline">AR IOS src test</h1>
	<div class="flex justify-center">
		<model-viewer
			use:panSkybox
			class="relative h-[30em] lg:h-[50vh] w-full bg-ceiling-background border-2"
			src="https://res.cloudinary.com/residentnz/image/upload/v1644634501/Resident/CarouselHighBackSofa/CarouselHighBackSofa_SynergyByCamira_Serendipity.glb"
			ios-src="https://res.cloudinary.com/residentnz/image/upload/f_usdz/v1644634501/Resident/CarouselHighBackSofa/CarouselHighBackSofa_SynergyByCamira_Serendipity.usdz"
			loading="auto"
			alt="3D Model Viewer"
			ar
			ar-modes="webxr scene-viewer"
			ar-status
			scale="fixed"
			auto-rotate
			rotation-per-second="1deg"
			interaction-prompt="none"
			environment-image="https://res.cloudinary.com/residentnz/raw/upload/v1643421221/Resident/HDR/christmas_photo_studio_05_1k_topLightDots.hdr"
			bounds="tight"
			exposure="1"
			camera-controls
			camera-orbit='-40deg 82deg 12m'
			min-camera-orbit='auto 5deg auto'
			max-camera-orbit='auto 94deg auto'
			interpolation-decay="200"
			shadow-intensity="1"
			field-of-view='20deg'
			min-field-of-view='20deg'
			max-field-of-view='20deg'
		>
			<button
				slot="ar-button"
				class="w-8 h-8 flex justify-center items-center absolute top-0 right-0 mt-4 mr-4"
			>
				<img src="/ARicon.png" alt="AR icon" />
			</button>
		</model-viewer>
	</div>
</div>