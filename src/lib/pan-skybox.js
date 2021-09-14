export function panSkybox(modelViewer) {
	let lastX;
	let panning = false;
	let skyboxAngle = 0;
	let radiansPerPixel;

	function startPan() {
		const orbit = modelViewer.getCameraOrbit();
		const { radius } = orbit;
		radiansPerPixel = (-1 * radius) / modelViewer.getBoundingClientRect().height;
		modelViewer.interactionPrompt = 'none';
	}

	function updatePan(thisX) {
		const delta = (thisX - lastX) * radiansPerPixel;
		lastX = thisX;
		skyboxAngle += delta;
		const orbit = modelViewer.getCameraOrbit();
		orbit.theta += delta;
		modelViewer.resetTurntableRotation(skyboxAngle);
		modelViewer.jumpCameraToGoal();
	}

	// Event Listeners

	// Mouse Button Event
	modelViewer.addEventListener(
		'mousedown',
		(event) => {
			panning = event.button === 2 || event.ctrlKey || event.metaKey || event.shiftKey;
			if (!panning) return;

			lastX = event.clientX;
			startPan();
			event.stopPropagation();
		},
		true
	);

	// Touch Event
	modelViewer.addEventListener(
		'touchstart',
		(event) => {
			const { targetTouches, touches } = event;
			panning = targetTouches.length === 2 && targetTouches.length === touches.length;
			if (!panning) return;

			lastX = 0.5 * (targetTouches[0].clientX + targetTouches[1].clientX);
			startPan();
		},
		true
	);

	// Mouse Move
	self.addEventListener(
		'mousemove',
		(event) => {
			if (!panning) return;

			updatePan(event.clientX);
			event.stopPropagation();
		},
		true
	);

	// Touch Move
	modelViewer.addEventListener(
		'touchmove',
		(event) => {
			if (!panning || event.targetTouches.length !== 2) return;

			const { targetTouches } = event;
			const thisX = 0.5 * (targetTouches[0].clientX + targetTouches[1].clientX);
			updatePan(thisX);
		},
		true
	);

	// Mouse Up
	self.addEventListener(
		'mouseup',
		(event) => {
			panning = false;
		},
		true
	);

	//Touch End
	modelViewer.addEventListener(
		'touchend',
		(event) => {
			panning = false;
		},
		true
	);
}
