# 3D Model Viewer
This is a simple implementation of a 3D Model viewer with orbit controls using [three.js](https://threejs.org/) and [SvelteKit](https://kit.svelte.dev/).


## Developing

Using the command line `cd` into project once you have cloned the repo and then run `npm install` (or `pnpm install` or `yarn`), to start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To build the app run:
```bash
npm run build
```
> You can preview the built app with `npm run preview`, regardless of whether you installed an adapter. This should _not_ be used to serve your app in production.

Note: this repo on the `main` branch is connected to [Netlify](https://www.netlify.com/), so any changes commited to the `main` branch will be automatically deployed [here](https://determined-mirzakhani-828e94.netlify.app/).
