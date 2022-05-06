import { init } from '../serverless.js';

export const handler = init({
	appDir: "_app",
	assets: new Set(["ARicon.png","ZoomIcons/zoomIn.png","ZoomIcons/zoomOut.png","favicon.png","model-viewer/dist","whiteroom2Windows_512.hdr"]),
	mimeTypes: {".png":"image/png"},
	_: {
		entry: {"file":"start-ea14d056.js","js":["start-ea14d056.js","chunks/index-c7c60a19.js"],"css":[]},
		nodes: [
			() => import('../server/nodes/0.js'),
			() => import('../server/nodes/1.js'),
			() => import('../server/nodes/2.js')
		],
		routes: [
			{
				type: 'page',
				id: "",
				pattern: /^\/$/,
				names: [],
				types: [],
				path: "/",
				shadow: null,
				a: [0,2],
				b: [1]
			},
			{
				type: 'endpoint',
				id: "products.json",
				pattern: /^\/products\.json$/,
				names: [],
				types: [],
				load: () => import('../server/entries/endpoints/products.json.js')
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
});
