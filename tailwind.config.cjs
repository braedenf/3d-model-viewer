const config = {
	mode: 'jit',
	purge: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		fontFamily: {
			headline: ['Sora', 'Helvetica', 'sans-serif'],
			paragraph: ['Nunito Sans', 'Helvetica', 'sans-serif']
		},
		extend: {}
	},
	plugins: [require('daisyui'), require('@tailwindcss/typography')]
};

module.exports = config;
