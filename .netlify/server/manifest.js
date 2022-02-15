export const manifest = {
	appDir: "_app",
	assets: new Set(["favicon.png","model-viewer/model-viewer.min.js","model-viewer/model-viewer.min.js.map","whiteroom2Windows_512.hdr"]),
	_: {
		mime: {".png":"image/png",".js":"application/javascript",".map":"application/json"},
		entry: {"file":"start-6685b134.js","js":["start-6685b134.js","chunks/vendor-036923b7.js"],"css":[]},
		nodes: [
			() => import('./nodes/0.js'),
			() => import('./nodes/1.js'),
			() => import('./nodes/2.js')
		],
		routes: [
			{
				type: 'page',
				pattern: /^\/$/,
				params: null,
				path: "/",
				shadow: null,
				a: [0,2],
				b: [1]
			},
			{
				type: 'endpoint',
				pattern: /^\/products\.json$/,
				params: null,
				load: () => import('./entries/endpoints/products.json.js')
			}
		]
	}
};
