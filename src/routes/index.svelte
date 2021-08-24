<script>
	import { onMount } from 'svelte';
	import {
		Color,
		DirectionalLight,
		HemisphereLight,
		Mesh,
		MeshPhongMaterial,
		PerspectiveCamera,
		PlaneGeometry,
		Scene,
		WebGLRenderer
	} from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

	const renderer = new WebGLRenderer({ antialias: true });
	const windowId = 'threeWindow';

	const modelURL = './models/carousel/Carousel_LowBack_MaharamMeldAntler.glb';

	//Once dom elements are mounted draw renderwindow to dom element
	onMount(() => {
		//Window
		const threeWindow = document.getElementById(windowId);
		threeWindow.appendChild(renderer.domElement);
		renderer.setSize(threeWindow.clientWidth, threeWindow.clientHeight);

		//Camera
		const camera = new PerspectiveCamera(
			45, // fov
			threeWindow.clientWidth / threeWindow.clientHeight, // aspect
			1, // near
			500 // far
		);
		//camera.position.set(0, 0, 2); // Center but back a bit from object

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
		controls.minDistance = 20;
		controls.maxDistance = 100;
		controls.maxPolarAngle = Math.PI / 2;
		controls.enablePan = false;

		//Scene
		const scene = new Scene();
		scene.background = new Color(0xa0a0a0);

		// Lights

		//HemiLight
		const hemiLight = new HemisphereLight(0xffffff, 0x444444);
		hemiLight.position.set(0, 20, 0);
		scene.add(hemiLight);

		//Directional Light
		const dirLight = new DirectionalLight(0xffffff);
		dirLight.position.set(-8, 10, -10);
		dirLight.castShadow = true;
		dirLight.shadow.camera.top = 2;
		dirLight.shadow.camera.bottom = -2;
		dirLight.shadow.camera.left = -2;
		dirLight.shadow.camera.right = 2;
		dirLight.shadow.camera.near = 0.1;
		dirLight.shadow.camera.far = 80;
		scene.add(dirLight);

		//Ground
		const mesh = new Mesh(
			new PlaneGeometry(50, 50),
			new MeshPhongMaterial({ color: 0x999999, depthWrite: false })
		);
		mesh.rotation.x = -Math.PI / 2;
		mesh.receiveShadow = true;
		scene.add(mesh);

		// Load 3D model
		let loader = new GLTFLoader();
		loader.load(modelURL, function (gltf) {
			let model = gltf.scene;
			model.scale.set(10.0, 10.0, 10.0);

			model.traverse(function (object) {
				if (object.isMesh) object.castShadow = true;
			});
			scene.add(model);

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

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 px-12 h-1/2">
		<div class="relative" id={windowId}>
			<a
				href="intent://arvr.google.com/scene-viewer/1.0?file={modelURL}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end;"
				class="w-10 h-6 rounded bg-gray-800 text-white hover:bg-gray-600 shadow font-bold absolute top-0 right-0 m-3 text- text-center"
				>AR</a
			>
		</div>
		<div class="flex flex-col space-y-2">
			<h2 class="text-2xl font-bold">Object Name</h2>
			<p>Description of object</p>
		</div>
	</div>
</div>
