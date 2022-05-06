import { c as create_ssr_component, a as add_attribute, b as each, e as escape } from "../../chunks/index-1259f1f6.js";
import { Cloudinary } from "@cloudinary/url-gen";
var qrcode_svelte_svelte_type_style_lang = "";
async function load({ fetch }) {
  const productData = await (await fetch("/products.json")).json();
  return { props: { productData } };
}
function addSpaceBetweenCapitals(word) {
  return word.replace(/([A-Z])/g, " $1").trim();
}
const Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let iosSrc;
  let loadedModel;
  let loadedPoster;
  let { productData } = $$props;
  let products = productData.products;
  const cloudinary = new Cloudinary({ cloud: { cloudName: "dbfqxpc2p" } });
  let selectedModel = 2;
  let selectedModelType = 0;
  let selectedMaterial = 0;
  let modelMaterial = products[selectedModel].materials[selectedMaterial];
  let modelViewer;
  if ($$props.productData === void 0 && $$bindings.productData && productData !== void 0)
    $$bindings.productData(productData);
  iosSrc = cloudinary.image(`${products[selectedModel].name}/${products[selectedModel].variants[selectedModelType]}/${products[selectedModel].name}_${products[selectedModel].variants[selectedModelType]}_${modelMaterial}`, { fetch_format: "usdz" }).toURL();
  loadedModel = cloudinary.image(`${products[selectedModel].name}/${products[selectedModel].variants[selectedModelType]}/${products[selectedModel].name}_${products[selectedModel].variants[selectedModelType]}_${modelMaterial}`).toURL();
  loadedPoster = cloudinary.image(`${products[selectedModel].name}/${products[selectedModel].variants[selectedModelType]}/${products[selectedModel].name}_${products[selectedModel].variants[selectedModelType]}_${modelMaterial}.png`).toURL();
  return `${``}

<div class="${"grid grid-cols-1 lg:grid-cols-2 gap-4 lg:px-12 w-full lg:mt-24"}"><div class="${"relative"}"><model-viewer class="${"relative h-[30em] lg:h-full w-full bg-ceiling-background"}"${add_attribute("poster", loadedPoster, 0)}${add_attribute("src", loadedModel, 0)}${add_attribute("ios-src", iosSrc, 0)} loading="${"auto"}" alt="${"3D Model Viewer"}" ar ar-modes="${"webxr scene-viewer quick-look"}" ar-status auto-rotate rotation-per-second="${"1deg"}" interaction-prompt="${"none"}" environment-image="${"https://res.cloudinary.com/residentnz/raw/upload/v1643421221/Resident/HDR/christmas_photo_studio_05_1k_topLightDots.hdr"}" bounds="${"tight"}" exposure="${"1"}" camera-controls${add_attribute("camera-orbit", products[selectedModel].type == "floor" ? "-40deg 82deg 12m" : "0 105deg 3m", 0)}${add_attribute("min-camera-orbit", products[selectedModel].type == "floor" ? "auto 5deg auto" : "auto 80deg auto", 0)}${add_attribute("max-camera-orbit", products[selectedModel].type == "floor" ? "auto 94deg auto" : "auto 160deg auto", 0)} interpolation-decay="${"200"}" shadow-intensity="${"1"}"${add_attribute("field-of-view", products[selectedModel].type == "floor" ? "20deg" : "20deg", 0)}${add_attribute("min-field-of-view", products[selectedModel].type == "floor" ? "20deg" : "10deg", 0)}${add_attribute("max-field-of-view", products[selectedModel].type == "floor" ? "20deg" : "10deg", 0)}${add_attribute("this", modelViewer, 0)}><button slot="${"ar-button"}" class="${"w-8 h-8 flex justify-center items-center absolute top-0 right-0 mt-4 mr-4"}"><img src="${"/ARicon.png"}" alt="${"AR icon"}"></button></model-viewer>
		
		${`<button class="${"w-8 h-8 flex justify-center items-center absolute top-0 right-0 mt-4 mr-4"}"><img src="${"/ARicon.png"}" alt="${"AR icon"}"></button>`}

		<div class="${"flex gap-2 absolute bottom-4 right-6 z-10"}"><button class="${"w-6"}"><img src="${"./ZoomIcons/zoomOut.png"}" alt="${"zoom in level"}"></button>
			<button class="${"w-6"}"><img src="${"./ZoomIcons/zoomIn.png"}" alt="${"minus zoom level"}"></button></div></div>

	<div class="${"flex flex-wrap gap-2 lg:order-last mr-4 items-center mb-10 mx-10"}">${each(products, (product, i) => {
    return `<div class="${"flex flex-col space-y-2 content-center text-center"}"><button class="${"bg-gray-200 w-32 h-32"}"><img${add_attribute("src", cloudinary.image(`${product.name}/${product.variants[0]}/${product.name}_${product.variants[0]}_${product.materials[0]}.png`).toURL(), 0)}${add_attribute("alt", product.name, 0)}></button>
				<h6 class="${"text-sm font-semibold"}">${escape(addSpaceBetweenCapitals(product.name))}</h6>
			</div>`;
  })}</div>
	<div class="${"mx-10"}"><div class="${"flex flex-col space-y-10 lg:px-12 lg:items-start"}"><div class="${"lg:order-last w-full"}"><h5 class="${"text-2xl font-headline mb-2 text-primary"}">Type:</h5>
				<div class="${"dropdown rounded-lg"}"><div tabindex="${"0"}" class="${"btn btn-wide btn-ghost shadow-lg"}"><div class="${"flex justify-between w-full items-center"}"><h6>${escape(addSpaceBetweenCapitals(products[selectedModel].variants[selectedModelType]))}</h6>
							<svg xmlns="${"http://www.w3.org/2000/svg"}" class="${"h-8 w-8"}" viewBox="${"0 0 20 20"}" fill="${"currentColor"}"><path fill-rule="${"evenodd"}" d="${"M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"}" clip-rule="${"evenodd"}"></path></svg></div></div>
					<ul tabindex="${"0"}" class="${"p-2 shadow menu dropdown-content bg-base-100 rounded-box w-52"}">${each(products[selectedModel].variants, (modelVariant, i) => {
    return `<li><button class="${"btn btn-ghost"}">${escape(addSpaceBetweenCapitals(modelVariant))}</button>
							</li>`;
  })}</ul></div></div>
			<div class="${"lg:order-last lg:mt-20"}"><h5 class="${"text-2xl font-headline mb-2 text-primary"}">Material:</h5>
				<div class="${"flex flex-wrap gap-4 lg:order-last items-center"}">${each(products[selectedModel].materials, (material, i) => {
    return `<div class="${"flex flex-col justify-center mx-1 gap-1"}"><button class="${"shadow-lg h-14 w-14 mx-auto transform-gpu hover:translate-y-1 ease-in duration-100 mt-4 " + escape(selectedMaterial == i ? "border-4 border-primary" : "border-none")}"><img id="${"material"}"${add_attribute("src", cloudinary.image(`${products[selectedModel].name}/swatches/${products[selectedModel].materials[i]}`).toURL(), 0)}${add_attribute("alt", products[selectedModel].materials[i], 0)}></button>
							<label class="${"text-sm font-paragraph text-center"}" for="${"material"}">${escape(material)}</label>
						</div>`;
  })}</div></div>

			<div class="${"prose font-paragraph"}"><h2>${escape(addSpaceBetweenCapitals(products[selectedModel].name))}</h2>
				<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus magni enim accusamus
					tenetur saepe ducimus, blanditiis alias animi fuga quas vitae consectetur obcaecati
					inventore! Iusto autem nemo eius libero molestias?
				</p>
				<div class="${"py-12"}"></div></div></div></div></div>`;
});
export { Routes as default, load };
