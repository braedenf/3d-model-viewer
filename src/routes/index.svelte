<script>
	import { onMount } from 'svelte';
	import { AmbientLight, Camera, Color, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

	const renderer = new WebGLRenderer({ antialias: true });
	const windowId = 'threeWindow';

	//Once dom elements are mounted draw renderwindow to dom element
	onMount(() => {
		//Window
		const threeWindow = document.getElementById(windowId);
		threeWindow.appendChild(renderer.domElement);
		renderer.setSize(threeWindow.clientWidth, threeWindow.clientHeight);

		//Camera
		const camera = new PerspectiveCamera(
			45,
			threeWindow.clientWidth / threeWindow.clientHeight,
			1,
			500
		);
		camera.position.set(0, 0, 10); //Center but back a bit from object

		//Window Resize
		window.addEventListener('resize', onWindowResize);

		function onWindowResize() {
			camera.aspect = threeWindow.clientWidth / threeWindow.clientHeight;
			camera.updateProjectionMatrix();

			renderer.setSize(threeWindow.clientWidth, threeWindow.clientHeight);
		}
		//Controls
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
		controls.dampingFactor = 0.05;
		controls.screenSpacePanning = false;
		controls.minDistance = 50;
		controls.maxDistance = 300;
		controls.maxPolarAngle = Math.PI / 2;
		controls.target.set(0, 0, -50);
		controls.enablePan = false;

		//Scene
		const scene = new Scene();
		scene.background = new Color(0xdddddd);

		// Lights
		const hlight = new AmbientLight(0x404040, 100);
		scene.add(hlight);

		// Load 3D model
		let loader = new GLTFLoader();
		loader.load('./models/rustic_chair/scene.gltf', function (gltf) {
			let chair = gltf.scene.children[0];
			chair.scale.set(50, 50, 50);
			scene.add(gltf.scene);

			function animate() {
				requestAnimationFrame(animate);
				controls.update();
				renderer.render(scene, camera);
			}
			animate();
		});
	});
</script>

<div class="pt-20 h-screen">
	<h1 class="px-12 text-4xl font-bold pb-6">Model Viewer</h1>

	<div class="grid grid-cols-2 gap-4 px-12 h-1/2">
		<div id={windowId} />
		<div class="flex flex-col space-y-2">
			<h2 class="text-2xl font-bold">Object Name</h2>
			<p>Description of object</p>
		</div>
	</div>
</div>
