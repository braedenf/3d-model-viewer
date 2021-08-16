import preprocess from 'svelte-preprocess';
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',

		vite: {
			ssr: {
				noExternal: ['three']
			},

			server: {
				proxy: {
					'/api': 'http://localhost:3000/'
				}
			}
		},

		ssr: false
	},

	preprocess: [
		preprocess({
			postcss: true
		})
	]
};

export default config;
