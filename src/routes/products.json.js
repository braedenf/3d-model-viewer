export async function get() {
	return {
		status: 200,
		body: {
			products: [
				{
					type: 'seat',
					name: 'KashmirChair',
					variants: ['Hallingdale65ByKvadrat'],
					materials: ['0190', '0110', '0227', '0180', '0100', '0143']
				},
				{
					type: 'seat',
					name: 'Carousel',
					variants: ['HighBack_MaharamMeld', 'MedBack_MaharamMeld', 'LowBack_MaharamMeld'],
					materials: ['Gloss', 'Crater', 'Antler', 'Bare', 'Quill', 'Panda', 'Kiss', 'SeaShell']
				},
				{
					type: 'light',
					name: 'HexPendant',
					variants: ['500', '750', '1000'],
					materials: ['Aluminium', 'Black', 'Brass', 'White']
				}
				// {
				// 	type: 'seat',
				// 	name: 'Parallel',
				// 	variants: ['Standard'],
				// 	materials: ['Base']
				// }
			]
		}
	};
}
