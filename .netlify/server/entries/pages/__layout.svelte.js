import { c as create_ssr_component } from "../../chunks/index-13c0de55.js";
var app = "";
const _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<div class="${"flex justify-between shadow-lg"}"><h1 class="${"pt-6 px-4 text-3xl lg:text-4xl font-headline text-primary pb-3 mx-2"}">Model Viewer</h1></div>

${slots.default ? slots.default({}) : ``}`;
});
export { _layout as default };
