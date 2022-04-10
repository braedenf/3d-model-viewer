export async function get() {
	return {
		status: 200,
		body: {
			products: [
				{
					type: 'floor',
					name: 'KashmirChair',
					variants: ['Hallingdale65ByKvadrat'],
					materials: ['0190', '0110', '0227', '0180', '0100', '0143']
				},
				{
					type: 'floor',
					name: 'Carousel',
					variants: ['HighBack_MaharamMeld', 'MedBack_MaharamMeld', 'LowBack_MaharamMeld'],
					materials: ['Gloss', 'Crater', 'Antler', 'Bare', 'Quill', 'Panda', 'Kiss', 'SeaShell']
				},
				{
					type: 'ceiling',
					name: 'HexPendant',
					variants: ['500', '750', '1000'],
					materials: ['BrushedAluminium', 'Black', 'BrushedBrass', 'White']
				},
				{
					type: 'ceiling',
					name: 'ParisonPendant',
					variants: ['standard'],
					materials: ['White', 'Black']
				},
				{
					type: 'floor',
					name: 'Circus',
					variants: ['FloorLight'],
					materials: ['BrushedBrass']
				},
				{
					type: 'ceiling',
					name: 'Circus500Pendant',
					variants: ['FiveBrass', 'FourBrass', 'SixBrass', 'ThreeBrass', 'TwoBrass'],
					materials: ['BrushedBrass']
				}
				// {
				// 	type: 'floor',
				// 	name: 'Parallel',
				// 	variants: ['Standard'],
				// 	materials: ['Base']
				// }
			]
		}
	};
}
